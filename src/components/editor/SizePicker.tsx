"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { Product, SizePreset } from "@/lib/products";

export function SizePicker({
  product,
  value,
  onChange,
  onClose,
  inline = false,
}: {
  product: Product;
  value: SizePreset;
  onChange: (s: SizePreset) => void;
  onClose?: () => void;
  inline?: boolean;
}) {
  const [w, setW] = useState(String(value.widthMm));
  const [h, setH] = useState(String(value.heightMm));
  const c = product.customSize;
  const wNum = Number(w);
  const hNum = Number(h);
  const valid = c && wNum >= c.minW && wNum <= c.maxW && hNum >= c.minH && hNum <= c.maxH;

  const body = (
    <div className="space-y-3">
      <div className="grid gap-1.5">
        {product.sizes.map((s) => {
          const active = s.widthMm === value.widthMm && s.heightMm === value.heightMm;
          return (
            <button
              key={s.id}
              onClick={() => {
                onChange(s);
                onClose?.();
              }}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                active ? "border-brand bg-brand/5 font-semibold text-brand" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span>
                {s.label}
                <span className="ml-2 text-xs font-normal text-slate-400">{s.widthMm} × {s.heightMm} mm</span>
              </span>
              {active && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
      {c && (
        <div className="rounded-xl border border-dashed border-slate-300 p-3">
          <p className="mb-2 text-xs font-semibold text-slate-600">Custom size (mm) — measure your space</p>
          <div className="flex items-center gap-2">
            <input className="input py-1.5" inputMode="numeric" value={w} onChange={(e) => setW(e.target.value)} aria-label="Width in mm" />
            <span className="text-slate-400">×</span>
            <input className="input py-1.5" inputMode="numeric" value={h} onChange={(e) => setH(e.target.value)} aria-label="Height in mm" />
            <button
              className="btn-primary px-3 py-1.5"
              disabled={!valid}
              onClick={() => {
                onChange({ id: `custom-${wNum}x${hNum}`, label: `Custom ${wNum} × ${hNum} mm`, widthMm: wNum, heightMm: hNum });
                onClose?.();
              }}
            >
              Set
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Width {c.minW}–{c.maxW} mm, height {c.minH}–{c.maxH} mm
          </p>
        </div>
      )}
    </div>
  );

  if (inline) return body;
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute top-full left-0 z-40 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
        <p className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Size</p>
        {body}
      </div>
    </>
  );
}
