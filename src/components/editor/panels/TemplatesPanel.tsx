"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { templatesFor, fillPlaceholders } from "@/lib/templates";
import { useEditor } from "../context";
import { renderLayoutThumb } from "../engine";
import { DetailsForm } from "./DetailsForm";

export function TemplatesPanel() {
  const { dims, details, setDetails, applyLayout, toast, product } = useEditor();
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [showDetails, setShowDetails] = useState(false);
  const list = templatesFor(dims.widthMm, dims.heightMm);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const out: Record<string, string> = {};
      for (const tpl of list) {
        out[tpl.id] = await renderLayoutThumb(dims, fillPlaceholders(tpl, details), 640);
        if (cancelled) return;
      }
      setThumbs(out);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims.W, dims.H, JSON.stringify(details)]);

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setShowDetails((s) => !s)} className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold text-slate-600">
        <span>Fill templates with your details</span>
        <ChevronDown className={`h-4 w-4 transition ${showDetails ? "rotate-180" : ""}`} />
      </button>
      {showDetails && <DetailsForm details={details} onChange={setDetails} product={product} />}
      <div className="grid gap-3">
        {list.map((tpl) => (
          <button
            key={tpl.id}
            onClick={async () => {
              await applyLayout(fillPlaceholders(tpl, details));
              toast(`"${tpl.name}" applied. Click any text to edit it.`, "success");
            }}
            className="group overflow-hidden rounded-xl border border-slate-200 text-left transition hover:border-brand hover:shadow-md"
          >
            {thumbs[tpl.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbs[tpl.id]} alt={tpl.name} className="w-full" />
            ) : (
              <div className="shimmer w-full" style={{ aspectRatio: String(Math.max(dims.W / dims.H, 0.6)) }} />
            )}
            <div className="p-2.5">
              <p className="text-sm font-semibold text-ink group-hover:text-brand">{tpl.name}</p>
              <p className="text-xs text-slate-500">{tpl.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
