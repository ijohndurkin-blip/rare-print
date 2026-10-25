import "server-only";

export const ALLOWED_UPLOAD_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/json",
  "application/pdf",
];

export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 80) * 1024 * 1024;
