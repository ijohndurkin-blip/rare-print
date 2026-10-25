import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { put, list, get } from "@vercel/blob";
import type { Order } from "@/lib/orders";

/**
 * Storage for orders and uploaded artwork.
 *
 * - On Vercel, connect a Blob store (BLOB_READ_WRITE_TOKEN is then set
 *   automatically) and everything is stored there.
 * - On a VPS / Docker, files are written to DATA_DIR (default ./data).
 */
export type Driver = "blob" | "local";

export const driver: Driver = process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local";
export const blobAccess = (process.env.BLOB_ACCESS === "private" ? "private" : "public") as "public" | "private";

const DATA_DIR = path.resolve(process.env.DATA_DIR || (process.env.VERCEL ? "/tmp/rare-print-data" : "./data"));

/** True when orders would be lost on redeploy (Vercel without Blob). */
export const storageIsEphemeral = driver === "local" && Boolean(process.env.VERCEL);

const secret = () => process.env.APP_SECRET || process.env.ADMIN_PASSWORD || "dev-secret-change-me";

export function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url").slice(0, 32);
}

export function verify(value: string, signature: string | null | undefined) {
  if (!signature) return false;
  const expected = Buffer.from(sign(value));
  const given = Buffer.from(signature);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

/** A download link that works without logging in (used in emails/admin). */
export function signedFileUrl(key: string, baseUrl = "") {
  return `${baseUrl}/api/files?key=${encodeURIComponent(key)}&t=${sign(key)}`;
}

// ------------------------------------------------------------------ files

const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);

export async function saveLocalUpload(name: string, data: ArrayBuffer): Promise<string> {
  const rel = path.posix.join("uploads", `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeName(name)}`);
  const abs = path.join(DATA_DIR, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, Buffer.from(data));
  return `local:${rel}`;
}

export async function readFile(key: string): Promise<{ body: ReadableStream | Buffer; contentType?: string } | { redirect: string } | null> {
  if (key.startsWith("local:")) {
    const rel = key.slice("local:".length);
    const abs = path.resolve(DATA_DIR, rel);
    if (!abs.startsWith(DATA_DIR + path.sep)) return null;
    try {
      return { body: await fs.readFile(abs), contentType: contentTypeFor(abs) };
    } catch {
      return null;
    }
  }
  if (/^https:\/\/[a-z0-9.-]+\.blob\.vercel-storage\.com\//i.test(key)) {
    if (blobAccess === "public") return { redirect: key };
    const result = await get(key, { access: "private" });
    if (!result || result.statusCode !== 200) return null;
    return { body: result.stream, contentType: result.blob.contentType };
  }
  return null;
}

function contentTypeFor(file: string) {
  const ext = path.extname(file).toLowerCase();
  return (
    {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".json": "application/json",
      ".pdf": "application/pdf",
    } as Record<string, string>
  )[ext] ?? "application/octet-stream";
}

// ------------------------------------------------------------------ orders

// The signature suffix keeps order files unguessable even in a public Blob store.
const orderPath = (id: string) => `orders/${id}--${sign(`order:${id}`).slice(0, 16)}.json`;

export async function saveOrder(order: Order) {
  const json = JSON.stringify(order, null, 2);
  if (driver === "blob") {
    await put(orderPath(order.id), json, {
      access: blobAccess,
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    return;
  }
  const abs = path.join(DATA_DIR, orderPath(order.id));
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, json);
}

async function readBlobJson(urlOrPath: string) {
  if (blobAccess === "private") {
    const result = await get(urlOrPath, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    return JSON.parse(await new Response(result.stream).text());
  }
  const res = await fetch(`${urlOrPath}?v=${Date.now()}`, { cache: "no-store" });
  return res.ok ? res.json() : null;
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!/^[A-Z0-9-]{4,40}$/i.test(id)) return null;
  if (driver === "blob") {
    const { blobs } = await list({ prefix: orderPath(id), limit: 1 });
    return blobs[0] ? ((await readBlobJson(blobs[0].url)) as Order) : null;
  }
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, orderPath(id)), "utf8"));
  } catch {
    return null;
  }
}

export async function listOrders(): Promise<Order[]> {
  let orders: Order[] = [];
  if (driver === "blob") {
    let cursor: string | undefined;
    const urls: string[] = [];
    do {
      const page = await list({ prefix: "orders/", cursor, limit: 1000 });
      urls.push(...page.blobs.filter((b) => b.pathname.endsWith(".json") && b.pathname.split("/").length === 2).map((b) => b.url));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    orders = (await Promise.all(urls.map((u) => readBlobJson(u).catch(() => null)))).filter(Boolean) as Order[];
  } else {
    const dir = path.join(DATA_DIR, "orders");
    try {
      const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
      orders = await Promise.all(files.map(async (f) => JSON.parse(await fs.readFile(path.join(dir, f), "utf8")) as Order));
    } catch {
      orders = [];
    }
  }
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
