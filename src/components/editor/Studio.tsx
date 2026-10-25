"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, FabricObject, FabricImage, Point, Rect, Textbox } from "fabric";
import {
  ArrowLeft, Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Eye, ShoppingBag, Download, Sparkles, LayoutTemplate,
  Type, ImagePlus, Shapes, PaintBucket, Loader2, Grid3x3, X, RotateCcw, ChevronDown,
} from "lucide-react";
import { getProduct, type SizePreset } from "@/lib/products";
import type { Layout } from "@/lib/layout";
import type { BusinessDetails } from "@/lib/templates";
import { tenant } from "@/lib/tenant";
import {
  computeDims, configureFabricDefaults, createCanvas, ensureBackground, serialize, deserialize, rescaleContent,
  applyLayout as applyLayoutToCanvas, loadImage, placeImageInBox, uid, refreshFonts, type Dims,
} from "./engine";
import { EditorContext, postJSON, SWATCHES, type EditorApi, type LibraryImage, type PanelId } from "./context";
import { GuidesOverlay } from "./GuidesOverlay";
import { AIPanel } from "./panels/AIPanel";
import { TemplatesPanel } from "./panels/TemplatesPanel";
import { TextPanel } from "./panels/TextPanel";
import { UploadsPanel } from "./panels/UploadsPanel";
import { ShapesPanel } from "./panels/ShapesPanel";
import { BackgroundPanel } from "./panels/BackgroundPanel";
import { PropertiesPanel } from "./panels/PropertiesPanel";
import { StartDialog } from "./dialogs/StartDialog";
import { PreviewDialog } from "./dialogs/PreviewDialog";
import { OrderDialog } from "./dialogs/OrderDialog";
import { DownloadMenu } from "./dialogs/DownloadMenu";
import { SizePicker } from "./SizePicker";

type SideEntry = { json: unknown; W: number; H: number };
interface Saved {
  v: 1;
  size: SizePreset;
  sides: Record<string, SideEntry>;
  updatedAt: string;
}

const storageKey = (id: string) => `rp:design:${id}`;
const DETAILS_KEY = "rp:details";

function readSaved(id: string): Saved | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

const PANELS: { id: PanelId; label: string; icon: typeof Sparkles }[] = [
  { id: "ai", label: "AI Magic", icon: Sparkles },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "text", label: "Text", icon: Type },
  { id: "uploads", label: "Images", icon: ImagePlus },
  { id: "shapes", label: "Shapes", icon: Shapes },
  { id: "background", label: "Background", icon: PaintBucket },
];

