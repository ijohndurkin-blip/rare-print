"use client";

import { useEffect, useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { Mockup } from "@/components/Mockup";
import { useEditor } from "../context";
import { exportPreview, isBlank, withOffscreen } from "../engine";
import { Modal } from "./Modal";

type Sides = { label: string; entry?: { json: unknown; W: number; H: number } }[];

export function useSidePreviews(getSides: () => Sides, maxPx = 1200) {
  const { dims } = useEditor();
  const [previews, setPreviews] = useState<{ label: string; src: string; blank: boolean }[] | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const out = [];
      for (const s of getSides()) {
        const r = await withOffscreen(dims, s.entry, (c) => ({ src: exportPreview(c, dims, maxPx, "png"), blank: isBlank(c) }));
        out.push({ label: s.label, ...r });
      }
      if (alive) setPreviews(out);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return previews;
}

export function PreviewDialog({ getSides, onClose, onOrder }: { getSides: () => Sides; onClose: () => void; onOrder: () => void }) {
  const { product, dims } = useEditor();
  const previews = useSidePreviews(getSides);
  const [view, setView] = useState<"real" | "flat">("real");
  const used = previews?.filter((p, i) => i === 0 || !p.blank) ?? [];
  const ratio = dims.widthMm / dims.heightMm;

  return (
    <Modal
      wide
      title="Preview your design"
      subtitle={`${product.name} · ${dims.widthMm} × ${dims.heightMm} mm`}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(["real", "flat"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`rounded-lg px-3 py-1 text-xs font-semibold ${view === v ? "bg-white shadow-sm" : "text-slate-500"}`}>
                {v === "real" ? "In real life" : "Flat artwork"}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={onOrder}>
            <ShoppingBag className="h-4 w-4" /> Looks great, order
          </button>
        </div>
      }
    >
      {!previews ? (
        <div className="grid h-64 place-items-center text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : view === "real" ? (
        <div className="space-y-6">
          <Mockup kind={product.mockup} images={used.map((p) => p.src)} ratio={ratio} />
          {used.length > 1 && !["card", "paper"].includes(product.mockup) && (
            <p className="text-center text-xs text-slate-500">Showing the {used[0].label.toLowerCase()}. Switch to Flat artwork to see every side.</p>
          )}
          <p className="text-center text-xs text-slate-400">Illustration only. Your printed colours may vary slightly from your screen.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {used.map((p) => (
            <figure key={p.label} className={used.length === 1 ? "sm:col-span-2" : ""}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.label} className={`mx-auto max-h-[60vh] border border-slate-200 shadow-md ${dims.shape === "circle" ? "rounded-full" : ""}`} />
              <figcaption className="mt-2 text-center text-xs font-semibold text-slate-500">{p.label}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </Modal>
  );
}
