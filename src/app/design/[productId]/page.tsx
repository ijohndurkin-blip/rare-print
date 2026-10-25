import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/products";
import { StudioLoader } from "@/components/editor/StudioLoader";

export function generateStaticParams() {
  return products.map((p) => ({ productId: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/design/[productId]">): Promise<Metadata> {
  const { productId } = await params;
  const product = getProduct(productId);
  return { title: product ? `Design your ${product.name}` : "Design" };
}

export default async function DesignPage({ params }: PageProps<"/design/[productId]">) {
  const { productId } = await params;
  const product = getProduct(productId);
  if (!product) notFound();
  return <StudioLoader productId={product.id} />;
}
