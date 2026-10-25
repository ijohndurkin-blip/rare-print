/**
 * Product catalogue. Each product defines its printable area, finishing
 * options and a simple pricing model used for on-screen estimates.
 *
 * Prices are placeholder estimates; the printer confirms the final quote
 * with the customer before anything is printed.
 */

export type CategoryId = "signage" | "print" | "display" | "promo";

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
}

export const categories: Category[] = [
  { id: "signage", name: "Signage", blurb: "Shop signs, hanging signs, A-boards and window graphics." },
  { id: "print", name: "Print", blurb: "Business cards, leaflets, posters, menus and stickers." },
  { id: "display", name: "Display", blurb: "Roller banners, PVC banners and wall graphics." },
  { id: "promo", name: "Promo gifts", blurb: "Mugs, tote bags and coasters with your brand on." },
];

export interface SizePreset {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
}

export interface Material {
  id: string;
  label: string;
  description: string;
  /** Multiplier applied to the base price. */
  priceFactor: number;
}

export type Pricing =
  | { type: "area"; perSqm: number; min: number }
  | { type: "unit"; each: number }
  | { type: "tiers"; tiers: Record<number, number> };

export type MockupKind =
  | "shopfront"
  | "hanging"
  | "aboard"
  | "window"
  | "van"
  | "card"
  | "paper"
  | "sticker"
  | "rollerbanner"
  | "banner"
  | "wall"
  | "mug"
  | "tote"
  | "coaster";

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  tagline: string;
  description: string;
  /** Emoji shown on product tiles. */
  emoji: string;
  sizes: SizePreset[];
  customSize?: { minW: number; maxW: number; minH: number; maxH: number };
  bleedMm: number;
  safeMm: number;
  shape?: "rect" | "circle";
  sides: string[];
  /** DPI the print file is exported at (capped for very large items). */
  targetDpi: number;
  /** Below this effective DPI an uploaded image is flagged as low quality. */
  minDpi: number;
  materials: Material[];
  quantities: number[];
  pricing: Pricing;
  mockup: MockupKind;
  /** Extra context handed to the AI so its designs suit the product. */
  aiHint: string;
  popular?: boolean;
}

const a = (w: number, h: number, label?: string): SizePreset => ({
  id: `${w}x${h}`,
  label: label ?? `${w} × ${h} mm`,
  widthMm: w,
  heightMm: h,
});

