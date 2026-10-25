import { getOpenAI, IMAGE_MODEL, IMAGE_MODEL_TRANSPARENT, IMAGE_QUALITY, friendlyAIError } from "@/lib/server/openai";
import { checkRateLimit, rateLimitResponse } from "@/lib/server/rate-limit";

export const maxDuration = 120;

const STYLE_HINTS: Record<string, string> = {
  photo: "Photorealistic, professional commercial photography, sharp focus, beautiful lighting.",
  illustration: "Clean modern vector-style illustration, bold shapes, crisp edges, flat colours.",
  watercolour: "Soft watercolour painting with visible paper texture and gentle colour bleeds.",
  retro: "Retro vintage poster style, halftone texture, limited warm colour palette.",
  minimal: "Minimal, elegant, lots of negative space, subtle and sophisticated.",
  pattern: "Seamless decorative pattern, evenly distributed, suitable as a background.",
  logo: "Simple iconic emblem/mascot artwork, centred, bold outlines, flat colours, works at small sizes.",
};

/** Pick a generation size that matches the print aspect ratio. */
function pickSize(model: string, ratio: number): string {
  if (/^gpt-image-2/.test(model)) {
    const r = Math.min(3, Math.max(1 / 3, ratio));
    const long = IMAGE_QUALITY === "high" || r >= 2 || r <= 0.5 ? 2048 : 1536;
    const round16 = (n: number) => Math.max(512, Math.round(n / 16) * 16);
    return r >= 1 ? `${long}x${round16(long / r)}` : `${round16(long * r)}x${long}`;
  }
  if (ratio > 1.2) return "1536x1024";
  if (ratio < 0.83) return "1024x1536";
  return "1024x1024";
}

export async function POST(request: Request) {
  const limit = checkRateLimit(request, 3);
  if (!limit.ok) return rateLimitResponse(limit.retryInMin);

  let body: { prompt?: string; ratio?: number; transparent?: boolean; style?: string; productName?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const prompt = String(body.prompt ?? "").trim().slice(0, 2000);
  if (!prompt) return Response.json({ error: "Describe the image you'd like first." }, { status: 400 });

  const transparent = Boolean(body.transparent);
  const model = transparent ? IMAGE_MODEL_TRANSPARENT : IMAGE_MODEL;
  const ratio = Number(body.ratio) > 0 ? Number(body.ratio) : 1;
  const style = body.style && STYLE_HINTS[body.style] ? STYLE_HINTS[body.style] : "";

  const fullPrompt = [
    `Artwork for a printed ${body.productName ?? "product"}.`,
    prompt,
    style,
    transparent
      ? "Isolated subject on a fully transparent background, no shadow box, no frame."
      : "Fill the entire frame edge to edge.",
    "Absolutely no text, letters, words, numbers, logos of real brands or watermarks in the image.",
    "High detail, print quality.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const result = await getOpenAI().images.generate({
      model,
      prompt: fullPrompt,
      size: pickSize(model, ratio),
      quality: IMAGE_QUALITY,
      background: transparent ? "transparent" : "opaque",
      output_format: "webp",
      output_compression: 92,
      n: 1,
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image returned");
    return Response.json({ image: `data:image/webp;base64,${b64}` });
  } catch (err) {
    const { message, status } = friendlyAIError(err);
    return Response.json({ error: message }, { status });
  }
}
