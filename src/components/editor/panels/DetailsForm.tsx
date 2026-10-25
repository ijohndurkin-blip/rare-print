"use client";

import type { Product } from "@/lib/products";
import type { BusinessDetails } from "@/lib/templates";

const FIELDS: { key: keyof BusinessDetails; label: string; placeholder: string; cards?: boolean }[] = [
  { key: "business", label: "Business name", placeholder: "Fade Kings Barbers" },
  { key: "tagline", label: "What you do / tagline", placeholder: "Traditional cuts & hot towel shaves" },
  { key: "phone", label: "Phone", placeholder: "0151 123 4567" },
  { key: "website", label: "Website", placeholder: "www.fadekings.co.uk" },
  { key: "email", label: "Email", placeholder: "hello@fadekings.co.uk" },
  { key: "name", label: "Your name", placeholder: "Darren Smith", cards: true },
  { key: "role", label: "Job title", placeholder: "Owner", cards: true },
  { key: "headline", label: "Headline / offer", placeholder: "Grand Opening Saturday!" },
];

/** Business details typed once and reused by templates and the AI. */
export function DetailsForm({
  details,
  onChange,
  product,
}: {
  details: Partial<BusinessDetails>;
  onChange: (d: Partial<BusinessDetails>) => void;
  product: Product;
}) {
  const fields = FIELDS.filter((f) => !f.cards || product.id === "business-cards");
  return (
    <div className="grid gap-2.5">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="mb-1 block text-[11px] font-semibold text-slate-500" htmlFor={`d-${f.key}`}>
            {f.label}
          </label>
          <input
            id={`d-${f.key}`}
            className="input py-2"
            placeholder={f.placeholder}
            value={details[f.key] ?? ""}
            onChange={(e) => onChange({ ...details, [f.key]: e.target.value })}
          />
        </div>
      ))}
      <p className="text-[11px] text-slate-400">Saved on this device and used to fill templates and AI designs.</p>
    </div>
  );
}
