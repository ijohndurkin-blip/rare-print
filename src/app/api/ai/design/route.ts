import { getProduct } from "@/lib/products";
import { layoutJsonSchema, sanitizeLayout, type Layout } from "@/lib/layout";
import { FONTS } from "@/lib/fonts";
import { getOpenAI, TEXT_MODEL, reasoningParams, friendlyAIError } from "@/lib/server/openai";
import { checkRateLimit, rateLimitResponse } from "@/lib/server/rate-limit";

export const maxDuration = 60;

interface Body {
  productId: string;
  widthMm: number;
  heightMm: number;
  side?: string;
  brief: string;
  style?: string;
  colors?: string;
  details?: Record<string, string>;
  includeImage?: boolean;
}

export async function POST(request: Request) {
  const limit = checkRateLimit(request, 1);
  if (!limit.ok) return rateLimitResponse(limit.retryInMin);

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const product = getProduct(body.productId);
  if (!product) return Response.json({ error: "Unknown product" }, { status: 400 });
  const brief = String(body.brief ?? "").slice(0, 1500);
  if (!brief.trim() && !body.details?.business) {
    return Response.json({ error: "Tell the AI a little about what you need first." }, { status: 400 });
  }

  const widthMm = Math.max(10, Number(body.widthMm) || product.sizes[0].widthMm);
  const heightMm = Math.max(10, Number(body.heightMm) || product.sizes[0].heightMm);
  const totalW = widthMm + product.bleedMm * 2;
  const totalH = heightMm + product.bleedMm * 2;
  const safeX = (product.bleedMm + product.safeMm) / totalW;
  const safeY = (product.bleedMm + product.safeMm) / totalH;
  const shortSide = Math.min(totalW, totalH);
  const orientation = totalW > totalH ? "landscape (wider than tall)" : totalW < totalH ? "portrait (taller than wide)" : "square";

  const details = Object.entries(body.details ?? {})
    .filter(([, v]) => typeof v === "string" && v.trim())
    .map(([k, v]) => `- ${k}: ${String(v).slice(0, 200)}`)
    .join("\n");

  const system = `You are an award-winning graphic designer at a print shop. You create print-ready layouts that non-designers love.
You output designs as JSON layouts that are rendered into an editable canvas.

COORDINATE SYSTEM
- x and w are fractions (0..1) of the canvas WIDTH; y and h are fractions of the canvas HEIGHT. (x,y) is the top-left corner of the element's box.
- fontSize is a fraction of the canvas's SHORTER side (${shortSide.toFixed(0)}mm). e.g. fontSize 0.1 = text about ${(shortSide * 0.1).toFixed(0)}mm tall.
- Text boxes wrap within w. Use h as the space the text may occupy; text auto-shrinks to fit. Use "\\n" for deliberate line breaks.
- For "line" elements, (x,y) is the start point and (w,h) is the offset to the end point; outlineWidth is the line thickness as a fraction of the shorter side.
- radius (rects only) and outlineWidth are fractions of the shorter side. letterSpacing is in 1/1000 em (e.g. 100-400 for spaced caps). lineHeight ~1.0-1.6.
- color "transparent" is allowed for rect/ellipse fills when you only want an outline.
- Elements are drawn in array order (first = back). The background fills the whole canvas including bleed.

PRINT RULES
- Keep ALL text and important content inside the safe area: x from ${safeX.toFixed(3)} to ${(1 - safeX).toFixed(3)}, y from ${safeY.toFixed(3)} to ${(1 - safeY).toFixed(3)}.
- Strong contrast between text and what is behind it. Legibility first. Max 2-3 fonts per design.
- Use the customer's real details exactly as given. Never invent phone numbers, emails or addresses; if not provided leave them out.
- Use only these fonts: ${FONTS.map((f) => `${f.family} (${f.category}${f.weights.some((w) => w >= 700) ? ", has bold" : ""})`).join(", ")}.
${body.includeImage ? `- Each design MUST include exactly one "image" element with a vivid imagePrompt describing artwork for that slot (a photo, illustration or pattern). The imagePrompt must ask for NO text, letters or words. Set transparentBackground true for cut-out illustrations/logos/icons that sit on the background, false for full-bleed photos or backgrounds. For a full-background image use x:0,y:0,w:1,h:1 and put text on top with good contrast (e.g. a semi-transparent rect behind text).` : `- Do NOT use image elements; use typography, colour, shapes and lines only.`}
- Return exactly 3 designs that are clearly different from each other (e.g. classic, bold/modern, playful), each polished enough to print as-is.`;

  const user = `PRODUCT: ${product.name} — ${product.description}
PRODUCT NOTES: ${product.aiHint}
SIDE: ${body.side ?? product.sides[0]}
FINISHED SIZE: ${widthMm} × ${heightMm} mm (canvas incl. bleed: ${totalW} × ${totalH} mm, ${orientation}, aspect ratio ${(totalW / totalH).toFixed(2)}:1)

CUSTOMER BRIEF: ${brief || "(none — use the business details)"}
${body.style ? `STYLE WANTED: ${String(body.style).slice(0, 200)}` : ""}
${body.colors ? `COLOURS WANTED: ${String(body.colors).slice(0, 200)}` : ""}
${details ? `CUSTOMER DETAILS:\n${details}` : ""}`;

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: TEXT_MODEL,
      ...reasoningParams(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "print_layouts", strict: true, schema: layoutJsonSchema as unknown as Record<string, unknown> },
      },
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");
    const parsed = JSON.parse(content) as { designs: Layout[] };
    const designs = (parsed.designs ?? []).slice(0, 3).map(sanitizeLayout);
    return Response.json({ designs });
  } catch (err) {
    const { message, status } = friendlyAIError(err);
    return Response.json({ error: message }, { status });
  }
}
