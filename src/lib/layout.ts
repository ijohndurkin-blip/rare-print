/**
 * A resolution-independent description of a design. Both the AI designer and
 * the built-in templates produce this format; the editor turns it into
 * editable canvas objects.
 *
 * All positions/sizes are fractions (0..1) of the canvas width (x, w) and
 * height (y, h). Font sizes are fractions of the canvas's SHORTER side.
 */
import { FONT_FAMILIES } from "./fonts";

export type ElementType = "text" | "rect" | "ellipse" | "line" | "image";

export interface LayoutElement {
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  text?: string | null;
  fontFamily?: string | null;
  fontSize?: number | null;
  bold?: boolean | null;
  italic?: boolean | null;
  align?: "left" | "center" | "right" | null;
  letterSpacing?: number | null;
  lineHeight?: number | null;
  outlineColor?: string | null;
  outlineWidth?: number | null;
  shadow?: boolean | null;
  radius?: number | null;
  opacity?: number | null;
  /** For image elements: what the AI should paint into this slot. */
  imagePrompt?: string | null;
  transparentBackground?: boolean | null;
  /** For image elements in templates: a ready image URL. */
  src?: string | null;
}

export interface LayoutBackground {
  type: "solid" | "gradient";
  colors: string[];
  angle?: number | null;
}

export interface Layout {
  name: string;
  description?: string | null;
  background: LayoutBackground;
  elements: LayoutElement[];
}

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: "null" }] });

/** JSON schema for OpenAI structured outputs (strict mode). */
export const layoutJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["designs"],
  properties: {
    designs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "description", "background", "elements"],
        properties: {
          name: { type: "string", description: "Short catchy name for this design direction" },
          description: { type: "string", description: "One sentence explaining the idea" },
          background: {
            type: "object",
            additionalProperties: false,
            required: ["type", "colors", "angle"],
            properties: {
              type: { type: "string", enum: ["solid", "gradient"] },
              colors: { type: "array", items: { type: "string", description: "hex colour like #1a2b3c" } },
              angle: nullable({ type: "number", description: "gradient angle in degrees" }),
            },
          },
          elements: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "type", "x", "y", "w", "h", "color", "text", "fontFamily", "fontSize", "bold", "italic",
                "align", "letterSpacing", "lineHeight", "outlineColor", "outlineWidth", "shadow", "radius",
                "opacity", "imagePrompt", "transparentBackground",
              ],
              properties: {
                type: { type: "string", enum: ["text", "rect", "ellipse", "line", "image"] },
                x: { type: "number" },
                y: { type: "number" },
                w: { type: "number" },
                h: { type: "number" },
                color: { type: "string", description: "hex fill/text colour" },
                text: nullable({ type: "string" }),
                fontFamily: nullable({ type: "string", enum: FONT_FAMILIES }),
                fontSize: nullable({ type: "number" }),
                bold: nullable({ type: "boolean" }),
                italic: nullable({ type: "boolean" }),
                align: nullable({ type: "string", enum: ["left", "center", "right"] }),
                letterSpacing: nullable({ type: "number" }),
                lineHeight: nullable({ type: "number" }),
                outlineColor: nullable({ type: "string" }),
                outlineWidth: nullable({ type: "number" }),
                shadow: nullable({ type: "boolean" }),
                radius: nullable({ type: "number" }),
                opacity: nullable({ type: "number" }),
                imagePrompt: nullable({ type: "string" }),
                transparentBackground: nullable({ type: "boolean" }),
              },
            },
          },
        },
      },
    },
  },
} as const;

/** Clamp numbers and drop junk so a slightly-off AI response still renders. */
export function sanitizeLayout(input: Layout): Layout {
  const clamp = (n: unknown, min: number, max: number, fallback: number) =>
    typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  const hex = (c: unknown, fallback: string) =>
    c === "transparent" ? c : typeof c === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c.trim()) ? c.trim() : fallback;
  return {
    name: String(input.name ?? "Design").slice(0, 60),
    description: input.description ? String(input.description).slice(0, 200) : null,
    background: {
      type: input.background?.type === "gradient" ? "gradient" : "solid",
      colors: (input.background?.colors ?? []).slice(0, 3).map((c) => hex(c, "#ffffff")),
      angle: clamp(input.background?.angle, 0, 360, 90),
    },
    elements: (input.elements ?? []).slice(0, 25).map((el) => ({
      ...el,
      x: clamp(el.x, -0.2, 1.2, 0),
      y: clamp(el.y, -0.2, 1.2, 0),
      w: el.type === "line" ? clamp(el.w, -1.2, 1.2, 0.5) : clamp(el.w, 0.01, 1.4, 0.5),
      h: el.type === "line" ? clamp(el.h, -1.2, 1.2, 0) : clamp(el.h, 0.005, 1.4, 0.2),
      color: hex(el.color, "#111111"),
      fontSize: el.fontSize == null ? null : clamp(el.fontSize, 0.01, 0.9, 0.1),
      opacity: el.opacity == null ? null : clamp(el.opacity, 0.05, 1, 1),
      outlineColor: el.outlineColor ? hex(el.outlineColor, "#000000") : null,
      fontFamily: el.fontFamily && FONT_FAMILIES.includes(el.fontFamily) ? el.fontFamily : el.fontFamily ? "Montserrat" : null,
    })),
  };
}
