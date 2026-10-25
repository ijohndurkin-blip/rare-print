"use client";

import { useState } from "react";
import { Sparkles, LayoutTemplate, Upload, Square, ArrowRight, Ruler } from "lucide-react";
import type { SizePreset } from "@/lib/products";
import { useEditor } from "../context";
import type { PanelId } from "../context";
import { SizePicker } from "../SizePicker";
import { Modal } from "./Modal";

export function StartDialog({
  initialBrief,
  onClose,
  onChoose,
  size,
  onSize,
}: {
  initialBrief: string;
  onClose: () => void;
  onChoose: (panel: PanelId | null, brief?: string) => void;
  size: SizePreset;
  onSize: (s: SizePreset) => void;
}) {
  const { product, details, setDetails, aiEnabled } = useEditor();
  const [brief, setBrief] = useState(initialBrief);
  const [business, setBusiness] = useState(details.business ?? "");
  const [showSizes, setShowSizes] = useState(product.sizes.length > 1 || Boolean(product.customSize));

  const startAI = () => {
    if (business.trim()) setDetails({ ...details, business: business.trim() });
    const text = [brief.trim(), business.trim() && !brief.includes(business.trim()) ? `Business name: ${business.trim()}` : ""].filter(Boolean).join(". ");
    onChoose("ai", text || undefined);
  };

  const options = [
    { id: "templates" as const, icon: LayoutTemplate, title: "Pick a template", text: "Ready-made layouts filled with your details." },
    { id: "uploads" as const, icon: Upload, title: "Upload my artwork", text: "Got a logo or finished design? Drop it in." },
    { id: null, icon: Square, title: "Blank canvas", text: "Start from scratch with text, shapes and pictures." },
  ];

  return (
    <Modal title={`Let's create your ${product.name.toLowerCase()}`} subtitle={product.description} onClose={onClose}>
      <div className="space-y-5">
        {showSizes && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Ruler className="h-4 w-4 text-brand" /> 1. Choose your size
            </p>
            <SizePicker inline product={product} value={size} onChange={onSize} />
          </div>
        )}
        <div className="rounded-2xl border-2 border-brand/30 bg-brand/5 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-brand" /> {showSizes ? "2. " : ""}Let AI design it for you
          </p>
          <div className="mt-3 grid gap-2.5">
            <input className="input" placeholder="Business name (e.g. Fade Kings Barbers)" value={business} onChange={(e) => setBusiness(e.target.value)} />
            <textarea
              className="input min-h-20"
              placeholder="What's it for and how should it feel? e.g. A sign for my barbers. Black and gold, classic and masculine."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
            />
            <button className="btn-primary py-3" onClick={startAI} disabled={!aiEnabled || (!brief.trim() && !business.trim())}>
              <Sparkles className="h-4 w-4" /> Create my designs <ArrowRight className="h-4 w-4" />
            </button>
            {!aiEnabled && <p className="text-xs text-amber-700">AI is not switched on for this shop yet. Try a template instead.</p>}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Or</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {options.map((o) => (
              <button
                key={o.title}
                onClick={() => {
                  setShowSizes(false);
                  onChoose(o.id);
                }}
                className="rounded-2xl border border-slate-200 p-3 text-left transition hover:border-brand hover:shadow-sm"
              >
                <o.icon className="h-5 w-5 text-brand" />
                <p className="mt-2 text-sm font-semibold text-ink">{o.title}</p>
                <p className="text-xs text-slate-500">{o.text}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
