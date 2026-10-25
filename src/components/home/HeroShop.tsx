"use client";

import { useEffect, useState } from "react";
import { Shopfront } from "@/components/Mockup";

const NAMES = ["FADE KINGS", "THE DAILY GRIND", "BLOOM & CO", "LUIGI'S PIZZA", "IRON GYM"];

export function HeroShop() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % NAMES.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10">
      <Shopfront ratio={4} label={NAMES[i]} />
      <div className="absolute top-6 right-6 flex items-center gap-1.5 rounded-full bg-ink/90 px-3 py-1.5 text-xs font-semibold text-white">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> AI designing…
      </div>
    </div>
  );
}
