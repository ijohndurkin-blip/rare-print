import Link from "next/link";
import { tenant } from "@/lib/tenant";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${tenant.name} Design Studio home`}>
      {tenant.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tenant.logoUrl} alt={tenant.name} className="h-8 w-auto" />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-sm font-extrabold text-white">
          <span className="font-display tracking-tight">
            {tenant.name
              .split(/\s+/)
              .map((w) => w[0])
              .join("")
              .slice(0, 2)}
          </span>
        </span>
      )}
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-base font-bold text-ink">{tenant.name}</span>
          <span className="block text-[11px] font-medium tracking-wide text-slate-500 uppercase">Design Studio</span>
        </span>
      )}
    </Link>
  );
}
