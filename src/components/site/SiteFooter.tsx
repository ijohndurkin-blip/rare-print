import Link from "next/link";
import { tenant } from "@/lib/tenant";
import { categories, productsByCategory } from "@/lib/products";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-100 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-3 text-sm text-slate-600">
          <Logo />
          <p>{tenant.tagline}.</p>
          <p>{tenant.address}</p>
          <p>
            <a href={`tel:${tenant.phone.replace(/\s/g, "")}`} className="hover:text-brand">{tenant.phone}</a>
            <br />
            <a href={`mailto:${tenant.email}`} className="hover:text-brand">{tenant.email}</a>
          </p>
        </div>
        {categories.map((c) => (
          <div key={c.id}>
            <h3 className="mb-3 text-sm font-semibold text-ink">{c.name}</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {productsByCategory(c.id).map((p) => (
                <li key={p.id}>
                  <Link href={`/design/${p.id}`} className="hover:text-brand">{p.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200/70 py-4 text-center text-xs text-slate-400">
        © {tenant.name}. Design Studio powered by {tenant.platformName}.
      </div>
    </footer>
  );
}
