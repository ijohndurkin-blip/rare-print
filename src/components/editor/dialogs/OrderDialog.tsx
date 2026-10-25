"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, XCircle, Paperclip, ArrowLeft, ArrowRight, PartyPopper, ShieldCheck, ChevronDown } from "lucide-react";
import { estimatePrice, type SizePreset } from "@/lib/products";
import type { OrderInput, OrderSide, StoredFile } from "@/lib/orders";
import { tenant } from "@/lib/tenant";
import { useEditor, postJSON } from "../context";
import { exportPreview, exportPrint, exportSVG, isBlank, printCheck, serialize, withOffscreen, uid, type Issue } from "../engine";
import { uploadFile, dataUrlToBlob } from "../upload";
import { Reviewer } from "../panels/AIPanel";
import { Modal } from "./Modal";

type Sides = { label: string; entry?: { json: unknown; W: number; H: number } }[];
type Step = "check" | "options" | "details" | "sending" | "done";

interface SideCheck {
  label: string;
  preview: string;
  blank: boolean;
  issues: Issue[];
}

const CONTACT_KEY = "rp:contact";

export function OrderDialog({
  getSides,
  size,
  onClose,
  goToSide,
}: {
  getSides: () => Sides;
  size: SizePreset;
  onClose: () => void;
  goToSide: (idx: number) => void;
}) {
  const { product, dims, details } = useEditor();
  const [step, setStep] = useState<Step>("check");
  const [checks, setChecks] = useState<SideCheck[] | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [material, setMaterial] = useState(product.materials[0].id);
  const [quantity, setQuantity] = useState(product.quantities[0]);
  const [fulfilment, setFulfilment] = useState<OrderInput["fulfilment"]>("collect");
  const [contact, setContact] = useState(() => {
    const blank = { name: details.name ?? "", email: details.email ?? "", phone: details.phone ?? "", company: details.business ?? "", address: "" };
    try {
      return { ...blank, ...JSON.parse(localStorage.getItem(CONTACT_KEY) || "{}") };
    } catch {
      return blank;
    }
  });
  const [notes, setNotes] = useState("");
  const [wantProof, setWantProof] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const sidesSnapshot = useRef<Sides>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      sidesSnapshot.current = getSides();
      const out: SideCheck[] = [];
      for (const s of sidesSnapshot.current) {
        const r = await withOffscreen(dims, s.entry, (c) => ({
          preview: exportPreview(c, dims, 600, "png"),
          blank: isBlank(c),
          issues: printCheck(c, dims, product),
        }));
        out.push({ label: s.label, ...r });
      }
      if (alive) setChecks(out);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const printable = checks?.filter((c, i) => i === 0 || !c.blank) ?? [];
  const blockers = checks
    ? checks.flatMap((c, i) => (i > 0 && c.blank ? [] : c.issues.filter((x) => x.level === "error").map((x) => ({ ...x, side: c.label }))))
    : [];
  const warnings = checks ? checks.flatMap((c, i) => (i > 0 && c.blank ? [] : c.issues.filter((x) => x.level === "warn").map((x) => ({ ...x, side: c.label })))) : [];
  const blankBacks = checks?.filter((c, i) => i > 0 && c.blank).map((c) => c.label) ?? [];

  const estimate = useMemo(
    () => estimatePrice({ product, widthMm: dims.widthMm, heightMm: dims.heightMm, materialId: material, quantity }),
    [product, dims.widthMm, dims.heightMm, material, quantity],
  );

  const contactValid = contact.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) && contact.phone.trim().length >= 6;
  const needsAddress = fulfilment !== "collect";

  const submit = async () => {
    setStep("sending");
    setError(null);
    try {
      localStorage.setItem(CONTACT_KEY, JSON.stringify(contact));
    } catch {}
    try {
      const folder = `${new Date().toISOString().slice(0, 10)}-${uid()}`;
      const sides: OrderSide[] = [];
      const all = sidesSnapshot.current;
      for (let i = 0; i < all.length; i++) {
        const s = all[i];
        const check = checks![i];
        if (i > 0 && check.blank) continue;
        const name = s.label.toLowerCase();
        setProgress(`Creating your print file${all.length > 1 ? ` (${s.label})` : ""}…`);
        const files = await withOffscreen(dims, s.entry, async (c) => ({
          print: await exportPrint(c, dims, product.targetDpi),
          preview: exportPreview(c, dims, 1400, "jpeg"),
          svg: exportSVG(c, dims),
          json: JSON.stringify({ product: product.id, widthMm: dims.widthMm, heightMm: dims.heightMm, bleedMm: dims.bleedMm, canvas: { W: dims.W, H: dims.H }, design: serialize(c) }),
        }));
        setProgress(`Uploading your artwork${all.length > 1 ? ` (${s.label})` : ""}…`);
        const [print, preview, svg, design] = await Promise.all([
          uploadFile(files.print.blob, `${name}-print.png`, folder),
          uploadFile(dataUrlToBlob(files.preview), `${name}-preview.jpg`, folder),
          uploadFile(new Blob([files.svg], { type: "image/svg+xml" }), `${name}.svg`, folder),
          uploadFile(new Blob([files.json], { type: "application/json" }), `${name}-design.json`, folder),
        ]);
        sides.push({ label: s.label, print, preview, svg, design, printPx: { width: files.print.width, height: files.print.height, dpi: files.print.dpi } });
      }
      const extra: StoredFile[] = [];
      for (const f of attachments) {
        setProgress(`Uploading ${f.name}…`);
        extra.push(await uploadFile(f, f.name, folder));
      }
      setProgress("Placing your order…");
      const material_ = product.materials.find((m) => m.id === material)!;
      const body: OrderInput & { attachments: StoredFile[] } = {
        productId: product.id,
        widthMm: dims.widthMm,
        heightMm: dims.heightMm,
        sizeLabel: size.label,
        materialId: material_.id,
        quantity,
        sides,
        customer: { name: contact.name, email: contact.email, phone: contact.phone, company: contact.company },
        fulfilment,
        address: needsAddress ? contact.address : undefined,
        notes: [notes, blankBacks.length ? `(${blankBacks.join(", ")} left blank – single sided)` : ""].filter(Boolean).join("\n"),
        wantProof,
        attachments: extra,
      };
      const { id } = await postJSON<{ id: string }>("/api/orders", body);
      setOrderId(id);
      setStep("done");
    } catch (e) {
      console.error(e);
      setError((e as Error).message || "Something went wrong.");
      setStep("details");
    }
  };

  const stepIndex = { check: 0, options: 1, details: 2, sending: 2, done: 3 }[step];
  const titles = ["Check your design", "Choose your options", "Your details", "Order sent!"];

  if (step === "done" && orderId) {
    return (
      <Modal title={titles[3]} onClose={onClose}>
        <div className="space-y-4 py-4 text-center">
          <PartyPopper className="mx-auto h-12 w-12 text-brand" />
          <p className="font-display text-2xl font-bold text-ink">Thank you, {contact.name.split(" ")[0]}!</p>
          <p className="text-slate-600">
            Your order reference is <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono font-bold text-ink">{orderId}</span>
          </p>
          <p className="text-sm text-slate-600">
            {wantProof
              ? `The ${tenant.name} team will check your artwork and email a proof to ${contact.email} before anything is printed.`
              : `The ${tenant.name} team will be in touch at ${contact.email} to confirm everything.`}
          </p>
          <p className="text-sm text-slate-500">Questions? Call {tenant.phone}</p>
          <div className="flex flex-col justify-center gap-2 pt-2 sm:flex-row">
            <Link href="/products" className="btn-primary">Design something else</Link>
            <button className="btn-secondary" onClick={onClose}>Back to my design</button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      wide
      title={titles[stepIndex]}
      subtitle={
        <span className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-1.5 w-8 rounded-full ${i <= stepIndex ? "bg-brand" : "bg-slate-200"}`} />
          ))}
          <span className="ml-2">Step {stepIndex + 1} of 3</span>
        </span>
      }
      onClose={step === "sending" ? undefined : onClose}
      footer={
        step === "sending" ? null : (
          <div className="flex items-center justify-between gap-3">
            {step === "check" ? (
              <button className="btn-ghost" onClick={onClose}>Keep editing</button>
            ) : (
              <button className="btn-ghost" onClick={() => setStep(step === "details" ? "options" : "check")}>
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
            {step === "check" && (
              <button className="btn-primary" disabled={!checks || blockers.length > 0 || !confirmed} onClick={() => setStep("options")}>
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {step === "options" && (
              <button className="btn-primary" onClick={() => setStep("details")}>
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {step === "details" && (
              <button className="btn-primary" disabled={!contactValid || (needsAddress && !contact.address.trim())} onClick={submit}>
                Send my order <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      }
    >
      {step === "check" && (
        <div className="space-y-5">
          {!checks ? (
            <div className="grid h-48 place-items-center text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap justify-center gap-4 rounded-2xl bg-slate-50 p-4">
                {printable.map((c) => (
                  <figure key={c.label} className="text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.preview} alt={c.label} className={`max-h-48 max-w-full border border-slate-200 bg-white shadow ${dims.shape === "circle" ? "rounded-full" : ""}`} />
                    <figcaption className="mt-1.5 text-xs font-semibold text-slate-500">{c.label}</figcaption>
                  </figure>
                ))}
              </div>
              <ul className="space-y-2">
                {blockers.map((x, i) => (
                  <li key={`b${i}`} className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
                    <XCircle className="h-5 w-5 shrink-0" />
                    <span className="flex-1">
                      {checks.length > 1 && <b>{x.side}: </b>}
                      {x.message}
                    </span>
                    <FixButton side={x.side} goToSide={goToSide} onClose={onClose} />
                  </li>
                ))}
                {warnings.map((x, i) => (
                  <li key={`w${i}`} className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span className="flex-1">
                      {checks.length > 1 && <b>{x.side}: </b>}
                      {x.message}
                    </span>
                    <FixButton side={x.side} goToSide={goToSide} onClose={onClose} />
                  </li>
                ))}
                {blankBacks.length > 0 && (
                  <li className="flex gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-slate-400" />
                    {blankBacks.join(", ")} {blankBacks.length > 1 ? "are" : "is"} blank, so this will be printed single-sided.
                  </li>
                )}
                {blockers.length === 0 && warnings.length === 0 && (
                  <li className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                    <CheckCircle2 className="h-5 w-5 shrink-0" /> Looking good! No print problems found.
                  </li>
                )}
              </ul>
              <div className="rounded-xl border border-slate-200">
                <button className="flex w-full items-center justify-between p-3 text-sm font-semibold text-ink" onClick={() => setShowReview((s) => !s)}>
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand" /> Get a second opinion from our AI designer
                  </span>
                  <ChevronDown className={`h-4 w-4 transition ${showReview ? "rotate-180" : ""}`} />
                </button>
                {showReview && (
                  <div className="border-t border-slate-100 p-3">
                    <Reviewer />
                  </div>
                )}
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
                <span className="text-sm text-slate-700">I&apos;ve checked the spelling, phone numbers and details on my design.</span>
              </label>
            </>
          )}
        </div>
      )}

      {step === "options" && (
        <div className="space-y-6">
          <div>
            <p className="label">Size</p>
            <p className="text-sm font-semibold text-ink">
              {size.label} <span className="font-normal text-slate-500">({dims.widthMm} × {dims.heightMm} mm)</span>
            </p>
          </div>
          <div>
            <p className="label">Material &amp; finish</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {product.materials.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMaterial(m.id)}
                  className={`rounded-xl border p-3 text-left transition ${material === m.id ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <p className="text-sm font-semibold text-ink">{m.label}</p>
                  <p className="text-xs text-slate-500">{m.description}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Quantity</p>
            <div className="flex flex-wrap gap-2">
              {product.quantities.map((q) => (
                <button key={q} onClick={() => setQuantity(q)} className={`chip px-4 py-2 text-sm ${quantity === q ? "chip-active" : ""}`}>
                  {q.toLocaleString()}
                </button>
              ))}
              <input
                className="input w-28 py-1.5"
                inputMode="numeric"
                placeholder="Other"
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (n > 0) setQuantity(n);
                }}
                aria-label="Custom quantity"
              />
            </div>
          </div>
          <div>
            <p className="label">How would you like it?</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["collect", `Collect from ${tenant.city}`, "Free, from our studio"],
                  ["deliver", "Deliver to me", "UK delivery"],
                  ...(product.category === "signage" ? [["install", "Fit it for me", "Our installers fit it"]] : []),
                ] as [OrderInput["fulfilment"], string, string][]
              ).map(([id, label, text]) => (
                <button
                  key={id}
                  onClick={() => setFulfilment(id)}
                  className={`rounded-xl border p-3 text-left transition ${fulfilment === id ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <p className="text-sm font-semibold text-ink">{label}</p>
                  <p className="text-xs text-slate-500">{text}</p>
                </button>
              ))}
            </div>
          </div>
          {tenant.showPrices && estimate != null && (
            <div className="flex items-center justify-between rounded-2xl bg-ink p-4 text-white">
              <div>
                <p className="text-xs text-slate-300">Estimated price</p>
                <p className="font-display text-3xl font-bold">
                  {tenant.currency}
                  {estimate.toFixed(2)}
                </p>
              </div>
              <p className="max-w-56 text-right text-xs text-slate-300">
                Guide price{fulfilment !== "collect" ? `, ${fulfilment === "install" ? "fitting" : "delivery"} quoted separately` : ""}. We confirm the final price with your proof. Nothing to pay yet.
              </p>
            </div>
          )}
        </div>
      )}

      {(step === "details" || step === "sending") && (
        <div className="relative">
          {step === "sending" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
              <p className="font-semibold text-ink">{progress}</p>
              <p className="text-xs text-slate-500">Please keep this window open.</p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
            {(
              [
                ["name", "Your name", "name", "text"],
                ["company", "Business name (optional)", "organization", "text"],
                ["email", "Email", "email", "email"],
                ["phone", "Phone", "tel", "tel"],
              ] as const
            ).map(([key, label, auto, type]) => (
              <div key={key}>
                <label className="label" htmlFor={`c-${key}`}>{label}</label>
                <input
                  id={`c-${key}`}
                  className="input"
                  type={type}
                  autoComplete={auto}
                  value={contact[key]}
                  onChange={(e) => setContact({ ...contact, [key]: e.target.value })}
                />
              </div>
            ))}
            {needsAddress && (
              <div className="sm:col-span-2">
                <label className="label" htmlFor="c-address">{fulfilment === "install" ? "Where should we fit it?" : "Delivery address"}</label>
                <textarea id="c-address" className="input min-h-20" autoComplete="street-address" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-notes">Anything else we should know?</label>
              <textarea id="c-notes" className="input min-h-20" placeholder="Deadlines, colours to match, fixing details…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <button type="button" className="btn-ghost px-0" onClick={() => fileInput.current?.click()}>
                <Paperclip className="h-4 w-4" /> Attach extra files (logo, PDF, photos of the site)
              </button>
              <input
                ref={fileInput}
                type="file"
                multiple
                hidden
                accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                onChange={(e) => {
                  setAttachments((a) => [...a, ...Array.from(e.target.files ?? [])].slice(0, 6));
                  e.target.value = "";
                }}
              />
              {attachments.length > 0 && (
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  {attachments.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {f.name}
                      <button className="text-red-600" onClick={() => setAttachments((a) => a.filter((_, j) => j !== i))}>
                        remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 sm:col-span-2">
              <input type="checkbox" checked={wantProof} onChange={(e) => setWantProof(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
              <span className="text-sm text-slate-700">
                <span className="font-semibold text-ink">Send me a proof first</span> (recommended). A real person checks your artwork and emails a proof for you to approve before we print.
              </span>
            </label>
          </div>
        </div>
      )}
    </Modal>
  );
}

function FixButton({ side, goToSide, onClose }: { side: string; goToSide: (i: number) => void; onClose: () => void }) {
  const { product } = useEditor();
  return (
    <button
      className="shrink-0 text-xs font-semibold underline"
      onClick={() => {
        goToSide(product.sides.indexOf(side));
        onClose();
      }}
    >
      Fix
    </button>
  );
}
