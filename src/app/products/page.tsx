import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductGrid } from "@/components/site/ProductGrid";
import { categories, productsByCategory } from "@/lib/products";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const { brief } = await searchParams;
  const briefText = typeof brief === "string" ? brief : undefined;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Choose a product to design</h1>
        {briefText ? (
          <p className="mt-2 text-slate-600">
            Which product is <span className="font-medium text-ink">&ldquo;{briefText}&rdquo;</span> for? Pick one and the AI
            will get started.
          </p>
        ) : (
          <p className="mt-2 text-slate-600">Every product opens at its exact print size, with AI ready to help.</p>
        )}
        {categories.map((c) => (
          <section key={c.id} className="mt-10">
            <h2 className="text-xl font-semibold text-ink">{c.name}</h2>
            <p className="mb-4 text-sm text-slate-500">{c.blurb}</p>
            <ProductGrid items={productsByCategory(c.id)} brief={briefText} />
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
