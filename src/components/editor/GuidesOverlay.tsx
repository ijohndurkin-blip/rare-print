"use client";

import type { Product } from "@/lib/products";
import type { Dims } from "./engine";

/** Print guides drawn over the canvas: bleed, trim line, safe area, snapping. */
export function GuidesOverlay({ dims, show, snap, product }: { dims: Dims; show: boolean; snap: { v: boolean; h: boolean }; product: Product }) {
  const { W, H, upm } = dims;
  const b = dims.bleedMm * upm;
  const s = (dims.bleedMm + dims.safeMm) * upm;
  const circle = dims.shape === "circle";
  const outer = `M0 0H${W}V${H}H0Z`;
  const trimPath = circle
    ? `M${W / 2 - (W / 2 - b)} ${H / 2}a${W / 2 - b} ${H / 2 - b} 0 1 0 ${2 * (W / 2 - b)} 0a${W / 2 - b} ${H / 2 - b} 0 1 0 ${-2 * (W / 2 - b)} 0Z`
    : `M${b} ${b}H${W - b}V${H - b}H${b}Z`;
  const handle = product.mockup === "mug" ? 0.07 * W : 0;
  const hiddenBottom = product.id === "roller-banner" ? 100 * upm : 0;

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {show && (
          <g>
            {b > 0 || circle ? <path d={`${outer} ${trimPath}`} fill="rgba(255,255,255,0.55)" fillRule="evenodd" /> : null}
            {circle ? (
              <>
                <ellipse cx={W / 2} cy={H / 2} rx={W / 2 - b} ry={H / 2 - b} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
                <ellipse cx={W / 2} cy={H / 2} rx={W / 2 - s} ry={H / 2 - s} fill="none" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
              </>
            ) : (
              <>
                {b > 0 && <rect x={b} y={b} width={W - 2 * b} height={H - 2 * b} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />}
                <rect x={s} y={s} width={W - 2 * s} height={H - 2 * s} fill="none" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
              </>
            )}
            {handle > 0 && (
              <>
                <rect x={0} y={0} width={handle} height={H} fill="rgba(15,23,42,0.08)" />
                <rect x={W - handle} y={0} width={handle} height={H} fill="rgba(15,23,42,0.08)" />
              </>
            )}
            {hiddenBottom > 0 && <rect x={0} y={H - b - hiddenBottom} width={W} height={hiddenBottom + b} fill="rgba(15,23,42,0.1)" />}
          </g>
        )}
        {snap.v && <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="#e11d74" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
        {snap.h && <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#e11d74" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
      </svg>
      {show && (
        <div className="pointer-events-none absolute -top-7 left-0 flex flex-wrap gap-x-3 text-[11px] font-medium whitespace-nowrap text-slate-500">
          {b > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-4 border-t-2 border-dashed border-red-500" /> Trim line
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="w-4 border-t-2 border-dotted border-sky-500" /> Keep text inside
          </span>
          {handle > 0 && <span>Shaded ends sit by the handle</span>}
          {hiddenBottom > 0 && <span>Bottom shaded area hides in the stand</span>}
        </div>
      )}
    </>
  );
}
