import type { Layout, LayoutElement } from "./layout";

export type AspectClass = "wide" | "landscape" | "square" | "portrait";

export function aspectClass(width: number, height: number): AspectClass {
  const r = width / height;
  if (r > 2.6) return "wide";
  if (r > 1.2) return "landscape";
  if (r >= 0.83) return "square";
  return "portrait";
}

export interface Template extends Layout {
  id: string;
  aspect: AspectClass;
}

/** Details the customer typed once and that fill template placeholders. */
export interface BusinessDetails {
  business: string;
  tagline: string;
  phone: string;
  website: string;
  email: string;
  name: string;
  role: string;
  headline: string;
}

export const defaultDetails: BusinessDetails = {
  business: "Your Business",
  tagline: "What you do, in a few words",
  phone: "0151 000 0000",
  website: "www.yourbusiness.co.uk",
  email: "hello@yourbusiness.co.uk",
  name: "Your Name",
  role: "Job Title",
  headline: "Grand Opening",
};

export function fillPlaceholders(layout: Layout, details: Partial<BusinessDetails>): Layout {
  const merged: BusinessDetails = { ...defaultDetails };
  for (const [k, v] of Object.entries(details)) {
    if (typeof v === "string" && v.trim()) merged[k as keyof BusinessDetails] = v.trim();
  }
  return {
    ...layout,
    elements: layout.elements.map((el) =>
      el.text
        ? { ...el, text: el.text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => merged[key as keyof BusinessDetails] ?? "") }
        : el,
    ),
  };
}

const T = (p: Partial<LayoutElement> & Pick<LayoutElement, "x" | "y" | "w" | "h" | "text">): LayoutElement => ({
  type: "text",
  color: "#111111",
  fontFamily: "Montserrat",
  fontSize: 0.1,
  align: "center",
  ...p,
});
const R = (p: Partial<LayoutElement> & Pick<LayoutElement, "x" | "y" | "w" | "h" | "color">): LayoutElement => ({
  type: "rect",
  ...p,
});
const E = (p: Partial<LayoutElement> & Pick<LayoutElement, "x" | "y" | "w" | "h" | "color">): LayoutElement => ({
  type: "ellipse",
  ...p,
});