export const products: Product[] = [
  // ---------------------------------------------------------------- Signage
  {
    id: "shop-sign",
    name: "Shop Sign",
    category: "signage",
    tagline: "The fascia sign above your shop front",
    description:
      "Full colour fascia signs on Dibond, acrylic or as a tray sign. Built to last outdoors and readable from across the street.",
    emoji: "🏪",
    sizes: [
      a(2400, 600, "2.4m × 0.6m"),
      a(3000, 600, "3m × 0.6m"),
      a(3600, 750, "3.6m × 0.75m"),
      a(4800, 900, "4.8m × 0.9m"),
      a(6000, 1000, "6m × 1m"),
    ],
    customSize: { minW: 300, maxW: 12000, minH: 200, maxH: 3000 },
    bleedMm: 10,
    safeMm: 40,
    sides: ["Front"],
    targetDpi: 100,
    minDpi: 40,
    materials: [
      { id: "dibond", label: "Dibond (aluminium composite)", description: "Our most popular outdoor sign board.", priceFactor: 1 },
      { id: "foamex", label: "Foamex PVC", description: "Lightweight, budget friendly. Best for short-term use.", priceFactor: 0.7 },
      { id: "acrylic", label: "Acrylic", description: "Glossy premium finish with real depth.", priceFactor: 1.6 },
      { id: "tray", label: "Aluminium tray sign", description: "Folded edges for a crisp, professional look.", priceFactor: 2.2 },
      { id: "lightbox", label: "Illuminated lightbox", description: "LED lit so your sign shines after dark.", priceFactor: 3.2 },
    ],
    quantities: [1, 2, 3, 4],
    pricing: { type: "area", perSqm: 110, min: 150 },
    mockup: "shopfront",
    aiHint:
      "An outdoor shop fascia sign viewed from the street. The business name must be very large and legible from 20+ metres. Keep it simple: name, short description of trade, maybe phone or website. Very wide aspect ratio.",
    popular: true,
  },
  {
    id: "hanging-sign",
    name: "Hanging / Projecting Sign",
    category: "signage",
    tagline: "Catch passers-by walking along the street",
    description: "Double-sided projecting signs for brackets, printed on rigid Dibond or acrylic.",
    emoji: "🪧",
    sizes: [a(450, 450), a(600, 600), a(750, 750), a(600, 900)],
    customSize: { minW: 200, maxW: 1500, minH: 200, maxH: 1500 },
    bleedMm: 5,
    safeMm: 25,
    sides: ["Front", "Back"],
    targetDpi: 150,
    minDpi: 60,
    materials: [
      { id: "dibond", label: "Dibond", description: "Rigid aluminium composite.", priceFactor: 1 },
      { id: "acrylic", label: "Acrylic", description: "Premium glossy finish.", priceFactor: 1.5 },
    ],
    quantities: [1, 2, 3],
    pricing: { type: "area", perSqm: 260, min: 120 },
    mockup: "hanging",
    aiHint: "A double-sided projecting sign hung from a bracket. Bold logo-like composition with the business name, minimal text.",
  },
  {
    id: "a-board",
    name: "A-Board Pavement Sign",
    category: "signage",
    tagline: "Pull people in off the pavement",
    description: "Weatherproof A-board with printed panels on both sides. Great for offers and menus.",
    emoji: "🅰️",
    sizes: [a(500, 700, "Small 500 × 700 mm"), a(600, 840, "Standard A1 600 × 840 mm")],
    bleedMm: 5,
    safeMm: 25,
    sides: ["Front", "Back"],
    targetDpi: 150,
    minDpi: 60,
    materials: [
      { id: "frame", label: "Panels + steel A-frame", description: "Complete board ready to use.", priceFactor: 1 },
      { id: "panels", label: "Replacement panels only", description: "For an A-board you already own.", priceFactor: 0.45 },
    ],
    quantities: [1, 2, 3],
    pricing: { type: "unit", each: 145 },
    mockup: "aboard",
    aiHint: "A pavement A-board sign read by people walking past. Eye-catching headline offer, business name and a few short lines.",
  },
  {
    id: "window-graphics",
    name: "Window Graphics",
    category: "signage",
    tagline: "Turn your windows into advertising",
    description: "Full colour vinyl, frosted etch or one-way vision for shop and office windows.",
    emoji: "🪟",
    sizes: [a(1000, 1500), a(1200, 2000), a(2000, 1000), a(3000, 2000)],
    customSize: { minW: 200, maxW: 6000, minH: 200, maxH: 3000 },
    bleedMm: 10,
    safeMm: 30,
    sides: ["Front"],
    targetDpi: 100,
    minDpi: 40,
    materials: [
      { id: "vinyl", label: "Full colour vinyl", description: "Solvent printed, laminated for outdoors.", priceFactor: 1 },
      { id: "oneway", label: "One-way vision", description: "Graphic outside, see-through from inside.", priceFactor: 1.3 },
      { id: "frosted", label: "Frosted etch", description: "Elegant privacy film.", priceFactor: 1.1 },
    ],
    quantities: [1, 2, 3, 4],
    pricing: { type: "area", perSqm: 48, min: 60 },
    mockup: "window",
    aiHint: "Shop window graphics. Large imagery, opening hours or offers. Leave some breathing space; it is seen from outside the shop.",
  },
  {
    id: "vehicle-magnets",
    name: "Vehicle Door Magnets",
    category: "signage",
    tagline: "Advertise wherever you drive",
    description: "Removable magnetic signs for van and car doors. Sold as a pair.",
    emoji: "🚐",
    sizes: [a(600, 300), a(900, 450), a(1000, 500)],
    bleedMm: 5,
    safeMm: 25,
    sides: ["Front"],
    targetDpi: 150,
    minDpi: 60,
    materials: [{ id: "magnetic", label: "0.85mm magnetic sheet", description: "Removable, no damage to paintwork.", priceFactor: 1 }],
    quantities: [1, 2, 3],
    pricing: { type: "unit", each: 85 },
    mockup: "van",
    aiHint: "Magnetic sign on a van door, read by other drivers. Business name, trade and a phone number in very large type.",
  },
  // ---------------------------------------------------------------- Print
  {
    id: "business-cards",
    name: "Business Cards",
    category: "print",
    tagline: "Make a great first impression",
    description: "Premium double-sided business cards on thick 400gsm card with optional luxury finishes.",
    emoji: "💳",
    sizes: [a(85, 55, "Standard 85 × 55 mm"), a(55, 85, "Portrait 55 × 85 mm"), a(55, 55, "Square 55 × 55 mm")],
    bleedMm: 3,
    safeMm: 4,
    sides: ["Front", "Back"],
    targetDpi: 300,
    minDpi: 200,
    materials: [
      { id: "silk", label: "400gsm silk", description: "Smooth with a subtle sheen.", priceFactor: 1 },
      { id: "matt-lam", label: "450gsm matt laminated", description: "Durable, premium matt feel.", priceFactor: 1.25 },
      { id: "soft-touch", label: "Soft-touch laminated", description: "Velvety luxury finish.", priceFactor: 1.6 },
    ],
    quantities: [100, 250, 500, 1000, 2500],
    pricing: { type: "tiers", tiers: { 100: 25, 250: 35, 500: 45, 1000: 60, 2500: 110 } },
    mockup: "card",
    aiHint: "A business card. Front: name/logo focused. Include person name, job title, phone, email and website in small but legible type. Small format so keep text 7pt+ equivalent.",
    popular: true,
  },
  {
    id: "leaflets",
    name: "Flyers & Leaflets",
    category: "print",
    tagline: "Spread the word for less",
    description: "Full colour flyers on 150gsm or 300gsm silk. Perfect for promotions, events and door drops.",
    emoji: "📄",
    sizes: [a(105, 148, "A6"), a(148, 210, "A5"), a(210, 297, "A4"), a(99, 210, "DL")],
    bleedMm: 3,
    safeMm: 5,
    sides: ["Front", "Back"],
    targetDpi: 300,
    minDpi: 200,
    materials: [
      { id: "150silk", label: "150gsm silk", description: "Great value, ideal for handouts.", priceFactor: 1 },
      { id: "300silk", label: "300gsm silk", description: "Thicker, premium feel.", priceFactor: 1.4 },
    ],
    quantities: [250, 500, 1000, 2500, 5000],
    pricing: { type: "tiers", tiers: { 250: 35, 500: 45, 1000: 55, 2500: 70, 5000: 90 } },
    mockup: "paper",
    aiHint: "A promotional flyer/leaflet. Strong headline, supporting image, key details and a clear call to action.",
    popular: true,
  },
  {
    id: "posters",
    name: "Posters",
    category: "print",
    tagline: "Big, bold and full of colour",
    description: "Vivid posters from A3 up to A0, indoor paper or outdoor-ready synthetic.",
    emoji: "🖼️",
    sizes: [a(297, 420, "A3"), a(420, 594, "A2"), a(594, 841, "A1"), a(841, 1189, "A0")],
    bleedMm: 3,
    safeMm: 10,
    sides: ["Front"],
    targetDpi: 150,
    minDpi: 100,
    materials: [
      { id: "satin", label: "200gsm satin paper", description: "Indoor posters.", priceFactor: 1 },
      { id: "synthetic", label: "Outdoor synthetic", description: "Waterproof and tear resistant.", priceFactor: 1.8 },
    ],
    quantities: [1, 5, 10, 25, 50],
    pricing: { type: "tiers", tiers: { 1: 15, 5: 45, 10: 70, 25: 140, 50: 240 } },
    mockup: "paper",
    aiHint: "A poster for events or promotions. Large hero visual and headline, event details, call to action.",
  },
  {
    id: "menus",
    name: "Menus",
    category: "print",
    tagline: "Menus that make mouths water",
    description: "Restaurant, café and bar menus on heavy card, optionally laminated wipe-clean.",
    emoji: "🍽️",
    sizes: [a(210, 297, "A4"), a(297, 420, "A3"), a(99, 210, "DL")],
    bleedMm: 3,
    safeMm: 6,
    sides: ["Front", "Back"],
    targetDpi: 300,
    minDpi: 200,
    materials: [
      { id: "350silk", label: "350gsm silk", description: "Sturdy card.", priceFactor: 1 },
      { id: "laminated", label: "Laminated wipe-clean", description: "Survives spills.", priceFactor: 1.5 },
    ],
    quantities: [10, 25, 50, 100, 250],
    pricing: { type: "tiers", tiers: { 10: 30, 25: 45, 50: 65, 100: 95, 250: 180 } },
    mockup: "paper",
    aiHint: "A restaurant or café menu. Venue name header, sections with dishes and prices, elegant readable typography.",
  },
  {
    id: "stickers",
    name: "Stickers & Labels",
    category: "print",
    tagline: "Stick your brand on everything",
    description: "Gloss vinyl stickers, kiss-cut to shape. Great for packaging, bags and laptops.",
    emoji: "⭐",
    sizes: [a(50, 50, "Circle 50 mm"), a(75, 75, "Circle 75 mm"), a(100, 100, "Circle 100 mm")],
    bleedMm: 2,
    safeMm: 4,
    shape: "circle",
    sides: ["Front"],
    targetDpi: 300,
    minDpi: 200,
    materials: [
      { id: "gloss", label: "Gloss vinyl", description: "Waterproof and vibrant.", priceFactor: 1 },
      { id: "matt", label: "Matt vinyl", description: "Subtle, premium finish.", priceFactor: 1.1 },
    ],
    quantities: [50, 100, 250, 500, 1000],
    pricing: { type: "tiers", tiers: { 50: 30, 100: 40, 250: 65, 500: 95, 1000: 150 } },
    mockup: "sticker",
    aiHint: "A circular sticker/label. Centred, badge-like composition with the brand name. Keep everything inside the circle.",
  },
  // ---------------------------------------------------------------- Display
  {
    id: "roller-banner",
    name: "Roller Banner",
    category: "display",
    tagline: "Stand out at events and exhibitions",
    description: "Pull-up banner stands with carry case. Set up in seconds.",
    emoji: "🎪",
    sizes: [a(850, 2000, "Standard 850 × 2000 mm"), a(1000, 2000, "Wide 1000 × 2000 mm"), a(1200, 2000, "Extra wide 1200 × 2000 mm")],
    bleedMm: 10,
    safeMm: 40,
    sides: ["Front"],
    targetDpi: 120,
    minDpi: 60,
    materials: [
      { id: "standard", label: "Standard stand + print", description: "Great value for occasional use.", priceFactor: 1 },
      { id: "premium", label: "Premium stand + anti-curl print", description: "Heavier base, flatter graphic.", priceFactor: 1.5 },
    ],
    quantities: [1, 2, 3, 5],
    pricing: { type: "unit", each: 95 },
    mockup: "rollerbanner",
    aiHint:
      "A tall pull-up roller banner. Logo/name at the top (eye level), key message in the middle, contact details. Avoid important content in the bottom 200mm as it's hidden by the base.",
    popular: true,
  },
  {
    id: "pvc-banner",
    name: "PVC Banner",
    category: "display",
    tagline: "Tough outdoor banners with eyelets",
    description: "Heavy-duty PVC or mesh banners, hemmed and eyeletted, ready to hang.",
    emoji: "🏳️",
    sizes: [a(2000, 1000, "2m × 1m"), a(3000, 1000, "3m × 1m"), a(4000, 1000, "4m × 1m"), a(2400, 600, "2.4m × 0.6m")],
    customSize: { minW: 500, maxW: 10000, minH: 300, maxH: 5000 },
    bleedMm: 20,
    safeMm: 50,
    sides: ["Front"],
    targetDpi: 80,
    minDpi: 30,
    materials: [
      { id: "pvc", label: "440gsm PVC", description: "Our standard outdoor banner.", priceFactor: 1 },
      { id: "mesh", label: "Mesh (windy locations)", description: "Lets the wind through, ideal for fences.", priceFactor: 1.2 },
    ],
    quantities: [1, 2, 3, 5, 10],
    pricing: { type: "area", perSqm: 18, min: 35 },
    mockup: "banner",
    aiHint: "An outdoor PVC banner hung on railings or a building. Huge headline and a few words, readable from far away.",
  },
  {
    id: "wall-graphics",
    name: "Wall Graphics & Wallpaper",
    category: "display",
    tagline: "Transform any room",
    description: "Digitally printed wallpaper and wall vinyl for offices, gyms, bars and homes.",
    emoji: "🧱",
    sizes: [a(3000, 2400, "3m × 2.4m"), a(4000, 2500, "4m × 2.5m"), a(2000, 2400, "2m × 2.4m")],
    customSize: { minW: 500, maxW: 15000, minH: 500, maxH: 5000 },
    bleedMm: 25,
    safeMm: 50,
    sides: ["Front"],
    targetDpi: 80,
    minDpi: 30,
    materials: [
      { id: "wallpaper", label: "Printed wallpaper", description: "Paste-the-wall, matt finish.", priceFactor: 1 },
      { id: "vinyl", label: "Self-adhesive vinyl", description: "Smooth walls, easy install.", priceFactor: 1.2 },
    ],
    quantities: [1, 2],
    pricing: { type: "area", perSqm: 35, min: 80 },
    mockup: "wall",
    aiHint: "A large interior feature wall. Atmospheric imagery and a short inspiring statement or brand mark.",
  },
  // ---------------------------------------------------------------- Promo
  {
    id: "mugs",
    name: "Printed Mugs",
    category: "promo",
    tagline: "Your design, wrapped around a mug",
    description: "11oz white ceramic mugs, dishwasher safe, with a full wrap-around print.",
    emoji: "☕",
    sizes: [a(200, 85, "11oz full wrap")],
    bleedMm: 2,
    safeMm: 5,
    sides: ["Wrap"],
    targetDpi: 300,
    minDpi: 150,
    materials: [
      { id: "white", label: "Classic white 11oz", description: "Gloss white ceramic.", priceFactor: 1 },
      { id: "magic", label: "Magic colour-change", description: "Design appears when hot!", priceFactor: 1.6 },
    ],
    quantities: [1, 6, 12, 24, 48, 100],
    pricing: { type: "tiers", tiers: { 1: 12, 6: 54, 12: 96, 24: 168, 48: 300, 100: 550 } },
    mockup: "mug",
    aiHint:
      "A mug wrap. The left and right edges meet at the handle, so put the main design in two zones: left-centre (25%) and right-centre (75%), or one centred design. Fun and personal.",
    popular: true,
  },
  {
    id: "tote-bags",
    name: "Tote Bags",
    category: "promo",
    tagline: "Eco-friendly bags that carry your brand",
    description: "Natural cotton tote bags with a full-colour print on one side.",
    emoji: "👜",
    sizes: [a(280, 300, "Print area 280 × 300 mm")],
    bleedMm: 0,
    safeMm: 10,
    sides: ["Front"],
    targetDpi: 200,
    minDpi: 120,
    materials: [
      { id: "natural", label: "Natural cotton", description: "Classic eco look.", priceFactor: 1 },
      { id: "black", label: "Black cotton", description: "Bold, modern look.", priceFactor: 1.1 },
    ],
    quantities: [10, 25, 50, 100, 250],
    pricing: { type: "tiers", tiers: { 10: 85, 25: 160, 50: 260, 100: 450, 250: 950 } },
    mockup: "tote",
    aiHint: "A cotton tote bag print. Simple iconic graphic or logo with a short slogan. Transparent/no background works best.",
  },
  {
    id: "coasters",
    name: "Coasters",
    category: "promo",
    tagline: "Perfect for bars, cafés and gifts",
    description: "Round hardboard coasters with a gloss finish and cork-style base.",
    emoji: "🍺",
    sizes: [a(95, 95, "Round 95 mm")],
    bleedMm: 2,
    safeMm: 5,
    shape: "circle",
    sides: ["Front"],
    targetDpi: 300,
    minDpi: 150,
    materials: [
      { id: "hardboard", label: "Gloss hardboard", description: "Durable and wipe clean.", priceFactor: 1 },
      { id: "pulp", label: "Pulpboard (beer mat)", description: "Disposable bar mats.", priceFactor: 0.4 },
    ],
    quantities: [10, 25, 50, 100, 500],
    pricing: { type: "tiers", tiers: { 10: 40, 25: 75, 50: 120, 100: 190, 500: 650 } },
    mockup: "coaster",
    aiHint: "A round drinks coaster. Centred, circular composition, bold brand mark or fun illustration.",
  },
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function productsByCategory(category: CategoryId) {
  return products.filter((p) => p.category === category);
}

/** Rough estimate. Returns undefined if no sensible price can be given. */
export function estimatePrice(opts: {
  product: Product;
  widthMm: number;
  heightMm: number;
  materialId: string;
  quantity: number;
}): number | undefined {
  const { product, widthMm, heightMm, materialId, quantity } = opts;
  const material = product.materials.find((m) => m.id === materialId) ?? product.materials[0];
  const factor = material?.priceFactor ?? 1;
  const pricing = product.pricing;
  let price: number;
  if (pricing.type === "area") {
    const sqm = (widthMm / 1000) * (heightMm / 1000);
    price = Math.max(pricing.min, sqm * pricing.perSqm * factor) * quantity;
  } else if (pricing.type === "unit") {
    price = pricing.each * factor * quantity;
  } else {
    const tiers = Object.entries(pricing.tiers)
      .map(([q, p]) => [Number(q), p] as const)
      .sort((x, y) => x[0] - y[0]);
    const exact = tiers.find(([q]) => q === quantity);
    if (exact) price = exact[1];
    else {
      // Interpolate per-unit price from the nearest lower tier.
      const lower = [...tiers].reverse().find(([q]) => q <= quantity) ?? tiers[0];
      price = (lower[1] / lower[0]) * quantity;
    }
    // Larger paper sizes cost more: scale relative to the first preset's area.
    const base = product.sizes[0];
    const areaRatio = (widthMm * heightMm) / (base.widthMm * base.heightMm);
    price *= Math.max(1, Math.sqrt(areaRatio)) * factor;
  }
  return Math.round(price * 100) / 100;
}
