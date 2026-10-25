import { driver, blobAccess } from "@/lib/server/storage";

/** Tells the browser how to upload artwork (direct to Blob, or via this server). */
export function GET() {
  return Response.json({ driver, access: blobAccess });
}
