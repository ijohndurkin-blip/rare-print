"use client";

import { Gradient } from "fabric";
import { Sparkles, Trash2 } from "lucide-react";
import { useEditor, SWATCHES } from "../context";
import { getBackground, setBackground } from "../engine";

const GRADIENTS: [string, string, number][] = [
  ["#ff7e5f", "#feb47b", 0],
  ["#6a11cb", "#2575fc", 45],
  ["#0f172a", "#581c87", 90],
  ["#11998e", "#38ef7d", 45],
  ["#fc466b", "#3f5efb", 0],
  ["#f7971e", "#ffd200", 90],
  ["#232526", "#414345", 90],
  ["#e0eafc", "#cfdef3", 90],
  ["#ffecd2", "#fcb69f", 45],
  ["#c33764", "#1d2671", 45],
  ["#d4af37", "#8a6d1d", 45],
  ["#000000", "#434343", 0],
];

export function BackgroundPanel() {
  const { canvas, dims, commit, openPanel, tick } = useEditor();
  void tick;
  const bg = canvas ? getBackground(canvas) : undefined;
  const current = typeof bg?.fill === "string" ? bg.fill : "#ffffff";
  const bgImage = canvas?.getObjects().find((o) => o.role === "bg-image");

  const solid = (c: string) => {
    if (!canvas) return;
    setBackground(canvas, dims, { type: "solid", colors: [c] });
    commit();
  };
  return (
    <div className="space-y-5">
      <div>
        <span className="label">Colour</span>
        <div className="grid grid-cols-8 gap-1.5">
          {SWATCHES.map((c) => (
            <button
              key={c}
              onClick={() => solid(c)}
              className={`aspect-square rounded-lg border ${current.toLowerCase() === c ? "ring-2 ring-brand ring-offset-1" : "border-slate-200"}`}
              style={{ background: c }}
              aria-label={`Background ${c}`}
            />
          ))}
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-600">
          <input type="color" value={current.length === 7 ? current : "#ffffff"} onChange={(e) => solid(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-slate-200" />
          Pick any colour
        </label>
      </div>
      <div>
        <span className="label">Gradients</span>
        <div className="grid grid-cols-4 gap-2">
          {GRADIENTS.map(([a, b, angle]) => (
            <button
              key={a + b}
              onClick={() => {
                if (!canvas) return;
                setBackground(canvas, dims, { type: "gradient", colors: [a, b], angle });
                commit();
              }}
              className={`aspect-square rounded-lg border border-slate-200 ${bg?.fill instanceof Gradient && bg.bgSpec?.colors[0] === a ? "ring-2 ring-brand ring-offset-1" : ""}`}
              style={{ background: `linear-gradient(${angle + 90}deg, ${a}, ${b})` }}
              aria-label="Gradient background"
            />
          ))}
        </div>
      </div>
      <button className="btn-secondary w-full" onClick={() => openPanel("ai")}>
        <Sparkles className="h-4 w-4 text-brand" /> Generate a background with AI
      </button>
      {bgImage && (
        <button
          className="btn-ghost w-full text-red-600"
          onClick={() => {
            canvas?.remove(bgImage);
            canvas?.requestRenderAll();
          }}
        >
          <Trash2 className="h-4 w-4" /> Remove background image
        </button>
      )}
    </div>
  );
}
