/**
 * Canvas helpers built on fabric.js. Everything here is browser-only.
 *
 * Design space: the full canvas (artwork + bleed) is measured in "units"
 * where the longer side is always 1000 units, so tools behave the same on
 * a business card and a 6m sign. `dims.upm` converts units <-> millimetres.
 */
import {
  Canvas,
  StaticCanvas,
  FabricObject,
  FabricImage,
  Textbox,
  Rect,
  Ellipse,
  Line,
  Triangle,
  Polygon,
  Gradient,
  Shadow,
  cache,
  loadSVGFromString,
  util,
  setFilterBackend,
  Canvas2dFilterBackend,
} from "fabric";
import type { Product } from "@/lib/products";
import type { Layout, LayoutElement } from "@/lib/layout";
import { ensureFont } from "@/lib/fonts";

declare module "fabric" {
  interface FabricObject {
    role?: "background" | "ai-slot" | "bg-image";
    // Note: must not use a `type` key, or fabric tries to revive it as a class.
    bgSpec?: { kind: "solid" | "gradient"; colors: string[]; angle?: number | null };
    slotPrompt?: string;
    slotTransparent?: boolean;
    uid?: string;
  }
}

/** Extra properties saved with designs. */
export const CUSTOM_PROPS = [
  "role",
  "bgSpec",
  "slotPrompt",
  "slotTransparent",
  "uid",
  "selectable",
  "evented",
  "lockMovementX",
  "lockMovementY",
  "lockScalingX",
  "lockScalingY",
  "lockRotation",
  "hasControls",
];

export interface Dims {
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMm: number;
  totalWmm: number;
  totalHmm: number;
  /** units per millimetre */
  upm: number;
  W: number;
  H: number;
  shape: "rect" | "circle";
}

export function computeDims(product: Product, widthMm: number, heightMm: number): Dims {
  const totalWmm = widthMm + product.bleedMm * 2;
  const totalHmm = heightMm + product.bleedMm * 2;
  const upm = 1000 / Math.max(totalWmm, totalHmm);
  return {
    widthMm,
    heightMm,
    bleedMm: product.bleedMm,
    safeMm: product.safeMm,
    totalWmm,
    totalHmm,
    upm,
    W: totalWmm * upm,
    H: totalHmm * upm,
    shape: product.shape ?? "rect",
  };
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function configureFabricDefaults(brand: string) {
  // The 2D backend handles big print images; WebGL crops above its texture size.
  setFilterBackend(new Canvas2dFilterBackend());
  Object.assign(FabricObject.ownDefaults, {
    cornerStyle: "circle",
    cornerColor: "#ffffff",
    cornerStrokeColor: brand,
    borderColor: brand,
    transparentCorners: false,
    cornerSize: 12,
    touchCornerSize: 28,
    padding: 4,
    borderScaleFactor: 1.5,
    originX: "left",
    originY: "top",
  });
}

export function createCanvas(el: HTMLCanvasElement) {
  return new Canvas(el, {
    preserveObjectStacking: true,
    backgroundColor: "#ffffff",
    controlsAboveOverlay: true,
    selectionColor: "rgba(225,29,116,0.08)",
    selectionBorderColor: "#e11d74",
    stopContextMenu: true,
    fireRightClick: false,
  });
}

// ----------------------------------------------------------------- background

export function getBackground(canvas: StaticCanvas) {
  return canvas.getObjects().find((o) => o.role === "background") as Rect | undefined;
}

export function ensureBackground(canvas: StaticCanvas, dims: Dims) {
  let bg = getBackground(canvas);
  if (!bg) {
    bg = new Rect({ fill: "#ffffff", role: "background", selectable: false, evented: false, hoverCursor: "default" });
    canvas.insertAt(0, bg);
  }
  bg.set({ left: 0, top: 0, width: dims.W, height: dims.H, scaleX: 1, scaleY: 1, strokeWidth: 0, selectable: false, evented: false });
  // Gradients are stored in absolute units, so rebuild them for the new size.
  if (bg.bgSpec?.kind === "gradient") bg.set({ fill: linearGradient(bg.bgSpec.colors, bg.bgSpec.angle ?? 90, dims.W, dims.H) });
  if (canvas.getObjects().indexOf(bg) !== 0) canvas.moveObjectTo(bg, 0);
  return bg;
}

export function linearGradient(colors: string[], angle = 90, w: number, h: number) {
  const rad = (angle * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const len = (Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))) / 2;
  const dx = Math.cos(rad) * len;
  const dy = Math.sin(rad) * len;
  const stops = colors.length > 1 ? colors : [colors[0] ?? "#ffffff", colors[0] ?? "#ffffff"];
  return new Gradient({
    type: "linear",
    coords: { x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy },
    colorStops: stops.map((color, i) => ({ offset: i / (stops.length - 1), color })),
  });
}

