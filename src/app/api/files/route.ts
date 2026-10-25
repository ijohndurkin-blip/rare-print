import { readFile, verify } from "@/lib/server/storage";

/** Serves stored artwork. Links are HMAC-signed so they can be emailed safely. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";
  if (!verify(key, url.searchParams.get("t"))) return new Response("Not found", { status: 404 });
  const file = await readFile(key);
  if (!file) return new Response("Not found", { status: 404 });
  if ("redirect" in file) return Response.redirect(file.redirect, 302);
  const body: BodyInit = Buffer.isBuffer(file.body) ? new Uint8Array(file.body) : (file.body as ReadableStream);
  return new Response(body, {
    headers: {
      "Content-Type": file.contentType || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
