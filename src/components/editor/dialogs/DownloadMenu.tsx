"use client";

import { useState } from "react";
import { FileDown, ImageDown, Loader2 } from "lucide-react";
import { useEditor } from "../context";
import { exportPreview, exportPrint, isBlank, withOffscreen } from "../engine";
import { blobToDataUrl } from "../upload";

type Sides = { label: string; entry?: { json: unknown; W: number; H: number } }[];

function save(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function DownloadMenu({ getSides, children }: { getSides: () => Sides; children: React.ReactNode }) {
  const { dims, product, side, toast } = useEditor();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const slug = product.id;

  const png = async () => {
    setBusy("png");
    try {
      const s = getSides().find((x) => x.label === side);
      const url = await withOffscreen(dims, s?.entry, (c) => exportPreview(c, dims, 2400, "png"));
      save(url, `${slug}-${side.toLowerCase()}.png`);
    } finally {
      setBusy(null);
      setOpen(false);
    }
  };

  const pdf = async () => {
    setBusy("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const w = dims.totalWmm;
      const h = dims.totalHmm;
      const doc = new jsPDF({ unit: "mm", format: [w, h], orientation: w >= h ? "landscape" : "portrait", compress: true });
      let page = 0;
      for (const s of getSides()) {
        const result = await withOffscreen(dims, s.entry, async (c) => {
          if (page > 0 && isBlank(c)) return null;
          return exportPrint(c, dims, Math.min(product.targetDpi, 200));
        });
        if (!result) continue;
        if (page > 0) doc.addPage([w, h], w >= h ? "landscape" : "portrait");
        doc.addImage(await blobToDataUrl(result.blob), "PNG", 0, 0, w, h, undefined, "FAST");
        page++;
      }
      doc.save(`${slug}-print-ready.pdf`);
    } catch (e) {
      console.error(e);
      toast("Sorry, the PDF couldn't be created on this device.", "error");
    } finally {
      setBusy(null);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button className="btn-ghost px-2" onClick={() => setOpen((o) => !o)} title="Download" aria-label="Download">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 z-40 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            <button className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left hover:bg-slate-50" onClick={png} disabled={Boolean(busy)}>
              <ImageDown className="mt-0.5 h-5 w-5 text-brand" />
              <span>
                <span className="block text-sm font-semibold text-ink">Image (PNG)</span>
                <span className="text-xs text-slate-500">Share your {side.toLowerCase()} design</span>
              </span>
            </button>
            <button className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left hover:bg-slate-50" onClick={pdf} disabled={Boolean(busy)}>
              <FileDown className="mt-0.5 h-5 w-5 text-brand" />
              <span>
                <span className="block text-sm font-semibold text-ink">Print-ready PDF</span>
                <span className="text-xs text-slate-500">Full size with {dims.bleedMm}mm bleed, all sides</span>
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
