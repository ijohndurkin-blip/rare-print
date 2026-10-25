import crypto from "node:crypto";
import { after } from "next/server";
import { getProduct, estimatePrice } from "@/lib/products";
import type { Order, OrderInput, OrderSide, StoredFile } from "@/lib/orders";
import { saveOrder } from "@/lib/server/storage";
import { notifyNewOrder } from "@/lib/server/notify";
import { checkRateLimit, rateLimitResponse } from "@/lib/server/rate-limit";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newOrderId = () => {
  const bytes = crypto.randomBytes(7);
  const code = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${(process.env.ORDER_PREFIX || "RP").toUpperCase()}-${code}`;
};

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function cleanFile(f: unknown): StoredFile | undefined {
  if (!f || typeof f !== "object") return undefined;
  const file = f as StoredFile;
  const key = str(file.key, 1000);
  const validKey = key.startsWith("local:uploads/") || /^https:\/\/[a-z0-9.-]+\.blob\.vercel-storage\.com\/artwork\//i.test(key);
  if (!validKey) return undefined;
  return { key, name: str(file.name, 120), size: Number(file.size) || 0, contentType: str(file.contentType, 60) };
}

export async function POST(request: Request) {
  const limit = checkRateLimit(request, 1, "order");
  if (!limit.ok) return rateLimitResponse(limit.retryInMin);

  let input: OrderInput;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const product = getProduct(str(input.productId, 60));
  if (!product) return Response.json({ error: "Unknown product" }, { status: 400 });

  const name = str(input.customer?.name, 120);
  const email = str(input.customer?.email, 200);
  const phone = str(input.customer?.phone, 40);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone) {
    return Response.json({ error: "Please add your name, a valid email and phone number." }, { status: 400 });
  }
  const sides: OrderSide[] = (Array.isArray(input.sides) ? input.sides : []).slice(0, 4).map((s) => ({
    label: str(s.label, 30) || "Front",
    print: cleanFile(s.print),
    preview: cleanFile(s.preview),
    svg: cleanFile(s.svg),
    design: cleanFile(s.design),
    printPx: s.printPx
      ? { width: Number(s.printPx.width) || 0, height: Number(s.printPx.height) || 0, dpi: Number(s.printPx.dpi) || 0 }
      : undefined,
  }));
  if (!sides.some((s) => s.print)) return Response.json({ error: "Your artwork didn't upload. Please try again." }, { status: 400 });

  const widthMm = Math.max(1, Number(input.widthMm) || product.sizes[0].widthMm);
  const heightMm = Math.max(1, Number(input.heightMm) || product.sizes[0].heightMm);
  const material = product.materials.find((m) => m.id === input.materialId) ?? product.materials[0];
  const quantity = Math.max(1, Math.min(100000, Math.round(Number(input.quantity) || 1)));
  const now = new Date().toISOString();
  const fulfilment = (["collect", "deliver", "install"] as const).includes(input.fulfilment) ? input.fulfilment : "collect";

  const order: Order = {
    id: newOrderId(),
    createdAt: now,
    updatedAt: now,
    status: "new",
    productId: product.id,
    productName: product.name,
    widthMm,
    heightMm,
    sizeLabel: str(input.sizeLabel, 60) || `${widthMm} × ${heightMm} mm`,
    materialId: material.id,
    materialLabel: material.label,
    quantity,
    sides,
    customer: { name, email, phone, company: str(input.customer?.company, 120) || undefined },
    fulfilment,
    address: str(input.address, 500) || undefined,
    notes: str(input.notes, 2000) || undefined,
    wantProof: input.wantProof !== false,
    attachments: (Array.isArray(input.attachments) ? input.attachments : [])
      .slice(0, 10)
      .map(cleanFile)
      .filter((f): f is StoredFile => Boolean(f)),
    estimate: estimatePrice({ product, widthMm, heightMm, materialId: material.id, quantity }),
    history: [{ at: now, status: "new" }],
  };

  try {
    await saveOrder(order);
  } catch (err) {
    console.error("[orders] save failed", err);
    return Response.json({ error: "We couldn't save your order. Please try again or call us." }, { status: 500 });
  }

  const baseUrl = process.env.PUBLIC_BASE_URL || new URL(request.url).origin;
  after(() => notifyNewOrder(order, baseUrl).catch((e) => console.error("[notify]", e)));

  return Response.json({ id: order.id });
}
