import { isAdmin } from "@/lib/server/auth";
import { listOrders, signedFileUrl, storageIsEphemeral, driver } from "@/lib/server/storage";
import type { Order } from "@/lib/orders";

export type AdminOrder = Order & { links: Record<string, Record<string, string>>; attachmentLinks: { name: string; url: string }[] };

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorised" }, { status: 401 });
  const orders = await listOrders();
  const withLinks: AdminOrder[] = orders.map((o) => ({
    ...o,
    links: Object.fromEntries(
      o.sides.map((s, i) => [
        String(i),
        Object.fromEntries(
          (["print", "preview", "svg", "design"] as const)
            .filter((k) => s[k])
            .map((k) => [k, signedFileUrl(s[k]!.key)]),
        ),
      ]),
    ),
    attachmentLinks: (o.attachments ?? []).map((f) => ({ name: f.name, url: signedFileUrl(f.key) })),
  }));
  return Response.json({ orders: withLinks, storage: { driver, ephemeral: storageIsEphemeral } });
}
