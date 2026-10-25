import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { checkRateLimit, rateLimitResponse } from "@/lib/server/rate-limit";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from "@/lib/server/uploads";

/** Issues short-lived tokens so the browser can upload print files straight to Vercel Blob. */
export async function POST(request: Request) {
  const limit = checkRateLimit(request, 1, "upload");
  if (!limit.ok) return rateLimitResponse(limit.retryInMin);
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("artwork/")) throw new Error("Invalid upload path");
        return {
          allowedContentTypes: ALLOWED_UPLOAD_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 15 * 60 * 1000,
        };
      },
    });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}