export function setBackground(canvas: StaticCanvas, dims: Dims, bg: { type: "solid" | "gradient"; colors: string[]; angle?: number | null }) {
  const rect = ensureBackground(canvas, dims);
  rect.set({ bgSpec: { kind: bg.type, colors: [...bg.colors], angle: bg.angle ?? 90 } });
  if (bg.type === "gradient" && bg.colors.length > 1) {
    rect.set({ fill: linearGradient(bg.colors, bg.angle ?? 90, dims.W, dims.H) });
  } else {
    rect.set({ fill: bg.colors[0] ?? "#ffffff" });
  }
  canvas.requestRenderAll();
}

// ----------------------------------------------------------------- text

export async function fitText(tb: Textbox, maxW: number, maxH: number) {
  tb.set({ width: maxW });
  tb.initDimensions();
  let guard = 0;
  while ((tb.width > maxW + 0.5 || tb.height > maxH * 1.1) && tb.fontSize > 2 && guard < 60) {
    tb.set({ fontSize: tb.fontSize * 0.93, width: maxW });
    tb.initDimensions();
    guard++;
  }
}

export async function makeText(
  text: string,
  opts: Partial<Textbox> & { fontFamily?: string; fontWeight?: string | number },
) {
  const family = opts.fontFamily ?? "Montserrat";
  await ensureFont(family, String(opts.fontWeight ?? "") === "bold" || Number(opts.fontWeight) >= 600);
  cache.clearFontCache(family);
  const tb = new Textbox(text, {
    fontFamily: family,
    fill: "#111111",
    textAlign: "center",
    splitByGrapheme: false,
    paintFirst: "stroke",
    strokeUniform: true,
    uid: uid(),
    ...opts,
  } as Partial<Textbox>);
  return tb;
}

/** Re-measure text after web fonts finish loading. */
export async function refreshFonts(canvas: StaticCanvas) {
  const texts = canvas.getObjects().filter((o): o is Textbox => o instanceof Textbox);
  const families = new Set(texts.map((t) => `${t.fontFamily}|${t.fontWeight}`));
  await Promise.all(
    [...families].map((f) => {
      const [family, weight] = f.split("|");
      return ensureFont(family, weight === "bold" || Number(weight) >= 600);
    }),
  );
  cache.clearFontCache();
  texts.forEach((t) => {
    t.initDimensions();
    t.setCoords();
    t.dirty = true;
  });
  canvas.requestRenderAll();
}

// ----------------------------------------------------------------- images

export function loadImage(src: string) {
  return FabricImage.fromURL(src, { crossOrigin: "anonymous" });
}

/** Scale/crop an image to fill (cover) or fit inside (contain) a box. */
export function placeImageInBox(img: FabricImage, box: { left: number; top: number; width: number; height: number }, mode: "cover" | "contain") {
  const el = img.getElement() as HTMLImageElement;
  const iw = el.naturalWidth || el.width;
  const ih = el.naturalHeight || el.height;
  if (mode === "cover") {
    const boxRatio = box.width / box.height;
    let cw = iw;
    let ch = ih;
    if (iw / ih > boxRatio) cw = ih * boxRatio;
    else ch = iw / boxRatio;
    img.set({
      cropX: (iw - cw) / 2,
      cropY: (ih - ch) / 2,
      width: cw,
      height: ch,
      left: box.left,
      top: box.top,
      scaleX: box.width / cw,
      scaleY: box.height / ch,
    });
  } else {
    const s = Math.min(box.width / iw, box.height / ih);
    img.set({
      cropX: 0,
      cropY: 0,
      width: iw,
      height: ih,
      scaleX: s,
      scaleY: s,
      left: box.left + (box.width - iw * s) / 2,
      top: box.top + (box.height - ih * s) / 2,
    });
  }
  img.setCoords();
}

