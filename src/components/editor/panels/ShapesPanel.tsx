"use client";

import { useEditor } from "../context";
import { makeShape, makeText } from "../engine";

const SHAPES: { id: string; label: string; svg: React.ReactNode }[] = [
  { id: "rect", label: "Square", svg: <rect x="4" y="8" width="32" height="24" /> },
  { id: "rounded", label: "Rounded", svg: <rect x="4" y="8" width="32" height="24" rx="6" /> },
  { id: "circle", label: "Circle", svg: <circle cx="20" cy="20" r="14" /> },
  { id: "triangle", label: "Triangle", svg: <path d="M20 6 L35 34 H5 Z" /> },
  { id: "star", label: "Star", svg: <path d="M20 4l4.7 10 10.8 1.2-8 7.4 2.2 10.6L20 28l-9.7 5.2 2.2-10.6-8-7.4L15.3 14z" /> },
  { id: "badge", label: "Badge", svg: <path d="M20 4l3 4 5-1 1 5 5 2-2 5 2 5-5 2-1 5-5-1-3 4-3-4-5 1-1-5-5-2 2-5-2-5 5-2 1-5 5 1z" /> },
  { id: "banner", label: "Ribbon", svg: <path d="M2 12 H38 L34 20 L38 28 H2 L6 20 Z" /> },
  { id: "frame", label: "Frame", svg: <rect x="5" y="9" width="30" height="22" fill="none" stroke="currentColor" strokeWidth="3" /> },
  { id: "line", label: "Line", svg: <line x1="4" y1="20" x2="36" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /> },
];

const ICONS = ["⭐", "❤️", "✂️", "💈", "☕", "🍕", "🍔", "🍰", "🌸", "🌿", "🏠", "🔧", "🚗", "🐾", "💪", "🎉", "🎂", "📞", "📍", "✉️", "🌐", "✅", "🔥", "💎", "🎵", "🍺", "🍷", "🧁", "🐟", "⚽", "🎨", "💅", "🧹", "🔨", "⚡", "☀️"];

export function ShapesPanel() {
  const { dims, addObject, palette } = useEditor();
  const S = Math.min(dims.W, dims.H);
  const colour = palette[0] && palette[0] !== "#ffffff" ? palette[0] : "#e11d74";
  return (
    <div className="space-y-5">
      <div>
        <span className="label">Shapes</span>
        <div className="grid grid-cols-3 gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              onClick={() => addObject(makeShape(s.id, dims, colour))}
              className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 py-3 text-slate-700 transition hover:border-brand hover:text-brand"
            >
              <svg viewBox="0 0 40 40" className="h-8 w-8" fill="currentColor">
                {s.svg}
              </svg>
              <span className="text-[11px] font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="label">Icons</span>
        <div className="grid grid-cols-6 gap-1.5">
          {ICONS.map((icon) => (
            <button
              key={icon}
              onClick={async () => addObject(await makeText(icon, { fontSize: S * 0.2, width: S * 0.3, fontFamily: "Inter" }))}
              className="grid aspect-square place-items-center rounded-lg text-2xl transition hover:bg-slate-100"
              aria-label={`Add ${icon}`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
