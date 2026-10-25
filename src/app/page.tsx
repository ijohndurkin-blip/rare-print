import Link from "next/link";
import { Wand2, ImagePlus, PenLine, ShieldCheck, Upload, Eye, Truck, MousePointerClick, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { HeroPrompt } from "@/components/home/HeroPrompt";
import { HeroShop } from "@/components/home/HeroShop";
import { ProductGrid } from "@/components/site/ProductGrid";
import { products } from "@/lib/products";
import { tenant } from "@/lib/tenant";

const steps = [
  { icon: MousePointerClick, title: "Pick your product", text: "Shop sign, business cards, mugs… you'll see the exact size in front of you." },
  { icon: Wand2, title: "Let AI design it", text: "Describe your business and get three ready-made designs in seconds. Or upload your own artwork." },
  { icon: Eye, title: "Preview it for real", text: "See your sign on a shop front, your design on a mug, before you spend a penny." },
  { icon: Truck, title: "We print it", text: `The ${tenant.name} team checks your artwork, sends a proof and prints, delivers or installs.` },
];

const aiFeatures = [
  { icon: Wand2, title: "Magic Designer", text: "Tell it your business name and style. It lays out the whole design: fonts, colours and all. Everything stays editable." },
  { icon: ImagePlus, title: "AI Artwork", text: "Generate photos, illustrations, patterns or logo-style icons sized perfectly for your product." },
  { icon: PenLine, title: "AI Copywriter", text: "Stuck for words? Get slogans, headlines and offers written for your business in one click." },
  { icon: ShieldCheck, title: "AI Print Check", text: "Before you order, AI reviews your design for readability, contrast and anything too close to the edge." },
];

export default function Home() {
  const popular = products.filter((p) => p.popular);
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-brand/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full bg-accent/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-20">
            <div className="space-y-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                <Wand2 className="h-3.5 w-3.5" /> New: AI-powered design studio
              </span>
              <h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Design your sign in minutes.
                <span className="block text-brand">We&apos;ll print it.</span>
              </h1>
              <p className="max-w-xl text-lg text-slate-600">
                Shop signs, business cards, leaflets, banners and mugs. Describe what you want and our AI creates it,
                ready to edit, preview and order from {tenant.name} in {tenant.city}. No design skills needed.
              </p>
              <HeroPrompt />
            </div>
            <HeroShop />
          </div>
        </section>

        {/* Popular */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">What would you like to create?</h2>
              <p className="mt-1 text-slate-600">Pick a product and start with a blank canvas at the exact print size.</p>
            </div>
            <Link href="/products" className="btn-ghost hidden sm:inline-flex">
              All products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ProductGrid items={popular} />
          <div className="mt-6 text-center sm:hidden">
            <Link href="/products" className="btn-secondary">See all {products.length} products</Link>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">How it works</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">From idea to printed product without the back-and-forth.</p>
            <ol className="mt-10 grid gap-6 md:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className="relative rounded-2xl border border-slate-200 bg-white p-6">
                  <span className="absolute top-5 right-5 font-display text-4xl font-extrabold text-slate-100">{i + 1}</span>
                  <s.icon className="h-7 w-7 text-brand" />
                  <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* AI tools */}
        <section id="ai" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Your own AI designer, built in</h2>
              <p className="mt-3 text-slate-600">
                Not a designer? No problem. The studio has AI tools that do the hard parts for you, while you stay in
                control of every word, colour and picture.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/design/shop-sign" className="btn-primary">Try it on a shop sign</Link>
                <Link href="/design/business-cards" className="btn-secondary">Design business cards</Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {aiFeatures.map((f) => (
                <div key={f.title} className="rounded-2xl border border-slate-200 p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10">
                    <f.icon className="h-5 w-5 text-brand" />
                  </div>
                  <h3 className="mt-3 font-semibold text-ink">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upload CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink p-8 text-white sm:p-12 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Already have artwork?</h2>
              <p className="mt-2 max-w-xl text-slate-300">
                Upload your logo or finished design, drop it onto the right size and order in minutes. Prefer to talk it
                through? Call us on {tenant.phone}.
              </p>
            </div>
            <Link href="/products" className="btn bg-white text-ink hover:bg-slate-100">
              <Upload className="h-4 w-4" /> Upload &amp; order
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