export async function svgToObject(svg: string) {
  const { objects, options } = await loadSVGFromString(svg);
  const group = util.groupSVGElements(objects.filter(Boolean) as FabricObject[], options);
  return group;
}

/** Effective print resolution of an image object. */
export function imageDpi(img: FabricImage, dims: Dims) {
  const printedMm = img.getScaledWidth() / dims.upm;
  if (printedMm <= 0) return Infinity;
  return Math.round((img.width / printedMm) * 25.4);
}

// ----------------------------------------------------------------- layouts

export interface ApplyOptions {
  /** Called for image elements without a src; return nothing (async fill later). */
  onImageSlot?: (slot: Rect) => void;
}

function shadowFor(size: number) {
  return new Shadow({ color: "rgba(0,0,0,0.35)", blur: size * 0.08, offsetX: size * 0.03, offsetY: size * 0.04 });
}

/** The area text should stay inside (as a rect; for round items, the inscribed square). */
export function safeBox(dims: Dims) {
  const m = (dims.bleedMm + dims.safeMm) * dims.upm;
  if (dims.shape === "circle") {
    const r = (Math.min(dims.W, dims.H) / 2 - m) * 0.92;
    return { left: dims.W / 2 - r, top: dims.H / 2 - r, width: r * 2, height: r * 2 };
  }
  return { left: m, top: m, width: dims.W - 2 * m, height: dims.H - 2 * m };
}

async function textElement(
  el: LayoutElement,
  dims: Dims,
  left: number,
  top: number,
  width: number,
  height: number,
  outline: Record<string, unknown>,
  common: Record<string, unknown>,
) {
  const S = Math.min(dims.W, dims.H);
  const fontSize = (el.fontSize ?? 0.08) * S;
  const tb = await makeText(el.text ?? "", {
    left,
    top,
    width,
    fontSize,
    fontFamily: el.fontFamily ?? "Montserrat",
    fontWeight: el.bold ? "bold" : "normal",
    fontStyle: el.italic ? "italic" : "normal",
    fill: el.color,
    textAlign: el.align ?? "center",
    charSpacing: el.letterSpacing ?? 0,
    lineHeight: el.lineHeight ?? 1.15,
    shadow: el.shadow ? shadowFor(fontSize) : null,
    ...outline,
    ...common,
  });
  await fitText(tb, width, height);
  if (tb.height < height) tb.set({ top: top + (height - tb.height) / 2 });
  tb.setCoords();
  return tb;
}

/** Bounding box of the actual glyphs (a textbox can be wider than its text). */
export function textInkBox(tb: Textbox) {
  const r = tb.getBoundingRect();
  if (tb.angle) return r;
  const inkW = Math.min(tb.width, Math.max(...tb._textLines.map((_, i) => tb.getLineWidth(i)))) * tb.scaleX;
  const offset = tb.textAlign === "center" ? (r.width - inkW) / 2 : tb.textAlign === "right" ? r.width - inkW : 0;
  return { left: r.left + offset, top: r.top, width: inkW, height: r.height };
}

