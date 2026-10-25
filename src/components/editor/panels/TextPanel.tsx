"use client";

import { Phone, Globe, Mail } from "lucide-react";
import { useEditor } from "../context";
import { makeText } from "../engine";

const PRESETS = [
  { label: "Bold Headline", font: "Anton", weight: "normal", sample: "BIG NEWS" },
  { label: "Elegant", font: "Playfair Display", weight: "bold", sample: "The Gallery" },
  { label: "Friendly script", font: "Pacifico", weight: "normal", sample: "Hello there" },
  { label: "Modern", font: "Montserrat", weight: "bold", sample: "Studio Nine" },
  { label: "Signage", font: "Bebas Neue", weight: "normal", sample: "OPEN 7 DAYS" },
  { label: "Handwritten", font: "Caveat", weight: "bold", sample: "Made with love" },
  { label: "Luxury", font: "Cinzel", weight: "bold", sample: "MAISON" },
  { label: "Fun", font: "Bangers", weight: "normal", sample: "WOW!" },
];

export function TextPanel() {
  const { dims, addObject, details } = useEditor();
  const S = Math.min(dims.W, dims.H);

  const add = async (text: string, size: number, font = "Montserrat", weight = "bold") => {
    const tb = await makeText(text, { width: dims.W * 0.8, fontSize: S * size, fontFamily: font, fontWeight: weight });
    addObject(tb);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-2">
        <button className="btn-secondary justify-start py-3 text-lg font-extrabold" onClick={() => add("Add a heading", 0.16)}>
          Add a heading
        </button>
        <button className="btn-secondary justify-start text-base font-semibold" onClick={() => add("Add a subheading", 0.09, "Montserrat", "600")}>
          Add a subheading
        </button>
        <button className="btn-secondary justify-start text-sm font-normal" onClick={() => add("Add a little bit of body text", 0.05, "Inter", "normal")}>
          Add body text
        </button>
      </div>

      <div>
        <span className="label">Quick add your details</span>
        <div className="grid gap-1.5">
          <button className="btn-ghost justify-start" onClick={() => add(details.phone || "0151 000 0000", 0.07, "Montserrat", "bold")}>
            <Phone className="h-4 w-4" /> {details.phone || "Phone number"}
          </button>
          <button className="btn-ghost justify-start" onClick={() => add(details.website || "www.yourbusiness.co.uk", 0.06, "Montserrat", "normal")}>
            <Globe className="h-4 w-4" /> {details.website || "Website"}
          </button>
          <button className="btn-ghost justify-start" onClick={() => add(details.email || "hello@yourbusiness.co.uk", 0.05, "Inter", "normal")}>
            <Mail className="h-4 w-4" /> {details.email || "Email"}
          </button>
        </div>
      </div>

      <div>
        <span className="label">Font styles</span>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => add(details.business || p.sample, 0.12, p.font, p.weight)}
              className="rounded-xl border border-slate-200 px-2 py-3 text-center transition hover:border-brand"
            >
              <span className="block truncate text-lg text-ink" style={{ fontFamily: `"${p.font}"`, fontWeight: p.weight === "bold" ? 700 : 400 }}>
                {p.sample}
              </span>
              <span className="text-[11px] text-slate-500">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500">Tip: double-click text on the canvas to type, or edit it in the panel on the right.</p>
    </div>
  );
}
