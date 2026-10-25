import { isAdmin } from "@/lib/server/auth";
import { getOrder, saveOrder } from "@/lib/server/storage";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/orders/[id]">) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { status?: OrderStatus; note?: string };
  if (!body.status || !ORDER_STATUSES.some((s) => s.id === body.status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }
  const now = new Date().toISOString();
  order.status = body.status;
  order.updatedAt = now;
  order.history = [...(order.history ?? []), { at: now, status: body.status, note: body.note?.slice(0, 500) }];
  await saveOrder(order);
  return Response.json({ order });
}
