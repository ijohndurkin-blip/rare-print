"use client";

import { useEffect, useRef, useState } from "react";
import { Textbox } from "fabric";
import { Sparkles, Wand2, ImagePlus, PenLine, ShieldCheck, Loader2, RefreshCw, Plus, ChevronDown, AlertTriangle } from "lucide-react";
import type { Layout } from "@/lib/layout";
import { useEditor, postJSON } from "../context";
import { renderLayoutThumb, exportPreview, makeText, fitText, isBlank } from "../engine";
import { DetailsForm } from "./DetailsForm";

type Tab = "magic" | "art" | "write" | "review";

const STYLES = ["Modern", "Classic", "Bold", "Elegant", "Playful", "Minimal", "Vintage", "Luxury", "Natural", "Techy"];
const COLOURS = ["Black & gold", "Navy & white", "Bright & colourful", "Soft pastels", "Earthy greens", "Red & black", "Ocean blues", "Pink & purple"];
const ART_STYLES = [
  { id: "photo", label: "Photo" },
  { id: "illustration", label: "Illustration" },
  { id: "watercolour", label: "Watercolour" },
  { id: "retro", label: "Retro" },
  { id: "minimal", label: "Minimal" },
  { id: "pattern", label: "Pattern" },
  { id: "logo", label: "Icon / mascot" },
];
const LOADING_LINES = ["Reading your brief…", "Picking fonts…", "Mixing colours…", "Balancing the layout…", "Adding finishing touches…"];

