"use client";

import { ActiveSelection, FabricImage, FabricObject, Textbox, Rect, Line, Group, Shadow, cache, filters } from "fabric";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Copy, Trash2, Lock, Unlock, ArrowUpToLine, ArrowDownToLine,
  ChevronUp, ChevronDown, FlipHorizontal, FlipVertical, AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, CaseUpper,
  Maximize2, Minimize2, MousePointerClick, Layers, Image as ImageIcon, Type, Square,
} from "lucide-react";
import { FONTS, ensureFont } from "@/lib/fonts";
import { useEditor } from "../context";
import { imageDpi, placeImageInBox, uid } from "../engine";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-b border-slate-100 px-4 py-3 last:border-0">
      <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{title}</p>
      {children}
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange, display }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; display?: string }) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-medium text-ink">{display ?? Math.round(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--brand)]" />
    </label>
  );
}

function Swatches({ value, onChange, palette, allowNone }: { value: string; onChange: (c: string) => void; palette: string[]; allowNone?: boolean }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-8 gap-1.5">
        {allowNone && (
          <button
            onClick={() => onChange("transparent")}
            className={`checker aspect-square rounded-md border ${value === "transparent" ? "ring-2 ring-brand ring-offset-1" : "border-slate-200"}`}
            aria-label="No colour"
            title="None"
          />
        )}
        {palette.slice(0, allowNone ? 23 : 24).map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`aspect-square rounded-md border ${value?.toLowerCase() === c ? "ring-2 ring-brand ring-offset-1" : "border-slate-200"}`}
            style={{ background: c }}
            aria-label={c}
          />
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border border-slate-200"
        />
        Custom colour
      </label>
    </div>
  );
}

const IconBtn = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
  <button onClick={onClick} title={title} aria-label={title} className={`grid h-9 flex-1 place-items-center rounded-lg border text-slate-700 transition ${active ? "border-brand bg-brand/10 text-brand" : "border-slate-200 hover:bg-slate-50"}`}>
    {children}
  </button>
);

function describe(o: FabricObject) {
  if (o instanceof Textbox) return { icon: Type, label: o.text.split("\n")[0].slice(0, 26) || "Text" };
  if (o instanceof FabricImage) return { icon: ImageIcon, label: o.role === "bg-image" ? "Background image" : "Image" };
  if (o.role === "ai-slot") return { icon: ImageIcon, label: "AI artwork (painting…)" };
  return { icon: Square, label: o instanceof Group ? "Graphic" : "Shape" };
}

