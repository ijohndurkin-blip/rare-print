import { getProduct } from "@/lib/products";
import { getOpenAI, TEXT_MODEL, reasoningParams, friendlyAIError } from "@/lib/server/openai";
import { checkRateLimit, rateLimitResponse } from "@/lib/server/rate-limit";

export const maxDuration = 60;

export async function POST(request: Request) {
  const limit = checkRateLimit(request, 1);
  if (!limit.ok) return rateLimitResponse(limit.retryInMin);

  let body: { image?: string; productId?: string; widthMm?: number; heightMm?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const product = getProduct(String(body.productId));
  if (!product) return Response.json({ error: "Unknown product" }, { status: 400 });
  if (!body.image?.startsWith("data:image/") || body.image.length > 3_000_000) {
    return Response.json({ error: "Preview image missing or too large" }, { status: 400 });
  }

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: TEXT_MODEL,
      ...reasoningParams(),
      messages: [
        {
          role: "system",
          content:
            "You are a friendly senior designer at a UK print shop reviewing a customer's artwork before it is printed. Be encouraging, concrete and brief. Judge legibility at the real viewing distance, contrast, hierarchy, spelling, balance and whether anything important sits too close to the edge. The dashed line on the preview (if any) is not part of the design.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This is a ${product.name} printed at ${body.widthMm} × ${body.heightMm} mm. ${product.aiHint} Review it.`,
            },
            { type: "image_url", image_url: { url: body.image, detail: "high" } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "design_review",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["score", "summary", "strengths", "improvements"],
            properties: {
              score: { type: "integer", description: "1-10 print readiness score" },
              summary: { type: "string", description: "one or two friendly sentences" },
              strengths: { type: "array", items: { type: "string" } },
              improvements: { type: "array", items: { type: "string" }, description: "specific, actionable fixes" },
            },
          },
        },
      },
    });
    const review = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return Response.json({ review });
  } catch (err) {
    const { message, status } = friendlyAIError(err);
    return Response.json({ error: message }, { status });
  }
}
