"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { products } from "@/lib/products";

const KEYWORDS: [RegExp, string][] = [
  [/hanging|projecting|bracket/i, "hanging-sign"],
  [/a-?board|pavement|sandwich board/i, "a-board"],
  [/window/i, "window-graphics"],
  [/\bvan\b|vehicle|car door|magnet/i, "vehicle-magnets"],
  [/business card|\bcards?\b/i, "business-cards"],
  [/flyer|leaflet|handout/i, "leaflets"],
  [/poster/i, "posters"],
  [/menu/i, "menus"],
  [/sticker|label/i, "stickers"],
  [/roller|pull.?up|pop.?up|exhibition/i, "roller-banner"],
  [/banner/i, "pvc-banner"],
  [/wall|wallpaper|mural/i, "wall-graphics"],
  [/\bmugs?\b|cup/i, "mugs"],
  [/tote|\bbags?\b/i, "tote-bags"],
  [/coaster|beer mat/i, "coasters"],
  [/sign|fascia|shop ?front/i, "shop-sign"],
];

const EXAMPLES = [
  "A shop sign for my barbers called Fade Kings, black and gold",
  "Business cards for Bloom & Co florist, soft pastel colours",
  "Mugs for my nan's 80th birthday with flowers",
  "A roller banner for our gym open day",
];

export function HeroPrompt() {
  const router = useRouter();
  const [text, setText] = useState("");

  const go = (value = text) => {
    const brief = value.trim();
    const match = KEYWORDS.find(([re]) => re.test(brief));
    const qs = brief ? `?brief=${encodeURIComponent(brief)}` : "";
    router.push(match ? `/design/${match[1]}${qs}` : `/products${qs}`);
  };

  return (
    <div className="w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/5 sm:flex-row"
      >
        <label className="flex flex-1 items-center gap-3 px-3">
          <Sparkles className="h-5 w-5 shrink-0 text-brand" />
          <span className="sr-only">Describe what you need</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe what you need, e.g. a shop sign for my café…"
            className="w-full bg-transparent py-3 text-base text-ink placeholder:text-slate-400 focus:outline-none"
          />
        </label>
        <button type="submit" className="btn-primary px-6 py-3 text-base">
          Design it with AI <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" onClick={() => go(ex)} className="chip text-left">
            {ex}
          </button>
        ))}
      </div>
      <p className="sr-only">{products.length} products available</p>
    </div>
  );
}