export async function elementToObject(el: LayoutElement, dims: Dims): Promise<FabricObject | null> {
  const { W, H } = dims;
  const S = Math.min(W, H);
  const left = el.x * W;
  const top = el.y * H;
  const width = Math.max(1, el.w * W);
  const height = Math.max(1, el.h * H);
  const common = { opacity: el.opacity ?? 1, uid: uid() };
  const outline =
    el.outlineColor && el.outlineWidth ? { stroke: el.outlineColor, strokeWidth: Math.max(0.5, el.outlineWidth * S) } : { strokeWidth: 0 };

  switch (el.type) {
    case "text": {
      // Keep text inside the safe area, whatever the layout asked for.
      const safe = safeBox(dims);
      const l = Math.max(left, safe.left);
      const r = Math.min(left + width, safe.left + safe.width);
      const t = Math.max(top, safe.top);
      const b = Math.min(top + height, safe.top + safe.height);
      if (r - l > S * 0.05 && b - t > S * 0.02) {
        return textElement(el, dims, l, t, r - l, b - t, outline, common);
      }
      return textElement(el, dims, left, top, width, height, outline, common);
    }
    case "rect": {
      const r = (el.radius ?? 0) * S;
      return new Rect({ left, top, width, height, rx: r, ry: r, fill: el.color, ...outline, ...common });
    }
    case "ellipse":
      return new Ellipse({ left, top, rx: width / 2, ry: height / 2, fill: el.color, ...outline, ...common });
    case "line":
      return new Line([left, top, left + el.w * W, top + el.h * H], {
        stroke: el.color,
        strokeWidth: Math.max(0.5, (el.outlineWidth ?? 0.006) * S),
        strokeLineCap: "round",
        ...common,
      });
    case "image": {
      if (el.src) {
        const img = await loadImage(el.src);
        placeImageInBox(img, { left, top, width, height }, el.transparentBackground ? "contain" : "cover");
        img.set(common);
        return img;
      }
      return new Rect({
        left,
        top,
        width,
        height,
        fill: "rgba(148,163,184,0.25)",
        stroke: "#94a3b8",
        strokeWidth: S * 0.004,
        strokeDashArray: [S * 0.02, S * 0.015],
        role: "ai-slot",
        slotPrompt: el.imagePrompt ?? "",
        slotTransparent: Boolean(el.transparentBackground),
        ...common,
      });
    }
  }
  return null;
}

export async function applyLayout(canvas: StaticCanvas, dims: Dims, layout: Layout, opts: ApplyOptions = {}) {
  canvas.getObjects().forEach((o) => {
    if (o.role !== "background") canvas.remove(o);
  });
  setBackground(canvas, dims, layout.background);
  const objects = await Promise.all(layout.elements.map((el) => elementToObject(el, dims).catch(() => null)));
  for (const obj of objects) {
    if (!obj) continue;
    canvas.add(obj);
    if (obj.role === "ai-slot") opts.onImageSlot?.(obj as Rect);
  }
  canvas.requestRenderAll();
}

/** Render a layout to a small preview image (used for AI results & templates). */
export async function renderLayoutThumb(dims: Dims, layout: Layout, maxPx = 360) {
  const el = document.createElement("canvas");
  const scale = maxPx / Math.max(dims.W, dims.H);
  const sc = new StaticCanvas(el, { width: dims.W * scale, height: dims.H * scale, renderOnAddRemove: false });
  sc.setZoom(scale);
  await applyLayout(sc, dims, layout);
  sc.renderAll();
  const url = sc.toDataURL({ format: "png", multiplier: 1 });
  sc.dispose();
  return url;
}

// ----------------------------------------------------------------- shapes

export function makeShape(kind: string, dims: Dims, color: string): FabricObject {
  const S = Math.min(dims.W, dims.H);
  const size = S * 0.35;
  const left = dims.W / 2 - size / 2;
  const top = dims.H / 2 - size / 2;
  const base = { left, top, fill: color, uid: uid(), strokeWidth: 0 };
  switch (kind) {
    case "rounded":
      return new Rect({ ...base, width: size * 1.4, height: size, rx: size * 0.15, ry: size * 0.15 });
    case "circle":
      return new Ellipse({ ...base, rx: size / 2, ry: size / 2 });
    case "triangle":
      return new Triangle({ ...base, width: size, height: size });
    case "star": {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? size / 2 : size / 4.4;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        return { x: r * Math.cos(a), y: r * Math.sin(a) };
      });
      return new Polygon(pts, base);
    }
    case "badge": {
      const pts = Array.from({ length: 24 }, (_, i) => {
        const r = i % 2 === 0 ? size / 2 : size / 2.3;
        const a = (Math.PI / 12) * i;
        return { x: r * Math.cos(a), y: r * Math.sin(a) };
      });
      return new Polygon(pts, base);
    }
    case "line":
      return new Line([dims.W * 0.3, dims.H / 2, dims.W * 0.7, dims.H / 2], {
        stroke: color,
        strokeWidth: S * 0.012,
        strokeLineCap: "round",
        uid: uid(),
      });
    case "frame":
      return new Rect({ ...base, width: size * 1.4, height: size, fill: "transparent", stroke: color, strokeWidth: S * 0.012 });
    case "banner":
      return new Polygon(
        [
          { x: 0, y: 0 },
          { x: size * 2, y: 0 },
          { x: size * 1.85, y: size * 0.25 },
          { x: size * 2, y: size * 0.5 },
          { x: 0, y: size * 0.5 },
          { x: size * 0.15, y: size * 0.25 },
        ],
        base,
      );
    case "rect":
    default:
      return new Rect({ ...base, width: size * 1.4, height: size });
  }
}