export function AIPanel({ initialBrief, autoRun }: { initialBrief?: string; autoRun?: { brief: string; nonce: number } | null }) {
  const { aiEnabled } = useEditor();
  const [tab, setTab] = useState<Tab>("magic");
  const tabs: { id: Tab; label: string; icon: typeof Wand2 }[] = [
    { id: "magic", label: "Designer", icon: Wand2 },
    { id: "art", label: "Artwork", icon: ImagePlus },
    { id: "write", label: "Writer", icon: PenLine },
    { id: "review", label: "Review", icon: ShieldCheck },
  ];
  // Jump back to the designer whenever a new auto-run request arrives.
  const [seenRun, setSeenRun] = useState(autoRun);
  if (autoRun !== seenRun) {
    setSeenRun(autoRun);
    if (autoRun) setTab("magic");
  }

  return (
    <div className="space-y-4">
      {!aiEnabled && (
        <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>The AI assistant isn&apos;t switched on yet. The print shop needs to add an OpenAI API key. Templates and all editing tools still work.</span>
        </div>
      )}
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold transition ${tab === t.id ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-ink"}`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>
      {/* Keep tabs mounted so results survive switching */}
      <div className={tab === "magic" ? "" : "hidden"}>
        <MagicDesigner initialBrief={initialBrief} autoRun={autoRun} />
      </div>
      <div className={tab === "art" ? "" : "hidden"}>
        <ArtworkGenerator />
      </div>
      <div className={tab === "write" ? "" : "hidden"}>
        <Copywriter />
      </div>
      <div className={tab === "review" ? "" : "hidden"}>
        <Reviewer />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ designer

function MagicDesigner({ initialBrief, autoRun }: { initialBrief?: string; autoRun?: { brief: string; nonce: number } | null }) {
  const { product, dims, side, details, setDetails, applyLayout, toast, aiEnabled, canvas } = useEditor();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [brief, setBrief] = useState(initialBrief ?? "");
  const [style, setStyle] = useState<string | null>(null);
  const [colours, setColours] = useState<string | null>(null);
  const [customColours, setCustomColours] = useState("");
  const [withArt, setWithArt] = useState(product.category === "promo" || ["posters", "leaflets", "wall-graphics", "window-graphics"].includes(product.id));
  const [loading, setLoading] = useState(false);
  const [line, setLine] = useState(0);
  const [results, setResults] = useState<{ layout: Layout; thumb: string }[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const lastNonce = useRef<number | null>(null);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setLine((l) => (l + 1) % LOADING_LINES.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

  const generate = async (briefText = brief) => {
    if (!briefText.trim() && !details.business) {
      toast("Tell the AI what you need first, e.g. your business name and what it does.", "error");
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      const { designs } = await postJSON<{ designs: Layout[] }>("/api/ai/design", {
        productId: product.id,
        widthMm: dims.widthMm,
        heightMm: dims.heightMm,
        side,
        brief: briefText,
        style: style ?? undefined,
        colors: [colours, customColours].filter(Boolean).join(", ") || undefined,
        details,
        includeImage: withArt,
      });
      const thumbs = await Promise.all(designs.map((layout) => renderLayoutThumb(dims, layout, 640)));
      setResults(designs.map((layout, i) => ({ layout, thumb: thumbs[i] })));
      // On an empty canvas, show the first idea straight away.
      if (designs[0] && canvas && isBlank(canvas)) {
        await applyLayout(designs[0]);
        toast("Here's your first design! Pick another idea or click any text to change it.", "success");
      }
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoRun && autoRun.nonce !== lastNonce.current) {
      lastNonce.current = autoRun.nonce;
      setBrief(autoRun.brief);
      generate(autoRun.brief);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  return (
    <div className="space-y-4">
      <div>
        <label className="label" htmlFor="ai-brief">Describe your {product.name.toLowerCase()}</label>
        <textarea
          id="ai-brief"
          className="input min-h-24 resize-y"
          placeholder={`e.g. ${product.category === "signage" ? "A sign for my barber shop called Fade Kings, sharp and masculine" : product.id === "mugs" ? "A mug for my dad who loves fishing, says World's Best Grandad" : "Business cards for Bloom & Co, a friendly florist in Liverpool"}`}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
        />
      </div>

      <button type="button" onClick={() => setShowDetails((s) => !s)} className="flex w-full items-center justify-between text-xs font-semibold text-slate-600">
        <span>Your details {details.business ? `· ${details.business}` : "(name, phone, website…)"}</span>
        <ChevronDown className={`h-4 w-4 transition ${showDetails ? "rotate-180" : ""}`} />
      </button>
      {showDetails && <DetailsForm details={details} onChange={setDetails} product={product} />}

      <div>
        <span className="label">Style</span>
        <div className="flex flex-wrap gap-1.5">
          {STYLES.map((s) => (
            <button key={s} onClick={() => setStyle(style === s ? null : s)} className={`chip ${style === s ? "chip-active" : ""}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="label">Colours</span>
        <div className="flex flex-wrap gap-1.5">
          {COLOURS.map((c) => (
            <button key={c} onClick={() => setColours(colours === c ? null : c)} className={`chip ${colours === c ? "chip-active" : ""}`}>
              {c}
            </button>
          ))}
        </div>
        <input className="input mt-2 py-2" placeholder="Or type your brand colours…" value={customColours} onChange={(e) => setCustomColours(e.target.value)} />
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
        <input type="checkbox" checked={withArt} onChange={(e) => setWithArt(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
        <span className="text-sm">
          <span className="font-semibold text-ink">Include AI artwork</span>
          <span className="block text-xs text-slate-500">Adds a picture or illustration painted by AI (takes a little longer).</span>
        </span>
      </label>

      <button className="btn-primary w-full py-3" disabled={loading || !aiEnabled} onClick={() => generate()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? LOADING_LINES[line] : results.length ? "Create 3 new designs" : "Create 3 designs"}
      </button>

      {loading && (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shimmer rounded-xl" style={{ aspectRatio: String(Math.max(dims.W / dims.H, 0.6)) }} />
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="scroll-mt-4 space-y-3" ref={resultsRef}>
          <p className="text-xs text-slate-500">Tap a design to use it. Everything stays editable, and Undo takes you back.</p>
          {results.map((r, i) => (
            <button
              key={i}
              onClick={async () => {
                await applyLayout(r.layout);
                toast(`Applied "${r.layout.name}". Click any text to change it.`, "success");
              }}
              className="group block w-full overflow-hidden rounded-xl border border-slate-200 text-left transition hover:border-brand hover:shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.thumb} alt={r.layout.name} className="checker w-full" />
              <div className="p-2.5">
                <p className="text-sm font-semibold text-ink group-hover:text-brand">{r.layout.name}</p>
                {r.layout.description && <p className="text-xs text-slate-500">{r.layout.description}</p>}
              </div>
            </button>
          ))}
          <button className="btn-secondary w-full" onClick={() => generate()} disabled={loading}>
            <RefreshCw className="h-4 w-4" /> More ideas
          </button>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ artwork

function ArtworkGenerator() {
  const { product, dims, addImage, addToLibrary, library, toast, aiEnabled, setAiBusy } = useEditor();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photo");
  const [mode, setMode] = useState<"background" | "picture" | "cutout">("picture");
  const [loading, setLoading] = useState(false);
  const aiImages = library.filter((l) => l.kind === "ai");

  const generate = async () => {
    if (!prompt.trim()) {
      toast("Describe the picture you want first.", "error");
      return;
    }
    setLoading(true);
    setAiBusy((n) => n + 1);
    try {
      const trimRatio = dims.widthMm / dims.heightMm;
      const { image } = await postJSON<{ image: string }>("/api/ai/image", {
        prompt,
        style,
        transparent: mode === "cutout",
        ratio: mode === "background" ? trimRatio : mode === "cutout" ? 1 : trimRatio > 1 ? 1.5 : trimRatio < 1 ? 0.75 : 1,
        productName: product.name,
      });
      addToLibrary({ src: image, label: prompt, kind: "ai", transparent: mode === "cutout" });
      await addImage(image, { asBackground: mode === "background", transparent: mode === "cutout" });
      toast("Artwork added to your design.", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
      setAiBusy((n) => n - 1);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label" htmlFor="ai-art">What should the AI paint?</label>
        <textarea
          id="ai-art"
          className="input min-h-20 resize-y"
          placeholder="e.g. Fresh coffee beans and a steaming latte on a wooden table"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>
      <div>
        <span className="label">Use it as</span>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              ["picture", "Picture"],
              ["background", "Background"],
              ["cutout", "Cut-out"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} onClick={() => setMode(id)} className={`chip justify-center ${mode === id ? "chip-active" : ""}`}>
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          {mode === "cutout" ? "No background, great for logos, icons and mascots." : mode === "background" ? "Fills your whole design, sized to fit." : "A picture you can move and resize."}
        </p>
      </div>
      <div>
        <span className="label">Style</span>
        <div className="flex flex-wrap gap-1.5">
          {ART_STYLES.map((s) => (
            <button key={s.id} onClick={() => setStyle(s.id)} className={`chip ${style === s.id ? "chip-active" : ""}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <button className="btn-primary w-full py-3" disabled={loading || !aiEnabled} onClick={generate}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {loading ? "Painting… (up to a minute)" : "Generate artwork"}
      </button>
      {loading && <div className="shimmer aspect-[4/3] rounded-xl" />}
      {aiImages.length > 0 && (
        <div>
          <span className="label">Your AI artwork</span>
          <div className="grid grid-cols-2 gap-2">
            {aiImages.map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-lg border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.label} className="checker aspect-square w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-black/70 p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <button className="flex-1 rounded-md bg-white/90 py-1 text-[11px] font-semibold" onClick={() => addImage(img.src, { transparent: img.transparent })}>
                    Add
                  </button>
                  <button className="flex-1 rounded-md bg-white/90 py-1 text-[11px] font-semibold" onClick={() => addImage(img.src, { asBackground: true })}>
                    Background
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ copywriter

const WRITE_MODES = [
  { id: "slogans", label: "Slogans" },
  { id: "headlines", label: "Headlines" },
  { id: "offers", label: "Offers" },
  { id: "rewrite", label: "Improve my text" },
  { id: "body", label: "Body copy" },
];

function Copywriter() {
  const { product, dims, details, selection, canvas, addObject, commit, toast, aiEnabled } = useEditor();
  const [mode, setMode] = useState("slogans");
  const [about, setAbout] = useState(details.tagline ?? "");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const selectedText = selection instanceof Textbox ? selection : null;

  const run = async () => {
    setLoading(true);
    try {
      const { suggestions } = await postJSON<{ suggestions: string[] }>("/api/ai/text", {
        mode,
        business: details.business,
        brief: about,
        text: mode === "rewrite" ? selectedText?.text : undefined,
        productName: product.name,
      });
      setSuggestions(suggestions);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  const use = async (text: string) => {
    if (selectedText && mode === "rewrite") {
      selectedText.set({ text });
      await fitText(selectedText, selectedText.width, Infinity);
      canvas?.requestRenderAll();
      commit();
      return;
    }
    const S = Math.min(dims.W, dims.H);
    const tb = await makeText(text, { width: dims.W * 0.8, fontSize: S * (mode === "body" ? 0.045 : 0.08), fontFamily: "Montserrat", fontWeight: mode === "body" ? "normal" : "bold" });
    addObject(tb);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {WRITE_MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`chip ${mode === m.id ? "chip-active" : ""}`}>
            {m.label}
          </button>
        ))}
      </div>
      {mode === "rewrite" ? (
        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          {selectedText ? (
            <>
              Improving: <span className="font-semibold text-ink">&ldquo;{selectedText.text.slice(0, 80)}&rdquo;</span>
            </>
          ) : (
            "Select some text on your design first, then come back here."
          )}
        </p>
      ) : (
        <div>
          <label className="label" htmlFor="ai-about">What does {details.business || "your business"} do?</label>
          <textarea id="ai-about" className="input min-h-16" placeholder="e.g. Family-run Italian pizzeria with wood-fired ovens" value={about} onChange={(e) => setAbout(e.target.value)} />
        </div>
      )}
      <button className="btn-primary w-full" disabled={loading || !aiEnabled || (mode === "rewrite" && !selectedText)} onClick={run}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />} Write it for me
      </button>
      {suggestions.length > 0 && (
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button onClick={() => use(s)} className="group flex w-full items-start gap-2 rounded-xl border border-slate-200 p-3 text-left text-sm hover:border-brand">
                <span className="flex-1 text-ink">{s}</span>
                <Plus className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-brand" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ reviewer

interface Review {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

export function Reviewer() {
  const { canvas, dims, product, toast, aiEnabled } = useEditor();
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<Review | null>(null);

  const run = async () => {
    if (!canvas) return;
    setLoading(true);
    try {
      const image = exportPreview(canvas, dims, 1024, "jpeg");
      const { review } = await postJSON<{ review: Review }>("/api/ai/review", {
        image,
        productId: product.id,
        widthMm: dims.widthMm,
        heightMm: dims.heightMm,
      });
      setReview(review);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  const colour = !review ? "" : review.score >= 8 ? "text-emerald-600" : review.score >= 5 ? "text-amber-600" : "text-red-600";
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Get honest feedback from our AI designer before you order: readability, colours, spelling and layout.</p>
      <button className="btn-primary w-full" onClick={run} disabled={loading || !aiEnabled}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Review my design
      </button>
      {review && (
        <div className="space-y-3 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <span className={`font-display text-4xl font-extrabold ${colour}`}>{review.score}</span>
            <span className="text-xs text-slate-500">/ 10 print-ready score</span>
          </div>
          <p className="text-sm text-ink">{review.summary}</p>
          {review.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-700">What works</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-600">
                {review.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {review.improvements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-700">Suggestions</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-600">
                {review.improvements.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
