import "server-only";

/**
 * Small in-memory rate limiter to stop one visitor burning through the
 * OpenAI budget. It is per server instance (best-effort on serverless),
 * which is enough to stop casual abuse.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

const LIMITS: Record<string, number> = {
  ai: Number(process.env.AI_REQUESTS_PER_HOUR || 60),
  upload: 200,
  order: 20,
};
const WINDOW_MS = 60 * 60 * 1000;

export function clientKey(request: Request) {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || request.headers.get("x-real-ip") || "local").trim();
}

export function checkRateLimit(
  request: Request,
  cost = 1,
  namespace = "ai",
): { ok: true } | { ok: false; retryInMin: number } {
  const key = `${namespace}:${clientKey(request)}`;
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }
  if (bucket.count + cost > (LIMITS[namespace] ?? 60)) {
    return { ok: false, retryInMin: Math.ceil((bucket.resetAt - now) / 60000) };
  }
  bucket.count += cost;
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }
  return { ok: true };
}

export function rateLimitResponse(retryInMin: number) {
  return Response.json(
    { error: `Too many requests this hour. Please try again in about ${retryInMin} minutes.` },
    { status: 429 },
  );
}
