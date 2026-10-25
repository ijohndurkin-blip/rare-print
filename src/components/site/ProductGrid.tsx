import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/products";
import { tenant } from "@/lib/tenant";

function fromPrice(p: Product) {
  if (!tenant.showPrices) return null;
  const pr = p.pricing;
  const value = pr.type === "area" ? pr.min : pr.type === "unit" ? pr.each : Math.min(...Object.values(pr.tiers));
  return `From ${tenant.currency}${value}`;
}

export function ProductGrid({ items, brief }: { items: Product[]; brief?: string }) {
  const qs = brief ? `?brief=${encodeURIComponent(brief)}` : "";
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => {
        const s = p.sizes[0];
        const ratio = s.widthMm / s.heightMm;
        return (
          <Link
            key={p.id}
            href={`/design/${p.id}${qs}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-slate-900/5"
          >
            <div className="relative grid h-40 place-items-center bg-gradient-to-br from-slate-50 to-slate-100">
              <div
                className={`grid place-items-center border-2 border-dashed border-slate-300 bg-white text-4xl shadow-sm ${p.shape === "circle" ? "rounded-full" : "rounded-md"}`}
                style={ratio >= 1 ? { width: "70%", maxWidth: 220, aspectRatio: String(Math.min(ratio, 5)) } : { height: "78%", aspectRatio: String(ratio) }}
              >
                <span className="transition group-hover:scale-110">{p.emoji}</span>
              </div>
              <span className="absolute bottom-2 left-3 text-[11px] font-medium text-slate-400">{s.label}</span>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-semibold text-ink">{p.name}</h3>
              <p className="mt-0.5 text-sm text-slate-600">{p.tagline}</p>
              <div className="mt-auto flex items-center justify-between pt-3 text-sm">
                <span className="font-medium text-slate-500">{fromPrice(p)}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-brand">
                  Design <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
