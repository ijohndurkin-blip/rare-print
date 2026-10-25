import Link from "next/link";
import { Phone } from "lucide-react";
import { tenant } from "@/lib/tenant";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex">
          <Link href="/products" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-ink">Products</Link>
          <Link href="/#how-it-works" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-ink">How it works</Link>
          <Link href="/#ai" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-ink">AI tools</Link>
          <a href={tenant.website} className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-ink">Main site</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href={`tel:${tenant.phone.replace(/\s/g, "")}`} className="btn-ghost hidden lg:inline-flex">
            <Phone className="h-4 w-4" /> {tenant.phone}
          </a>
          <Link href="/products" className="btn-primary">Start designing</Link>
        </div>
      </div>
    </header>
  );
}
