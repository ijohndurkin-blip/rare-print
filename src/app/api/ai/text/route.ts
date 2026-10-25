import { getOpenAI, TEXT_MODEL, reasoningParams, friendlyAIError } from "@/lib/server/openai";
import { checkRateLimit, rateLimitResponse } from "@/lib/server/rate-limit";

export const maxDuration = 60;

const MODES: Record<string, string> = {
  slogans: "Write 6 short, catchy slogans or taglines (max 8 words each).",
  headlines: "Write 6 punchy headlines for this printed item (max 6 words each).",
  offers: "Write 6 short promotional offer lines (e.g. opening offers, discounts, calls to action).",
  rewrite:
    "Rewrite the customer's text in 6 different ways: shorter, punchier, more professional, friendlier, more premium, more fun. Keep the meaning and any real details.",
  body: "Write 4 short paragraphs of persuasive body copy (2-3 sentences each) suitable for this printed item.",
};

export async function POST(request: Request) {
  const limit = checkRateLimit(request, 1);
  if (!limit.ok) return rateLimitResponse(limit.retryInMin);

  let body: { mode?: string; business?: string; brief?: string; text?: string; productName?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const mode = body.mode && MODES[body.mode] ? body.mode : "slogans";
  const context = [
    body.productName && `Printed item: ${body.productName}`,
    body.business && `Business: ${String(body.business).slice(0, 200)}`,
    body.brief && `About: ${String(body.brief).slice(0, 800)}`,
    body.text && `Customer's text: ${String(body.text).slice(0, 800)}`,
  ]
    .filter(Boolean)
    .join("\n");
  if (!context) return Response.json({ error: "Tell the AI what your business does first." }, { status: 400 });

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: TEXT_MODEL,
      ...reasoningParams(),
      messages: [
        {
          role: "system",
          content:
            "You are a brilliant UK copywriter for small businesses. Use British English. Be specific to the business, avoid clichés, never invent phone numbers, prices or addresses.",
        },
        { role: "user", content: `${MODES[mode]}\n\n${context}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "copy_suggestions",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["suggestions"],
            properties: { suggestions: { type: "array", items: { type: "string" } } },
          },
        },
      },
    });
    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as { suggestions?: string[] };
    return Response.json({ suggestions: (parsed.suggestions ?? []).slice(0, 8).map((s) => String(s).slice(0, 400)) });
  } catch (err) {
    const { message, status } = friendlyAIError(err);
    return Response.json({ error: message }, { status });
  }
}