export function PropertiesPanel({ compact = false }: { compact?: boolean }) {
  const { selection, canvas, commit, refresh, dims, palette, tick, product } = useEditor();
  void tick;

  if (!canvas) return null;

  if (!selection) {
    if (compact) return null;
    const objects = canvas.getObjects().filter((o) => o.role !== "background").reverse();
    return (
      <div>
        <div className="space-y-2 px-4 py-5 text-center">
          <MousePointerClick className="mx-auto h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-ink">Select something to edit it</p>
          <p className="text-xs text-slate-500">Click any text, picture or shape on your design. Double-click text to type.</p>
        </div>
        {objects.length > 0 && (
          <Section title="Layers">
            <ul className="space-y-1">
              {objects.map((o, i) => {
                const d = describe(o);
                return (
                  <li key={o.uid ?? i}>
                    <button
                      onClick={() => {
                        canvas.setActiveObject(o);
                        canvas.requestRenderAll();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <d.icon className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{d.label}</span>
                      {o.lockMovementX && <Lock className="ml-auto h-3.5 w-3.5 text-slate-400" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}
        <Section title="Shortcuts">
          <ul className="space-y-1 text-xs text-slate-500">
            <li><b className="text-slate-700">Delete</b> remove selected</li>
            <li><b className="text-slate-700">Ctrl/⌘ + Z</b> undo · <b className="text-slate-700">Shift</b> redo</li>
            <li><b className="text-slate-700">Ctrl/⌘ + D</b> duplicate</li>
            <li><b className="text-slate-700">Arrow keys</b> nudge (Shift = more)</li>
          </ul>
        </Section>
      </div>
    );
  }

  const o = selection;
  const S = Math.min(dims.W, dims.H);
  const isText = o instanceof Textbox;
  const isImage = o instanceof FabricImage;
  const isMulti = o instanceof ActiveSelection;
  const locked = Boolean(o.lockMovementX);

  const update = (props: Record<string, unknown>) => {
    o.set(props);
    if (o instanceof Textbox) o.initDimensions();
    o.setCoords();
    canvas.requestRenderAll();
    commit();
    refresh();
  };

  const setFont = async (family: string) => {
    if (!(o instanceof Textbox)) return;
    await ensureFont(family, o.fontWeight === "bold");
    cache.clearFontCache(family);
    update({ fontFamily: family });
  };

  const remove = () => {
    canvas.getActiveObjects().forEach((x) => canvas.remove(x));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  };

  const duplicate = async () => {
    const clone = await o.clone(["uid", "role"]);
    clone.set({ left: o.left + S * 0.03, top: o.top + S * 0.03, uid: uid(), role: o.role === "bg-image" ? undefined : o.role });
    canvas.discardActiveObject();
    if (clone instanceof ActiveSelection) {
      clone.canvas = canvas;
      clone.forEachObject((x) => canvas.add(x));
      clone.setCoords();
    } else {
      canvas.add(clone);
    }
    canvas.setActiveObject(clone);
    canvas.requestRenderAll();
  };

  const layer = (dir: "front" | "forward" | "backward" | "back") => {
    if (dir === "front") canvas.bringObjectToFront(o);
    if (dir === "forward") canvas.bringObjectForward(o);
    if (dir === "backward" && canvas.getObjects().indexOf(o) > 1) canvas.sendObjectBackwards(o);
    if (dir === "back") canvas.moveObjectTo(o, 1);
    canvas.requestRenderAll();
    commit();
    refresh();
  };

  const center = (axis: "h" | "v") => {
    if (axis === "h") o.set({ left: (dims.W - o.getScaledWidth()) / 2 });
    else o.set({ top: (dims.H - o.getScaledHeight()) / 2 });
    o.setCoords();
    canvas.requestRenderAll();
    commit();
  };

  const toggleLock = () =>
    update({ lockMovementX: !locked, lockMovementY: !locked, lockScalingX: !locked, lockScalingY: !locked, lockRotation: !locked, hasControls: locked });

  const fill = typeof o.fill === "string" ? o.fill : "#000000";
  const stroke = typeof o.stroke === "string" ? o.stroke : "#000000";

  return (
    <div className={compact ? "pb-2" : ""}>
      {compact && <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200" />}

      {isText && (
        <>
          <Section title="Text">
            <textarea className="input min-h-16 resize-y" value={o.text} onChange={(e) => update({ text: e.target.value })} />
            <select
              className="input py-2"
              value={o.fontFamily}
              onChange={(e) => setFont(e.target.value)}
              style={{ fontFamily: `"${o.fontFamily}"` }}
              aria-label="Font"
            >
              {FONTS.map((f) => (
                <option key={f.family} value={f.family} style={{ fontFamily: `"${f.family}"` }}>
                  {f.family}
                </option>
              ))}
            </select>
            <Slider
              label="Size"
              value={o.fontSize}
              min={Math.max(1, S * 0.01)}
              max={S * 0.8}
              step={S / 1000}
              onChange={(v) => update({ fontSize: v })}
              display={`≈ ${Math.round(((o.fontSize * o.scaleY) / dims.upm) * 0.7)} mm letters`}
            />
            <div className="flex gap-1.5">
              <IconBtn title="Bold" active={o.fontWeight === "bold" || Number(o.fontWeight) >= 600} onClick={async () => {
                const bold = !(o.fontWeight === "bold" || Number(o.fontWeight) >= 600);
                await ensureFont(o.fontFamily, bold);
                cache.clearFontCache(o.fontFamily);
                update({ fontWeight: bold ? "bold" : "normal" });
              }}>
                <Bold className="h-4 w-4" />
              </IconBtn>
              <IconBtn title="Italic" active={o.fontStyle === "italic"} onClick={() => update({ fontStyle: o.fontStyle === "italic" ? "normal" : "italic" })}>
                <Italic className="h-4 w-4" />
              </IconBtn>
              <IconBtn title="Underline" active={o.underline} onClick={() => update({ underline: !o.underline })}>
                <Underline className="h-4 w-4" />
              </IconBtn>
              <IconBtn title="Capitals" onClick={() => update({ text: o.text === o.text.toUpperCase() ? o.text.toLowerCase() : o.text.toUpperCase() })}>
                <CaseUpper className="h-4 w-4" />
              </IconBtn>
            </div>
            <div className="flex gap-1.5">
              {(["left", "center", "right"] as const).map((a) => {
                const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                return (
                  <IconBtn key={a} title={`Align ${a}`} active={o.textAlign === a} onClick={() => update({ textAlign: a })}>
                    <Icon className="h-4 w-4" />
                  </IconBtn>
                );
              })}
            </div>
          </Section>
          <Section title="Colour">
            <Swatches value={fill} onChange={(c) => update({ fill: c })} palette={palette} />
          </Section>
          <Section title="Spacing">
            <Slider label="Letter spacing" value={o.charSpacing} min={-100} max={800} step={10} onChange={(v) => update({ charSpacing: v })} />
            <Slider label="Line height" value={o.lineHeight} min={0.7} max={2.5} step={0.05} onChange={(v) => update({ lineHeight: v })} display={o.lineHeight.toFixed(2)} />
          </Section>
          <Section title="Effects">
            <Slider label="Outline" value={o.strokeWidth} min={0} max={S * 0.02} step={S / 2000} onChange={(v) => update({ strokeWidth: v, stroke: o.stroke || "#000000", paintFirst: "stroke" })} display={o.strokeWidth ? "On" : "Off"} />
            {o.strokeWidth > 0 && <Swatches value={stroke} onChange={(c) => update({ stroke: c })} palette={palette} />}
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--brand)]"
                checked={Boolean(o.shadow)}
                onChange={(e) =>
                  update({
                    shadow: e.target.checked ? new Shadow({ color: "rgba(0,0,0,0.35)", blur: o.fontSize * 0.08, offsetX: o.fontSize * 0.03, offsetY: o.fontSize * 0.04 }) : null,
                  })
                }
              />
              Drop shadow
            </label>
          </Section>
        </>
      )}

      {isImage && (
        <Section title="Picture">
          <ImageQuality img={o} />
          <div className="flex gap-1.5">
            <IconBtn title="Flip horizontally" active={o.flipX} onClick={() => update({ flipX: !o.flipX })}>
              <FlipHorizontal className="h-4 w-4" />
            </IconBtn>
            <IconBtn title="Flip vertically" active={o.flipY} onClick={() => update({ flipY: !o.flipY })}>
              <FlipVertical className="h-4 w-4" />
            </IconBtn>
            <IconBtn
              title="Fill the whole design"
              onClick={() => {
                placeImageInBox(o, { left: 0, top: 0, width: dims.W, height: dims.H }, "cover");
                o.set({ role: "bg-image", angle: 0 });
                canvas.moveObjectTo(o, 1);
                update({});
              }}
            >
              <Maximize2 className="h-4 w-4" />
            </IconBtn>
            <IconBtn
              title="Fit inside the design"
              onClick={() => {
                const m = (dims.bleedMm + dims.safeMm) * dims.upm;
                placeImageInBox(o, { left: m, top: m, width: dims.W - 2 * m, height: dims.H - 2 * m }, "contain");
                o.set({ role: undefined, angle: 0 });
                update({});
              }}
            >
              <Minimize2 className="h-4 w-4" />
            </IconBtn>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--brand)]"
              checked={o.filters.some((f) => f instanceof filters.RemoveColor)}
              onChange={(e) => {
                o.set({ filters: e.target.checked ? [new filters.RemoveColor({ color: "#FFFFFF", distance: 0.12 })] : [] });
                o.applyFilters();
                update({});
              }}
            />
            Remove white background
          </label>
        </Section>
      )}

      {!isText && !isImage && !isMulti && !(o instanceof Group) && (
        <Section title={o instanceof Line ? "Line colour" : "Fill"}>
          {o instanceof Line ? (
            <>
              <Swatches value={stroke} onChange={(c) => update({ stroke: c })} palette={palette} />
              <Slider label="Thickness" value={o.strokeWidth} min={S * 0.001} max={S * 0.05} step={S / 2000} onChange={(v) => update({ strokeWidth: v })} display="" />
            </>
          ) : (
            <>
              <Swatches value={fill} onChange={(c) => update({ fill: c })} palette={palette} allowNone />
              <Slider label="Outline" value={o.strokeWidth} min={0} max={S * 0.03} step={S / 2000} onChange={(v) => update({ strokeWidth: v, stroke: o.stroke || "#000000", strokeUniform: true })} display={o.strokeWidth ? "On" : "Off"} />
              {o.strokeWidth > 0 && <Swatches value={stroke} onChange={(c) => update({ stroke: c })} palette={palette} />}
              {o instanceof Rect && (
                <Slider label="Rounded corners" value={o.rx} min={0} max={Math.min(o.width, o.height) / 2} step={0.5} onChange={(v) => update({ rx: v, ry: v })} display="" />
              )}
            </>
          )}
        </Section>
      )}

      <Section title="Arrange">
        <Slider label="Transparency" value={o.opacity} min={0.05} max={1} step={0.05} onChange={(v) => update({ opacity: v })} display={`${Math.round(o.opacity * 100)}%`} />
        <div className="flex gap-1.5">
          <IconBtn title="Centre horizontally" onClick={() => center("h")}>
            <AlignHorizontalJustifyCenter className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Centre vertically" onClick={() => center("v")}>
            <AlignVerticalJustifyCenter className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Bring to front" onClick={() => layer("front")}>
            <ArrowUpToLine className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Bring forward" onClick={() => layer("forward")}>
            <ChevronUp className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Send backward" onClick={() => layer("backward")}>
            <ChevronDown className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Send to back" onClick={() => layer("back")}>
            <ArrowDownToLine className="h-4 w-4" />
          </IconBtn>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button className="btn-secondary px-2 py-2 text-xs" onClick={duplicate}>
            <Copy className="h-4 w-4" /> Copy
          </button>
          <button className="btn-secondary px-2 py-2 text-xs" onClick={toggleLock}>
            {locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />} {locked ? "Unlock" : "Lock"}
          </button>
          <button className="btn-secondary px-2 py-2 text-xs text-red-600" onClick={remove}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
        {!compact && (
          <p className="flex items-center gap-1 pt-1 text-[11px] text-slate-400">
            <Layers className="h-3 w-3" /> {product.name} · {dims.widthMm} × {dims.heightMm} mm
          </p>
        )}
      </Section>
    </div>
  );
}

function ImageQuality({ img }: { img: FabricImage }) {
  const { dims, product } = useEditor();
  const dpi = imageDpi(img, dims);
  const good = dpi >= product.targetDpi * 0.75;
  const ok = dpi >= product.minDpi;
  return (
    <div className={`rounded-lg px-3 py-2 text-xs font-medium ${good ? "bg-emerald-50 text-emerald-700" : ok ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
      {good ? "Great print quality" : ok ? "OK print quality" : "Low quality at this size. Make it smaller or use a bigger image."}
      <span className="ml-1 opacity-70">({Number.isFinite(dpi) ? dpi : "–"} dpi)</span>
    </div>
  );
}
