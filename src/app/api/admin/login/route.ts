import crypto from "node:crypto";
import { adminConfigured, startAdminSession, endAdminSession } from "@/lib/server/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const limit = checkRateLimit(request, 1, "order");
  if (!limit.ok) return rateLimitResponse(limit.retryInMin);
  if (!adminConfigured()) {
    return Response.json({ error: "Set ADMIN_PASSWORD on the server to enable the dashboard." }, { status: 503 });
  }
  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  const a = crypto.createHash("sha256").update(String(password ?? "")).digest();
  const b = crypto.createHash("sha256").update(process.env.ADMIN_PASSWORD!).digest();
  if (!crypto.timingSafeEqual(a, b)) return Response.json({ error: "Wrong password" }, { status: 401 });
  await startAdminSession();
  return Response.json({ ok: true });
}

export async function DELETE() {
  await endAdminSession();
  return Response.json({ ok: true });
}
