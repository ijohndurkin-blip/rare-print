"use client";

import type { StoredFile } from "@/lib/orders";

let info: Promise<{ driver: "blob" | "local"; access: "public" | "private" }> | null = null;

/** Upload a file either straight to Vercel Blob or to this server's disk. */
export async function uploadFile(blob: Blob, name: string, folder: string): Promise<StoredFile> {
  info ??= fetch("/api/storage").then((r) => r.json());
  const { driver, access } = await info;
  const contentType = blob.type || "application/octet-stream";
  if (driver === "blob") {
    const { upload } = await import("@vercel/blob/client");
    const res = await upload(`artwork/${folder}/${name}`, blob, {
      access,
      handleUploadUrl: "/api/upload",
      contentType,
      multipart: blob.size > 8 * 1024 * 1024,
    });
    return { key: res.url, name, size: blob.size, contentType };
  }
  const res = await fetch(`/api/upload/local?name=${encodeURIComponent(name)}`, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return { key: data.key, name, size: blob.size, contentType };
}

export function dataUrlToBlob(dataUrl: string) {
  const [head, b64] = dataUrl.split(",");
  const type = head.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
