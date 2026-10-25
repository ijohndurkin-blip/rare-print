"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, LogOut, Loader2, Mail, Phone, RefreshCw, Search, AlertTriangle, Package } from "lucide-react";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import type { AdminOrder } from "@/app/api/admin/orders/route";
import { tenant } from "@/lib/tenant";
import { Logo } from "@/components/site/Logo";

const STATUS_COLOURS: Record<OrderStatus, string> = {
  new: "bg-brand/10 text-brand",
  "proof-sent": "bg-sky-100 text-sky-700",
  approved: "bg-violet-100 text-violet-700",
  printing: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-700",
};

export function AdminDashboard() {
  const [state, setState] = useState<"loading" | "login" | "ready">("loading");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [storage, setStorage] = useState<{ driver: string; ephemeral: boolean } | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "open" | "all">("open");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    if (res.status === 401) {
      setState("login");
      return;
    }
    const data = await res.json();
    setOrders(data.orders);
    setStorage(data.storage);
    setState("ready");
  }, []);

  useEffect(() => {
    // Initial fetch; state is only set after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Login failed");
      return;
    }
    load();
  };

  const setStatus = async (id: string, status: OrderStatus) => {
    const res = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) {
      const { order } = await res.json();
      setOrders((list) => list.map((o) => (o.id === id ? { ...o, ...order } : o)));
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter === "open" && ["completed", "cancelled"].includes(o.status)) return false;
      if (filter !== "open" && filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      return [o.id, o.customer.name, o.customer.email, o.customer.company, o.productName].some((v) => v?.toLowerCase().includes(q));
    });
  }, [orders, filter, query]);

  if (state === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (state === "login") {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50 px-4">
        <form onSubmit={login} className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <Logo />
          <h1 className="font-display text-xl font-bold text-ink">Orders dashboard</h1>
          <input type="password" className="input" placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full">Sign in</button>
        </form>
      </div>
    );
  }

  const current = orders.find((o) => o.id === selected) ?? null;
  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s.id, orders.filter((o) => o.status === s.id).length]));

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={load} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              className="btn-ghost"
              onClick={async () => {
                await fetch("/api/admin/login", { method: "DELETE" });
                setState("login");
              }}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        {storage?.ephemeral && (
          <div className="flex gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            Orders are being stored temporarily. Connect a Vercel Blob store to this project so orders and artwork are kept safely.
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {(["open", "all", ...ORDER_STATUSES.map((s) => s.id)] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? "chip-active" : ""}`}>
              {f === "open" ? "Open" : f === "all" ? "All" : ORDER_STATUSES.find((s) => s.id === f)?.label}
              {f !== "open" && f !== "all" && counts[f] ? <span className="ml-1 opacity-60">{counts[f]}</span> : null}
            </button>
          ))}
          <label className="relative ml-auto w-full sm:w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search orders" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            <Package className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            No orders here yet. Share your studio link and they&apos;ll appear here.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
            <ul className="space-y-2">
              {visible.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => setSelected(o.id)}
                    className={`flex w-full gap-3 rounded-2xl border bg-white p-3 text-left transition ${selected === o.id ? "border-brand ring-1 ring-brand" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    {o.links["0"]?.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.links["0"].preview} alt="" className="h-16 w-24 shrink-0 rounded-lg border border-slate-100 bg-slate-50 object-contain" />
                    ) : (
                      <div className="h-16 w-24 shrink-0 rounded-lg bg-slate-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-ink">{o.id}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLOURS[o.status]}`}>
                          {ORDER_STATUSES.find((s) => s.id === o.status)?.label}
                        </span>
                      </div>
                      <p className="truncate text-sm font-semibold text-ink">{o.productName} × {o.quantity}</p>
                      <p className="truncate text-xs text-slate-500">
                        {o.customer.name}
                        {o.customer.company ? ` · ${o.customer.company}` : ""} · {new Date(o.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {current ? (
              <section className="h-fit space-y-5 rounded-3xl border border-slate-200 bg-white p-5 lg:sticky lg:top-20">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-ink">{current.id}</p>
                    <h2 className="font-display text-xl font-bold text-ink">{current.productName}</h2>
                    <p className="text-sm text-slate-500">
                      {current.sizeLabel} ({current.widthMm} × {current.heightMm} mm) · {current.materialLabel} · Qty {current.quantity}
                    </p>
                  </div>
                  <select className="input w-auto py-2" value={current.status} onChange={(e) => setStatus(current.id, e.target.value as OrderStatus)}>
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {current.sides.map((s, i) => (
                    <div key={s.label} className="space-y-2 rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">{s.label}</p>
                      {current.links[String(i)]?.preview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={current.links[String(i)].preview} alt={s.label} className="w-full rounded-lg border border-slate-200 bg-white" />
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {(["print", "svg", "design"] as const).map((k) =>
                          current.links[String(i)]?.[k] ? (
                            <a key={k} href={current.links[String(i)][k]} className="btn-secondary px-2.5 py-1.5 text-xs" target="_blank" rel="noreferrer">
                              <Download className="h-3.5 w-3.5" /> {k === "print" ? `Print PNG${s.printPx ? ` (${s.printPx.dpi}dpi)` : ""}` : k === "svg" ? "SVG" : "Design JSON"}
                            </a>
                          ) : null,
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {current.attachmentLinks.length > 0 && (
                  <div>
                    <p className="label">Customer attachments</p>
                    <div className="flex flex-wrap gap-1.5">
                      {current.attachmentLinks.map((a) => (
                        <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="btn-secondary px-2.5 py-1.5 text-xs">
                          <Download className="h-3.5 w-3.5" /> {a.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="label">Customer</dt>
                    <dd className="text-ink">{current.customer.name}{current.customer.company ? ` (${current.customer.company})` : ""}</dd>
                    <dd className="mt-1 flex flex-wrap gap-3 text-sm">
                      <a href={`mailto:${current.customer.email}?subject=${encodeURIComponent(`Your ${tenant.name} order ${current.id}`)}`} className="inline-flex items-center gap-1 text-brand">
                        <Mail className="h-3.5 w-3.5" /> {current.customer.email}
                      </a>
                      <a href={`tel:${current.customer.phone}`} className="inline-flex items-center gap-1 text-brand">
                        <Phone className="h-3.5 w-3.5" /> {current.customer.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="label">Fulfilment</dt>
                    <dd className="text-ink capitalize">{current.fulfilment}</dd>
                    {current.address && <dd className="text-slate-600 whitespace-pre-line">{current.address}</dd>}
                  </div>
                  <div>
                    <dt className="label">Estimate</dt>
                    <dd className="text-ink">{current.estimate != null ? `${tenant.currency}${current.estimate.toFixed(2)}` : "To quote"}</dd>
                  </div>
                  <div>
                    <dt className="label">Proof requested</dt>
                    <dd className="text-ink">{current.wantProof ? "Yes" : "No"}</dd>
                  </div>
                  {current.notes && (
                    <div className="sm:col-span-2">
                      <dt className="label">Notes</dt>
                      <dd className="whitespace-pre-line text-slate-700">{current.notes}</dd>
                    </div>
                  )}
                </dl>
              </section>
            ) : (
              <div className="hidden place-items-center rounded-3xl border border-dashed border-slate-300 p-12 text-sm text-slate-400 lg:grid">
                Select an order to see the artwork and details.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