// ----------------------------------------------------------------- export

/** Move/scale content designed for one canvas size onto another. */
export function rescaleContent(canvas: StaticCanvas, from: { W: number; H: number }, dims: Dims) {
  if (Math.abs(from.W - dims.W) < 0.01 && Math.abs(from.H - dims.H) < 0.01) return;
  const s = Math.min(dims.W / from.W, dims.H / from.H);
  const dx = (dims.W - from.W * s) / 2;
  const dy = (dims.H - from.H * s) / 2;
  canvas.getObjects().forEach((o) => {
    if (o.role === "background") return;
    o.set({ left: o.left * s + dx, top: o.top * s + dy, scaleX: o.scaleX * s, scaleY: o.scaleY * s });
    o.setCoords();
  });
  ensureBackground(canvas, dims);
  canvas.requestRenderAll();
}

export function serialize(canvas: StaticCanvas) {
  return canvas.toObject(CUSTOM_PROPS);
}

export async function deserialize(canvas: StaticCanvas, dims: Dims, json: unknown) {
  await canvas.loadFromJSON(json as Record<string, unknown>);
  canvas.getObjects().forEach((o) => {
    if (o.role === "background") o.set({ selectable: false, evented: false });
  });
  ensureBackground(canvas, dims);
  await refreshFonts(canvas);
}

function zoomOf(canvas: StaticCanvas) {
  return canvas.getZoom();
}

/** Trimmed (no bleed) preview image. */
export function exportPreview(canvas: StaticCanvas, dims: Dims, maxPx = 1400, format: "png" | "jpeg" = "png") {
  (canvas as Canvas).discardActiveObject?.();
  const z = zoomOf(canvas);
  const b = dims.bleedMm * dims.upm;
  const trimW = dims.W - b * 2;
  const trimH = dims.H - b * 2;
  const multiplier = maxPx / (Math.max(trimW, trimH) * z);
  return canvas.toDataURL({
    format,
    quality: 0.9,
    multiplier,
    left: b * z,
    top: b * z,
    width: trimW * z,
    height: trimH * z,
    filter: (o) => (o as FabricObject).role !== "ai-slot",
  });
}

const MAX_PIXELS = 48_000_000;
const MAX_SIDE = 16_000;

/** Full-bleed print file at (up to) the product's target DPI. */
export async function exportPrint(canvas: StaticCanvas, dims: Dims, targetDpi: number) {
  (canvas as Canvas).discardActiveObject?.();
  let dpi = targetDpi;
  const px = (d: number) => ({ w: Math.round((dims.totalWmm / 25.4) * d), h: Math.round((dims.totalHmm / 25.4) * d) });
  let size = px(dpi);
  while ((size.w * size.h > MAX_PIXELS || Math.max(size.w, size.h) > MAX_SIDE) && dpi > 20) {
    dpi = Math.floor(dpi * 0.9);
    size = px(dpi);
  }
  const multiplier = size.w / (dims.W * zoomOf(canvas));
  const el = canvas.toCanvasElement(multiplier, { filter: (o) => (o as FabricObject).role !== "ai-slot" });
  const blob = await new Promise<Blob>((resolve, reject) =>
    el.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not render print file"))), "image/png"),
  );
  return { blob, width: el.width, height: el.height, dpi };
}

export function exportSVG(canvas: StaticCanvas, dims: Dims) {
  return canvas.toSVG({
    width: `${dims.totalWmm}mm`,
    height: `${dims.totalHmm}mm`,
    viewBox: { x: 0, y: 0, width: dims.W, height: dims.H },
  });
}

