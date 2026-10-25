import { driver, saveLocalUpload } from "@/lib/server/storage";
import { checkRateLimit, rateLimitResponse } from "@/lib/server/rate-limit";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from "@/lib/server/uploads";

export const maxDuration = 60;

/** Upload endpoint used when running without Vercel Blob (VPS / Docker). */
export async function POST(request: Request) {
  if (driver !== "local") return Response.json({ error: "Use Blob uploads" }, { status: 400 });
  const limit = checkRateLimit(request, 1, "upload");
  if (!limit.ok) return rateLimitResponse(limit.retryInMin);
  const type = (request.headers.get("content-type") || "").split(";")[0];
  if (!ALLOWED_UPLOAD_TYPES.includes(type)) return Response.json({ error: "File type not allowed" }, { status: 415 });
  const size = Number(request.headers.get("content-length") || 0);
  if (size > MAX_UPLOAD_BYTES) return Response.json({ error: "File too large" }, { status: 413 });
  const data = await request.arrayBuffer();
  if (data.byteLength > MAX_UPLOAD_BYTES) return Response.json({ error: "File too large" }, { status: 413 });
  const name = new URL(request.url).searchParams.get("name") || "file";
  const key = await saveLocalUpload(name, data);
  return Response.json({ key });
}