export const templates: Template[] = [
  // ------------------------------------------------------------------ wide
  {
    id: "wide-classic",
    aspect: "wide",
    name: "Classic Fascia",
    description: "Timeless navy and gold with a serif name.",
    background: { type: "solid", colors: ["#14213d"] },
    elements: [
      R({ x: 0.03, y: 0.1, w: 0.94, h: 0.8, color: "transparent", outlineColor: "#d4af37", outlineWidth: 0.012 }),
      T({ x: 0.06, y: 0.16, w: 0.88, h: 0.46, text: "{{business}}", fontFamily: "Playfair Display", bold: true, fontSize: 0.42, color: "#f8f1e0" }),
      T({ x: 0.1, y: 0.64, w: 0.8, h: 0.16, text: "{{tagline}}", fontSize: 0.11, letterSpacing: 300, color: "#d4af37" }),
    ],
  },
  {
    id: "wide-bold",
    aspect: "wide",
    name: "Bold Modern",
    description: "Big clean lettering with a colour block for your number.",
    background: { type: "solid", colors: ["#ffffff"] },
    elements: [
      R({ x: 0.76, y: 0, w: 0.24, h: 1, color: "#e11d74" }),
      T({ x: 0.04, y: 0.14, w: 0.68, h: 0.5, text: "{{business}}", fontFamily: "Anton", fontSize: 0.46, color: "#0f172a", align: "left" }),
      T({ x: 0.04, y: 0.66, w: 0.68, h: 0.18, text: "{{tagline}}", fontFamily: "Poppins", fontSize: 0.12, color: "#475569", align: "left" }),
      T({ x: 0.77, y: 0.3, w: 0.22, h: 0.18, text: "CALL US", fontFamily: "Poppins", bold: true, fontSize: 0.1, color: "#ffffff", letterSpacing: 200 }),
      T({ x: 0.77, y: 0.48, w: 0.22, h: 0.2, text: "{{phone}}", fontFamily: "Poppins", bold: true, fontSize: 0.12, color: "#ffffff" }),
    ],
  },
  {
    id: "wide-sunset",
    aspect: "wide",
    name: "Sunset Script",
    description: "Warm gradient and a friendly script name.",
    background: { type: "gradient", colors: ["#ff7e5f", "#feb47b"], angle: 0 },
    elements: [
      T({ x: 0.05, y: 0.1, w: 0.9, h: 0.55, text: "{{business}}", fontFamily: "Pacifico", fontSize: 0.4, color: "#ffffff", shadow: true }),
      T({ x: 0.1, y: 0.68, w: 0.8, h: 0.16, text: "{{tagline}}", fontFamily: "Poppins", bold: true, fontSize: 0.12, color: "#ffffff", letterSpacing: 150 }),
    ],
  },
  {
    id: "wide-industrial",
    aspect: "wide",
    name: "Trade Pro",
    description: "High-visibility black and yellow for trades.",
    background: { type: "solid", colors: ["#111111"] },
    elements: [
      R({ x: 0, y: 0.76, w: 1, h: 0.24, color: "#facc15" }),
      T({ x: 0.04, y: 0.1, w: 0.92, h: 0.46, text: "{{business}}", fontFamily: "Bebas Neue", fontSize: 0.48, color: "#facc15", letterSpacing: 80 }),
      T({ x: 0.04, y: 0.56, w: 0.92, h: 0.17, text: "{{tagline}}", fontFamily: "Oswald", fontSize: 0.12, color: "#ffffff" }),
      T({ x: 0.04, y: 0.79, w: 0.92, h: 0.12, text: "{{phone}}  •  {{website}}", fontFamily: "Oswald", bold: true, fontSize: 0.1, color: "#111111" }),
    ],
  },
  // ------------------------------------------------------------- landscape
  {
    id: "land-clean",
    aspect: "landscape",
    name: "Clean Professional",
    description: "Crisp white card with a bold accent bar.",
    background: { type: "solid", colors: ["#ffffff"] },
    elements: [
      R({ x: 0, y: 0, w: 0.035, h: 1, color: "#e11d74" }),
      T({ x: 0.1, y: 0.14, w: 0.8, h: 0.18, text: "{{name}}", fontFamily: "Montserrat", bold: true, fontSize: 0.13, color: "#0f172a", align: "left" }),
      T({ x: 0.1, y: 0.32, w: 0.8, h: 0.1, text: "{{role}}", fontFamily: "Montserrat", fontSize: 0.065, color: "#e11d74", align: "left", letterSpacing: 100 }),
      T({ x: 0.1, y: 0.58, w: 0.8, h: 0.3, text: "{{phone}}\n{{email}}\n{{website}}", fontFamily: "Inter", fontSize: 0.06, color: "#334155", align: "left", lineHeight: 1.5 }),
    ],
  },
  {
    id: "land-luxe",
    aspect: "landscape",
    name: "Dark Luxe",
    description: "Black and gold, elegant and premium.",
    background: { type: "solid", colors: ["#0b0b0b"] },
    elements: [
      T({ x: 0.06, y: 0.24, w: 0.88, h: 0.3, text: "{{business}}", fontFamily: "Cinzel", bold: true, fontSize: 0.18, color: "#d4af37", letterSpacing: 150 }),
      R({ x: 0.38, y: 0.56, w: 0.24, h: 0.008, color: "#d4af37" }),
      T({ x: 0.08, y: 0.62, w: 0.84, h: 0.12, text: "{{tagline}}", fontFamily: "Raleway", fontSize: 0.065, color: "#e5e5e5", letterSpacing: 200 }),
    ],
  },
  {
    id: "land-pop",
    aspect: "landscape",
    name: "Colour Pop",
    description: "A vivid gradient that gets noticed.",
    background: { type: "gradient", colors: ["#6a11cb", "#2575fc"], angle: 45 },
    elements: [
      E({ x: 0.68, y: -0.25, w: 0.5, h: 0.75, color: "#ffffff", opacity: 0.12 }),
      T({ x: 0.08, y: 0.22, w: 0.84, h: 0.32, text: "{{business}}", fontFamily: "Poppins", bold: true, fontSize: 0.19, color: "#ffffff", align: "left" }),
      T({ x: 0.08, y: 0.56, w: 0.84, h: 0.12, text: "{{tagline}}", fontFamily: "Poppins", fontSize: 0.075, color: "#e0e7ff", align: "left" }),
      T({ x: 0.08, y: 0.76, w: 0.84, h: 0.1, text: "{{website}}", fontFamily: "Poppins", bold: true, fontSize: 0.065, color: "#ffffff", align: "left" }),
    ],
  },
  // ---------------------------------------------------------------- square
  {
    id: "sq-badge",
    aspect: "square",
    name: "Badge",
    description: "A circular badge, perfect for stickers and coasters.",
    background: { type: "solid", colors: ["#fef3c7"] },
    elements: [
      E({ x: 0.08, y: 0.08, w: 0.84, h: 0.84, color: "#0f766e" }),
      E({ x: 0.13, y: 0.13, w: 0.74, h: 0.74, color: "transparent", outlineColor: "#fef3c7", outlineWidth: 0.012 }),
      T({ x: 0.16, y: 0.34, w: 0.68, h: 0.22, text: "{{business}}", fontFamily: "Righteous", fontSize: 0.13, color: "#fef3c7" }),
      T({ x: 0.2, y: 0.58, w: 0.6, h: 0.1, text: "{{tagline}}", fontFamily: "Montserrat", bold: true, fontSize: 0.045, color: "#fde68a", letterSpacing: 150 }),
    ],
  },
  {
    id: "sq-retro",
    aspect: "square",
    name: "Retro Script",
    description: "Cream and cherry with a vintage script.",
    background: { type: "solid", colors: ["#fff7ed"] },
    elements: [
      E({ x: 0.06, y: 0.06, w: 0.88, h: 0.88, color: "transparent", outlineColor: "#be123c", outlineWidth: 0.025 }),
      T({ x: 0.12, y: 0.3, w: 0.76, h: 0.26, text: "{{business}}", fontFamily: "Lobster", fontSize: 0.16, color: "#be123c" }),
      T({ x: 0.16, y: 0.6, w: 0.68, h: 0.1, text: "{{tagline}}", fontFamily: "Oswald", fontSize: 0.055, color: "#7c2d12", letterSpacing: 200 }),
    ],
  },
  // -------------------------------------------------------------- portrait
  {
    id: "port-event",
    aspect: "portrait",
    name: "Event Night",
    description: "A dramatic poster for events and launches.",
    background: { type: "gradient", colors: ["#0f172a", "#581c87"], angle: 90 },
    elements: [
      T({ x: 0.08, y: 0.08, w: 0.84, h: 0.08, text: "{{business}} PRESENTS", fontFamily: "Montserrat", bold: true, fontSize: 0.045, color: "#f0abfc", letterSpacing: 300 }),
      T({ x: 0.06, y: 0.18, w: 0.88, h: 0.32, text: "{{headline}}", fontFamily: "Bebas Neue", fontSize: 0.26, color: "#ffffff", lineHeight: 0.9 }),
      T({ x: 0.1, y: 0.54, w: 0.8, h: 0.14, text: "{{tagline}}", fontFamily: "Poppins", fontSize: 0.055, color: "#e9d5ff" }),
      R({ x: 0.22, y: 0.74, w: 0.56, h: 0.07, color: "#e11d74", radius: 0.04 }),
      T({ x: 0.22, y: 0.755, w: 0.56, h: 0.045, text: "BOOK NOW", fontFamily: "Poppins", bold: true, fontSize: 0.045, color: "#ffffff", letterSpacing: 200 }),
      T({ x: 0.08, y: 0.86, w: 0.84, h: 0.06, text: "{{website}}  •  {{phone}}", fontFamily: "Inter", fontSize: 0.035, color: "#cbd5e1" }),
    ],
  },
  {
    id: "port-corporate",
    aspect: "portrait",
    name: "Corporate",
    description: "Structured and professional for banners and flyers.",
    background: { type: "solid", colors: ["#ffffff"] },
    elements: [
      R({ x: 0, y: 0, w: 1, h: 0.3, color: "#0f172a" }),
      T({ x: 0.08, y: 0.08, w: 0.84, h: 0.14, text: "{{business}}", fontFamily: "Montserrat", bold: true, fontSize: 0.12, color: "#ffffff" }),
      R({ x: 0.4, y: 0.3, w: 0.2, h: 0.008, color: "#e11d74" }),
      T({ x: 0.08, y: 0.36, w: 0.84, h: 0.12, text: "{{tagline}}", fontFamily: "Montserrat", bold: true, fontSize: 0.07, color: "#0f172a" }),
      T({ x: 0.12, y: 0.5, w: 0.76, h: 0.22, text: "✓ Friendly, local service\n✓ Quality guaranteed\n✓ Free quotes", fontFamily: "Inter", fontSize: 0.05, color: "#334155", lineHeight: 1.6 }),
      R({ x: 0, y: 0.76, w: 1, h: 0.1, color: "#e11d74" }),
      T({ x: 0.05, y: 0.785, w: 0.9, h: 0.05, text: "{{phone}}  •  {{website}}", fontFamily: "Montserrat", bold: true, fontSize: 0.045, color: "#ffffff" }),
    ],
  },
  {
    id: "port-offer",
    aspect: "portrait",
    name: "Big Offer",
    description: "Loud and proud for sales and promotions.",
    background: { type: "solid", colors: ["#facc15"] },
    elements: [
      T({ x: 0.06, y: 0.08, w: 0.88, h: 0.1, text: "{{business}}", fontFamily: "Archivo Black", fontSize: 0.07, color: "#111111" }),
      E({ x: 0.12, y: 0.2, w: 0.76, h: 0.42, color: "#dc2626" }),
      T({ x: 0.16, y: 0.3, w: 0.68, h: 0.22, text: "{{headline}}", fontFamily: "Anton", fontSize: 0.14, color: "#ffffff", lineHeight: 1 }),
      T({ x: 0.08, y: 0.66, w: 0.84, h: 0.12, text: "{{tagline}}", fontFamily: "Poppins", bold: true, fontSize: 0.06, color: "#111111" }),
      T({ x: 0.08, y: 0.82, w: 0.84, h: 0.08, text: "{{phone}}\n{{website}}", fontFamily: "Poppins", fontSize: 0.045, color: "#111111" }),
    ],
  },
];

/** Templates that suit a canvas shape best (falls back to all templates). */
export function templatesFor(width: number, height: number) {
  const cls = aspectClass(width, height);
  const neighbours: Record<AspectClass, AspectClass[]> = {
    wide: ["wide", "landscape"],
    landscape: ["landscape", "wide", "square"],
    square: ["square", "landscape", "portrait"],
    portrait: ["portrait", "square"],
  };
  const order = neighbours[cls];
  return [...templates]
    .filter((t) => order.includes(t.aspect))
    .sort((a, b) => order.indexOf(a.aspect) - order.indexOf(b.aspect));
}
