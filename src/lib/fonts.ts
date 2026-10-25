/** Curated Google Fonts available in the editor (and to the AI designer). */
export interface FontDef {
  family: string;
  weights: number[];
  category: "sans" | "serif" | "display" | "script" | "handwriting";
}

export const FONTS: FontDef[] = [
  { family: "Inter", weights: [400, 700, 800], category: "sans" },
  { family: "Montserrat", weights: [400, 700, 800], category: "sans" },
  { family: "Poppins", weights: [400, 600, 700, 800], category: "sans" },
  { family: "Raleway", weights: [400, 700], category: "sans" },
  { family: "Space Grotesk", weights: [400, 700], category: "sans" },
  { family: "Oswald", weights: [400, 700], category: "display" },
  { family: "Bebas Neue", weights: [400], category: "display" },
  { family: "Anton", weights: [400], category: "display" },
  { family: "Archivo Black", weights: [400], category: "display" },
  { family: "Righteous", weights: [400], category: "display" },
  { family: "Bangers", weights: [400], category: "display" },
  { family: "Abril Fatface", weights: [400], category: "display" },
  { family: "Playfair Display", weights: [400, 700], category: "serif" },
  { family: "Merriweather", weights: [400, 700], category: "serif" },
  { family: "Roboto Slab", weights: [400, 700], category: "serif" },
  { family: "Cinzel", weights: [400, 700], category: "serif" },
  { family: "Lobster", weights: [400], category: "script" },
  { family: "Pacifico", weights: [400], category: "script" },
  { family: "Dancing Script", weights: [400, 700], category: "script" },
  { family: "Great Vibes", weights: [400], category: "script" },
  { family: "Caveat", weights: [400, 700], category: "handwriting" },
  { family: "Permanent Marker", weights: [400], category: "handwriting" },
];

export const FONT_FAMILIES = FONTS.map((f) => f.family);

export const googleFontsHref = (() => {
  const families = FONTS.map((f) => {
    const name = f.family.replace(/ /g, "+");
    return f.weights.length === 1 && f.weights[0] === 400
      ? `family=${name}`
      : `family=${name}:wght@${f.weights.join(";")}`;
  });
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
})();

/** Ensure a font face is ready before fabric measures text with it. */
export async function ensureFont(family: string, bold = false) {
  if (typeof document === "undefined" || !document.fonts) return;
  const def = FONTS.find((f) => f.family === family);
  const weight = bold && def && def.weights.some((w) => w >= 600) ? 700 : 400;
  try {
    await document.fonts.load(`${weight} 40px "${family}"`);
  } catch {
    // Fall back silently: fabric will render with the browser fallback font.
  }
}
