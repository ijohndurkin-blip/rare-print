import "server-only";
import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new AIConfigError("The AI assistant isn't set up yet. Add OPENAI_API_KEY to the server environment.");
  }
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export class AIConfigError extends Error {}

export const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-5.4-mini";
export const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
export const IMAGE_MODEL_TRANSPARENT = process.env.OPENAI_IMAGE_MODEL_TRANSPARENT || "gpt-image-1.5";
export const IMAGE_QUALITY = (process.env.OPENAI_IMAGE_QUALITY || "medium") as "low" | "medium" | "high";

/** Reasoning models accept a reasoning effort; older chat models reject it. */
export function reasoningParams(model = TEXT_MODEL) {
  if (!/^(gpt-5|gpt-6|o\d)/.test(model)) return {};
  const effort = (process.env.OPENAI_REASONING_EFFORT || "low") as "none" | "minimal" | "low" | "medium" | "high";
  return { reasoning_effort: effort };
}

/** Translate SDK errors into a short message that is safe to show customers. */
export function friendlyAIError(err: unknown): { message: string; status: number } {
  if (err instanceof AIConfigError) return { message: err.message, status: 503 };
  if (err instanceof OpenAI.APIError) {
    console.error("[openai]", err.status, err.message);
    if (err.status === 429) return { message: "The AI is busy right now. Please try again in a moment.", status: 429 };
    if (err.status === 400 && /safety|moderation|content_policy/i.test(err.message)) {
      return { message: "That request was blocked by the AI safety filter. Try wording it differently.", status: 400 };
    }
    if (err.status === 401) return { message: "The AI key is invalid. Please contact the print shop.", status: 503 };
    return { message: "The AI couldn't complete that request. Please try again.", status: 502 };
  }
  console.error("[ai]", err);
  return { message: "Something went wrong talking to the AI. Please try again.", status: 500 };
}