export default function Studio({ productId }: { productId: string }) {
  const product = getProduct(productId)!;
  const [initial] = useState(() => ({
    saved: readSaved(product.id),
    brief: new URLSearchParams(window.location.search).get("brief") ?? "",
  }));
  const [size, setSize] = useState<SizePreset>(initial.saved?.size ?? product.sizes[0]);
  const sizeRef = useRef(size);
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);
  const dims = useMemo(() => computeDims(product, size.widthMm, size.heightMm), [product, size.widthMm, size.heightMm]);
  const dimsRef = useRef<Dims>(dims);
  const [sideIdx, setSideIdx] = useState(0);
  const side = product.sides[sideIdx];
  const sideRef = useRef(side);

  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fcRef = useRef<Canvas | null>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const sidesRef = useRef<Record<string, SideEntry>>(initial.saved?.sides ?? {});
  const historyRef = useRef<Record<string, { stack: string[]; index: number }>>({});
  const restoring = useRef(false);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tick, setTick] = useState(0);
  const [historyFlags, setHistoryFlags] = useState({ undo: false, redo: false });
  const syncHistory = useCallback(() => {
    const h = historyRef.current[sideRef.current];
    setHistoryFlags({ undo: Boolean(h && h.index > 0), redo: Boolean(h && h.index < h.stack.length - 1) });
  }, []);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const [selection, setSelection] = useState<FabricObject | null>(null);
  const [panel, setPanel] = useState<PanelId | null>("ai");
  const [autoRun, setAutoRun] = useState<{ brief: string; nonce: number } | null>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [fit, setFit] = useState(0.5);
  const [zoomFactor, setZoomFactor] = useState(1);
  const zoom = fit * zoomFactor;
  const [showGuides, setShowGuides] = useState(true);
  const [snap, setSnap] = useState<{ v: boolean; h: boolean }>({ v: false, h: false });
  const [toasts, setToasts] = useState<{ id: number; message: string; kind: string }[]>([]);
  const [details, setDetailsState] = useState<Partial<BusinessDetails>>(() => {
    try {
      return JSON.parse(localStorage.getItem(DETAILS_KEY) || "{}");
    } catch {
      return {};
    }
  });
  const [library, setLibrary] = useState<LibraryImage[]>([]);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiBusy, setAiBusy] = useState(0);
  const [startOpen, setStartOpen] = useState(
    () =>
      !initial.saved ||
      !Object.values(initial.saved.sides).some((e) => ((e.json as { objects?: unknown[] })?.objects?.length ?? 0) > 1),
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const toast = useCallback((message: string, kind: "info" | "success" | "error" = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6000 : 3500);
  }, []);

  const setDetails = useCallback((d: Partial<BusinessDetails>) => {
    setDetailsState(d);
    try {
      localStorage.setItem(DETAILS_KEY, JSON.stringify(d));
    } catch {}
  }, []);

  // ------------------------------------------------------------ persistence
  const persist = useCallback(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      const data: Saved = { v: 1, size: sizeRef.current, sides: sidesRef.current, updatedAt: new Date().toISOString() };
      try {
        localStorage.setItem(storageKey(product.id), JSON.stringify(data));
      } catch {
        // Quota exceeded (big images) – the design still lives in memory.
      }
    }, 800);
  }, [product.id]);

  const saveSide = useCallback(() => {
    const c = fcRef.current;
    if (!c) return;
    sidesRef.current[sideRef.current] = { json: serialize(c), W: dimsRef.current.W, H: dimsRef.current.H };
    persist();
  }, [persist]);

  const pushHistory = useCallback(() => {
    const c = fcRef.current;
    if (!c) return;
    const label = sideRef.current;
    const h = (historyRef.current[label] ??= { stack: [], index: -1 });
    const snapshot = JSON.stringify(serialize(c));
    if (h.stack[h.index] === snapshot) return;
    h.stack = h.stack.slice(0, h.index + 1);
    h.stack.push(snapshot);
    if (h.stack.length > 40) h.stack.shift();
    h.index = h.stack.length - 1;
    syncHistory();
  }, [syncHistory]);

  const commit = useCallback(() => {
    if (restoring.current) return;
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      if (restoring.current) return;
      pushHistory();
      saveSide();
      setTick((t) => t + 1);
    }, 250);
  }, [pushHistory, saveSide]);

  const loadSide = useCallback(
    async (label: string) => {
      const c = fcRef.current;
      if (!c) return;
      restoring.current = true;
      c.discardActiveObject();
      c.clear();
      c.backgroundColor = "#ffffff";
      const entry = sidesRef.current[label];
      try {
        if (entry) {
          await deserialize(c, dimsRef.current, entry.json);
          rescaleContent(c, entry, dimsRef.current);
        } else {
          ensureBackground(c, dimsRef.current);
        }
      } catch (e) {
        console.error(e);
        ensureBackground(c, dimsRef.current);
      }
      restoring.current = false;
      sideRef.current = label;
      if (!historyRef.current[label]) {
        historyRef.current[label] = { stack: [], index: -1 };
        pushHistory();
      }
      syncHistory();
      c.requestRenderAll();
      setSelection(null);
      refresh();
    },
    [pushHistory, refresh, syncHistory],
  );

  // ------------------------------------------------------------ canvas init
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    configureFabricDefaults(tenant.colors.primary);
    const el = document.createElement("canvas");
    host.appendChild(el);
    const c = createCanvas(el);
    fcRef.current = c;
    setCanvas(c);

    const onSelect = () => setSelection(c.getActiveObject() ?? null);
    c.on("selection:created", onSelect);
    c.on("selection:updated", onSelect);
    c.on("selection:cleared", () => setSelection(null));
    c.on("object:added", commit);
    c.on("object:removed", commit);
    c.on("object:modified", commit);
    c.on("text:changed", commit);
    c.on("object:moving", (e) => {
      const o = e.target;
      const d = dimsRef.current;
      const threshold = 8 / c.getZoom();
      const center = o.getCenterPoint();
      let { x, y } = center;
      const v = Math.abs(x - d.W / 2) < threshold;
      const h = Math.abs(y - d.H / 2) < threshold;
      if (v) x = d.W / 2;
      if (h) y = d.H / 2;
      if (v || h) o.setPositionByOrigin(new Point(x, y), "center", "center");
      setSnap((s) => (s.v === v && s.h === h ? s : { v, h }));
    });
    c.on("mouse:up", () => setSnap({ v: false, h: false }));

    loadSide(sideRef.current).then(() => {
      // Fonts may finish loading after the first paint.
      document.fonts?.ready.then(() => refreshFonts(c));
    });

    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => setAiEnabled(Boolean(d.enabled)))
      .catch(() => {});

    return () => {
      c.dispose();
      host.innerHTML = "";
      fcRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------ zoom / fit
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const pad = window.innerWidth < 640 ? 32 : 96;
      const w = stage.clientWidth - pad;
      // Leave room for the guide legend above and the zoom bar below.
      const h = stage.clientHeight - pad - 56;
      setFit(Math.max(0.05, Math.min(w / dims.W, h / dims.H)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [dims.W, dims.H]);

  useEffect(() => {
    const c = fcRef.current;
    if (!c) return;
    c.setDimensions({ width: dims.W * zoom, height: dims.H * zoom });
    c.setZoom(zoom);
    c.requestRenderAll();
  }, [zoom, dims.W, dims.H, canvas]);

  // ------------------------------------------------------------ size change
  useEffect(() => {
    const prev = dimsRef.current;
    dimsRef.current = dims;
    const c = fcRef.current;
    if (!c || (prev.W === dims.W && prev.H === dims.H)) return;
    rescaleContent(c, prev, dims);
    c.getObjects().forEach((o) => {
      if (o.role === "bg-image" && o instanceof FabricImage) placeImageInBox(o, { left: 0, top: 0, width: dims.W, height: dims.H }, "cover");
    });
    c.requestRenderAll();
    commit();
  }, [dims, commit]);

  const firstSize = useRef(true);
  useEffect(() => {
    if (firstSize.current) {
      firstSize.current = false;
      return;
    }
    persist();
  }, [size, persist]);

  // ------------------------------------------------------------ sides
  const switchSide = useCallback(
    async (idx: number) => {
      if (idx === sideIdx) return;
      if (commitTimer.current) clearTimeout(commitTimer.current);
      saveSide();
      setSideIdx(idx);
      await loadSide(product.sides[idx]);
    },
    [sideIdx, saveSide, loadSide, product.sides],
  );

  // ------------------------------------------------------------ history
  const restore = useCallback(
    async (dir: -1 | 1) => {
      const c = fcRef.current;
      const h = historyRef.current[sideRef.current];
      if (!c || !h) return;
      const next = h.index + dir;
      if (next < 0 || next >= h.stack.length) return;
      if (commitTimer.current) clearTimeout(commitTimer.current);
      h.index = next;
      restoring.current = true;
      c.discardActiveObject();
      await deserialize(c, dimsRef.current, JSON.parse(h.stack[next]));
      restoring.current = false;
      c.requestRenderAll();
      saveSide();
      syncHistory();
      setSelection(null);
      refresh();
    },
    [saveSide, refresh, syncHistory],
  );
  const canUndo = historyFlags.undo;
  const canRedo = historyFlags.redo;

  // ------------------------------------------------------------ actions
  const addObject = useCallback<EditorApi["addObject"]>((obj, opts = {}) => {
    const c = fcRef.current;
    if (!c) return;
    const d = dimsRef.current;
    obj.uid ??= uid();
    if (opts.center !== false) {
      obj.set({ left: (d.W - obj.getScaledWidth()) / 2, top: (d.H - obj.getScaledHeight()) / 2 });
    }
    c.add(obj);
    obj.setCoords();
    if (opts.select !== false) c.setActiveObject(obj);
    c.requestRenderAll();
  }, []);

  const addToLibrary = useCallback((img: Omit<LibraryImage, "id">) => {
    const item = { ...img, id: uid() };
    setLibrary((l) => [item, ...l].slice(0, 30));
    return item;
  }, []);

  const addImage = useCallback<EditorApi["addImage"]>(
    async (src, opts = {}) => {
      const c = fcRef.current;
      if (!c) return;
      const d = dimsRef.current;
      try {
        const img = await loadImage(src);
        img.set({ uid: uid() });
        if (opts.asBackground) {
          placeImageInBox(img, { left: 0, top: 0, width: d.W, height: d.H }, "cover");
          img.set({ role: "bg-image" });
          c.getObjects()
            .filter((o) => o.role === "bg-image")
            .forEach((o) => c.remove(o));
          c.insertAt(1, img);
          c.setActiveObject(img);
        } else {
          placeImageInBox(img, { left: d.W * 0.2, top: d.H * 0.2, width: d.W * 0.6, height: d.H * 0.6 }, "contain");
          c.add(img);
          c.setActiveObject(img);
        }
        c.requestRenderAll();
      } catch {
        toast("That image couldn't be loaded. Try a PNG or JPG.", "error");
      }
    },
    [toast],
  );

  const fillSlot = useCallback(
    async (slot: Rect) => {
      const d = dimsRef.current;
      const ratio = (slot.width * slot.scaleX) / (slot.height * slot.scaleY);
      setAiBusy((n) => n + 1);
      try {
        const { image } = await postJSON<{ image: string }>("/api/ai/image", {
          prompt: slot.slotPrompt,
          ratio,
          transparent: slot.slotTransparent,
          productName: product.name,
        });
        addToLibrary({ src: image, label: slot.slotPrompt ?? "AI artwork", kind: "ai", transparent: slot.slotTransparent });
        const c = fcRef.current;
        if (!c || !c.getObjects().includes(slot)) {
          toast("Your AI artwork is ready in the Images tab.", "success");
          return;
        }
        const img = await loadImage(image);
        const box = { left: slot.left, top: slot.top, width: slot.width * slot.scaleX, height: slot.height * slot.scaleY };
        placeImageInBox(img, box, slot.slotTransparent ? "contain" : "cover");
        const full = box.width >= d.W * 0.95 && box.height >= d.H * 0.95;
        img.set({ uid: uid(), opacity: slot.opacity, role: full ? "bg-image" : undefined });
        const index = c.getObjects().indexOf(slot);
        c.remove(slot);
        c.insertAt(index, img);
        c.requestRenderAll();
        commit();
      } catch (e) {
        toast((e as Error).message, "error");
      } finally {
        setAiBusy((n) => n - 1);
      }
    },
    [product.name, addToLibrary, toast, commit],
  );

  const applyLayout = useCallback(
    async (layout: Layout) => {
      const c = fcRef.current;
      if (!c) return;
      restoring.current = true;
      c.discardActiveObject();
      const slots: Rect[] = [];
      await applyLayoutToCanvas(c, dimsRef.current, layout, { onImageSlot: (s) => slots.push(s) });
      restoring.current = false;
      commit();
      slots.forEach((s) => fillSlot(s));
      if (slots.length) toast("Painting your AI artwork… this takes about 20–60 seconds.", "info");
    },
    [commit, fillSlot, toast],
  );

  const palette = useMemo(() => {
    const used = new Set<string>();
    canvas?.getObjects().forEach((o) => {
      if (typeof o.fill === "string" && o.fill.startsWith("#")) used.add(o.fill.toLowerCase());
      if (typeof o.stroke === "string" && o.stroke.startsWith("#")) used.add(o.stroke.toLowerCase());
    });
    return [...used].slice(0, 8).concat(SWATCHES.filter((s) => !used.has(s)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, tick]);

  const openPanel = useCallback((id: PanelId) => {
    setPanel(id);
    setMobilePanelOpen(true);
  }, []);

  // ------------------------------------------------------------ keyboard
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      const c = fcRef.current;
      const t = e.target as HTMLElement;
      if (!c || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable) return;
      const active = c.getActiveObject();
      if (active instanceof Textbox && active.isEditing) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        restore(e.shiftKey ? 1 : -1);
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        restore(1);
      } else if (!active) {
        return;
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        c.getActiveObjects().forEach((o) => c.remove(o));
        c.discardActiveObject();
        c.requestRenderAll();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const clone = await active.clone(["uid", "role"]);
        clone.set({ left: active.left + 20, top: active.top + 20, uid: uid() });
        c.add(clone);
        c.setActiveObject(clone);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowLeft") active.set({ left: active.left - step });
        if (e.key === "ArrowRight") active.set({ left: active.left + step });
        if (e.key === "ArrowUp") active.set({ top: active.top - step });
        if (e.key === "ArrowDown") active.set({ top: active.top + step });
        active.setCoords();
        c.requestRenderAll();
        commit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [restore, commit]);

  const startOver = useCallback(async () => {
    if (!confirm("Start again with a blank design? This clears all sides.")) return;
    sidesRef.current = {};
    historyRef.current = {};
    try {
      localStorage.removeItem(storageKey(product.id));
    } catch {}
    setSideIdx(0);
    await loadSide(product.sides[0]);
    setStartOpen(true);
  }, [loadSide, product]);

  /** Snapshot of every side (current one freshly saved) for exporting. */
  const getSides = useCallback(() => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    saveSide();
    return product.sides.map((label) => ({ label, entry: sidesRef.current[label] }));
  }, [product.sides, saveSide]);

  const api: EditorApi = {
    canvas,
    dims,
    product,
    side,
    selection,
    tick,
    refresh,
    commit,
    details,
    setDetails,
    toast,
    addObject,
    applyLayout,
    library,
    addToLibrary,
    addImage,
    aiEnabled,
    aiBusy,
    setAiBusy,
    openPanel,
    palette,
  };

  const panelContent = (id: PanelId | null) => {
    switch (id) {
      case "templates":
        return <TemplatesPanel />;
      case "text":
        return <TextPanel />;
      case "uploads":
        return <UploadsPanel />;
      case "shapes":
        return <ShapesPanel />;
      case "background":
        return <BackgroundPanel />;
      default:
        return null;
    }
  };

  // The AI panel stays mounted so its results survive switching tabs.
  const panelBody = (
    <>
      <div className={panel === "ai" ? "" : "hidden"}>
        <AIPanel initialBrief={initial.brief} autoRun={autoRun} />
      </div>
      {panel !== "ai" && panelContent(panel)}
    </>
  );

  return (
    <EditorContext.Provider value={api}>
      <div className="flex h-dvh flex-col overflow-hidden bg-slate-100">
        {/* ------------------------------------------------ top bar */}
        <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 sm:px-3">
          <Link href="/products" className="btn-ghost px-2" aria-label="Back to products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="relative min-w-0">
            <button onClick={() => setSizeOpen((o) => !o)} className="flex min-w-0 items-center gap-1 rounded-lg px-2 py-1 text-left hover:bg-slate-100">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{product.name}</span>
                <span className="block truncate text-xs text-slate-500">{size.label}</span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
            {sizeOpen && <SizePicker product={product} value={size} onChange={setSize} onClose={() => setSizeOpen(false)} />}
          </div>

          {product.sides.length > 1 && (
            <div className="ml-1 hidden rounded-xl bg-slate-100 p-1 sm:flex">
              {product.sides.map((s, i) => (
                <button
                  key={s}
                  onClick={() => switchSide(i)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${i === sideIdx ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-1">
            {aiBusy > 0 && (
              <span className="hidden items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand md:inline-flex">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> AI is painting…
              </span>
            )}
            <button className="btn-ghost px-2" onClick={() => restore(-1)} disabled={!canUndo} title="Undo (Ctrl+Z)">
              <Undo2 className="h-5 w-5" />
            </button>
            <button className="btn-ghost hidden px-2 sm:inline-flex" onClick={() => restore(1)} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
              <Redo2 className="h-5 w-5" />
            </button>
            <button className="btn-ghost hidden px-2 md:inline-flex" onClick={startOver} title="Start over">
              <RotateCcw className="h-5 w-5" />
            </button>
            <DownloadMenu getSides={getSides}>
              <Download className="h-5 w-5" />
            </DownloadMenu>
            <button className="btn-secondary px-2.5 sm:px-4" onClick={() => setPreviewOpen(true)} aria-label="Preview">
              <Eye className="h-4 w-4" /> <span className="hidden sm:inline">Preview</span>
            </button>
            <button className="btn-primary" onClick={() => setOrderOpen(true)}>
              <ShoppingBag className="h-4 w-4" /> <span className="hidden sm:inline">Order</span>
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* ------------------------------------------------ left rail */}
          <nav className="hidden w-20 shrink-0 flex-col items-center gap-1 border-r border-slate-200 bg-white py-3 lg:flex">
            {PANELS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPanel(panel === p.id ? null : p.id)}
                className={`flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-semibold transition ${
                  panel === p.id ? "bg-brand/10 text-brand" : "text-slate-500 hover:bg-slate-100 hover:text-ink"
                }`}
              >
                <p.icon className="h-5 w-5" />
                {p.label}
              </button>
            ))}
          </nav>
          {isDesktop && (
            <aside className={`scrollbar-thin w-[340px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white ${panel ? "" : "hidden"}`}>
              <div className="flex items-center justify-between px-4 pt-4">
                <h2 className="text-sm font-bold text-ink">{PANELS.find((p) => p.id === panel)?.label}</h2>
                <button className="btn-ghost p-1" onClick={() => setPanel(null)} aria-label="Close panel">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">{panelBody}</div>
            </aside>
          )}

          {/* ------------------------------------------------ stage */}
          <main ref={stageRef} className="relative min-w-0 flex-1 overflow-auto">
            <div className="flex min-h-full items-start justify-center px-4 pt-10 pb-6 sm:p-12 lg:items-center" style={{ width: "max-content", minWidth: "100%" }}>
              <div className="relative shrink-0 bg-white shadow-[0_10px_40px_-10px_rgba(15,23,42,0.35)]" style={{ width: dims.W * zoom, height: dims.H * zoom }}>
                <div ref={hostRef} />
                <GuidesOverlay dims={dims} show={showGuides} snap={snap} product={product} />
              </div>
            </div>
            <div className="pointer-events-none sticky bottom-3 left-0 flex w-full justify-center px-3">
              <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur">
                <button className="btn-ghost p-2" onClick={() => setZoomFactor((z) => Math.max(0.25, z / 1.25))} aria-label="Zoom out">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button className="min-w-14 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100" onClick={() => setZoomFactor(1)}>
                  {Math.round(zoomFactor * 100)}%
                </button>
                <button className="btn-ghost p-2" onClick={() => setZoomFactor((z) => Math.min(8, z * 1.25))} aria-label="Zoom in">
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button className="btn-ghost p-2" onClick={() => setZoomFactor(1)} aria-label="Fit to screen">
                  <Maximize className="h-4 w-4" />
                </button>
                <span className="mx-1 h-5 w-px bg-slate-200" />
                <button
                  className={`btn-ghost p-2 ${showGuides ? "text-brand" : ""}`}
                  onClick={() => setShowGuides((s) => !s)}
                  title="Show print guides"
                  aria-label="Toggle print guides"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </main>

          {/* ------------------------------------------------ properties (desktop) */}
          <aside className="scrollbar-thin hidden w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white xl:block">
            <PropertiesPanel />
          </aside>
        </div>

        {/* ------------------------------------------------ mobile / tablet */}
        {product.sides.length > 1 && (
          <div className="flex justify-center border-t border-slate-200 bg-white py-1.5 sm:hidden">
            <div className="flex rounded-xl bg-slate-100 p-1">
              {product.sides.map((s, i) => (
                <button key={s} onClick={() => switchSide(i)} className={`rounded-lg px-4 py-1 text-xs font-semibold ${i === sideIdx ? "bg-white text-ink shadow-sm" : "text-slate-500"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <nav className="grid shrink-0 grid-cols-6 border-t border-slate-200 bg-white lg:hidden">
          {PANELS.map((p) => (
            <button
              key={p.id}
              onClick={() => openPanel(p.id)}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${mobilePanelOpen && panel === p.id ? "text-brand" : "text-slate-500"}`}
            >
              <p.icon className="h-5 w-5" />
              {p.label}
            </button>
          ))}
        </nav>
        {!isDesktop && (
          <div
            className={`fixed inset-x-0 bottom-[57px] z-30 flex max-h-[60dvh] flex-col rounded-t-3xl border-t border-slate-200 bg-white shadow-[0_-10px_40px_-10px_rgba(15,23,42,0.3)] ${mobilePanelOpen && panel ? "" : "hidden"}`}
          >
            <div className="flex items-center justify-between px-4 pt-3">
              <h2 className="text-sm font-bold text-ink">{PANELS.find((p) => p.id === panel)?.label}</h2>
              <button className="btn-ghost p-1" onClick={() => setMobilePanelOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">{panelBody}</div>
          </div>
        )}
        {selection && !mobilePanelOpen && (
          <div className="fixed inset-x-0 bottom-[57px] z-30 max-h-[42dvh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white shadow-[0_-10px_40px_-10px_rgba(15,23,42,0.3)] xl:hidden lg:bottom-0">
            <PropertiesPanel compact />
          </div>
        )}

        {/* ------------------------------------------------ toasts */}
        <div className="pointer-events-none fixed bottom-36 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4 lg:top-16 lg:bottom-auto">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={`rounded-xl px-4 py-2.5 text-center text-sm font-medium shadow-lg ${
                t.kind === "error" ? "bg-red-600 text-white" : t.kind === "success" ? "bg-emerald-600 text-white" : "bg-ink text-white"
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>

        {startOpen && (
          <StartDialog
            initialBrief={initial.brief}
            onClose={() => setStartOpen(false)}
            onChoose={(id, brief) => {
              setStartOpen(false);
              if (id === "ai" && brief) setAutoRun({ brief, nonce: Date.now() });
              if (id) openPanel(id);
            }}
            size={size}
            onSize={setSize}
          />
        )}
        {previewOpen && <PreviewDialog getSides={getSides} onClose={() => setPreviewOpen(false)} onOrder={() => { setPreviewOpen(false); setOrderOpen(true); }} />}
        {orderOpen && <OrderDialog getSides={getSides} size={size} onClose={() => setOrderOpen(false)} goToSide={switchSide} />}
      </div>
    </EditorContext.Provider>
  );
}