/** Render a stored side on an off-screen canvas (zoom 1) for exporting. */
export async function withOffscreen<T>(
  dims: Dims,
  entry: { json: unknown; W: number; H: number } | undefined,
  fn: (canvas: StaticCanvas) => Promise<T> | T,
): Promise<T> {
  const el = document.createElement("canvas");
  const sc = new StaticCanvas(el, { width: dims.W, height: dims.H, renderOnAddRemove: false, backgroundColor: "#ffffff" });
  try {
    if (entry) {
      await deserialize(sc, dims, entry.json);
      rescaleContent(sc, entry, dims);
    } else {
      ensureBackground(sc, dims);
    }
    sc.renderAll();
    return await fn(sc);
  } finally {
    sc.dispose();
  }
}

/** True when a side has nothing on it but a plain white background. */
export function isBlank(canvas: StaticCanvas) {
  const objs = canvas.getObjects().filter((o) => o.role !== "background");
  const bg = getBackground(canvas);
  return objs.length === 0 && (!bg || bg.fill === "#ffffff");
}

// ----------------------------------------------------------------- print check

export interface Issue {
  level: "error" | "warn";
  message: string;
  uid?: string;
}

export function printCheck(canvas: StaticCanvas, dims: Dims, product: Product): Issue[] {
  const issues: Issue[] = [];
  const objs = canvas.getObjects().filter((o) => o.role !== "background");
  if (objs.length === 0) {
    const bg = getBackground(canvas);
    if (!bg || bg.fill === "#ffffff") issues.push({ level: "error", message: "This side is empty. Add some text, an image or a design." });
  }
  const m = (dims.bleedMm + dims.safeMm) * dims.upm;
  const safe = { l: m, t: m, r: dims.W - m, b: dims.H - m };
  for (const o of objs) {
    if (o.role === "ai-slot") {
      issues.push({ level: "error", message: "An AI artwork slot hasn't finished generating. Wait for it or delete it.", uid: o.uid });
      continue;
    }
    if (o instanceof FabricImage) {
      const dpi = imageDpi(o, dims);
      if (dpi < product.minDpi) {
        issues.push({
          level: "warn",
          message: `An image is low resolution (${dpi} dpi at this size) and may print blurry. Try a larger image or make it smaller.`,
          uid: o.uid,
        });
      }
    }
    if (o instanceof Textbox) {
      const r = textInkBox(o);
      const coversAll = r.width >= dims.W * 0.98 && r.height >= dims.H * 0.98;
      let outside = !coversAll && (r.left < safe.l || r.top < safe.t || r.left + r.width > safe.r || r.top + r.height > safe.b);
      if (dims.shape === "circle") {
        const cx = dims.W / 2;
        const cy = dims.H / 2;
        const rad = dims.W / 2 - m;
        const corners = [
          [r.left, r.top],
          [r.left + r.width, r.top],
          [r.left, r.top + r.height],
          [r.left + r.width, r.top + r.height],
        ];
        outside = corners.some(([x, y]) => Math.hypot(x - cx, y - cy) > rad);
      }
      if (outside && o.text.trim()) {
        issues.push({ level: "warn", message: `"${o.text.slice(0, 30)}" is outside the safe area and could be trimmed off.`, uid: o.uid });
      }
      const capMm = (o.fontSize * (o.scaleY ?? 1)) / dims.upm;
      const pt = (capMm / 25.4) * 72;
      const minPt = product.category === "print" || product.category === "promo" ? 6 : 0;
      if (o.text.trim() && pt < minPt) {
        issues.push({ level: "warn", message: `"${o.text.slice(0, 30)}" is very small (${pt.toFixed(1)}pt) and may be hard to read.`, uid: o.uid });
      }
      if (product.category === "signage" || product.id === "pvc-banner") {
        const mm = capMm;
        if (o.text.trim() && mm < 15 && dims.widthMm > 1000) {
          issues.push({ level: "warn", message: `"${o.text.slice(0, 30)}" is only ${mm.toFixed(0)}mm tall. It will be hard to read from a distance.`, uid: o.uid });
        }
      }
    }
  }
  return issues;
}
