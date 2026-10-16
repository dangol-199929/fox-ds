import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FAQAccordion } from "@/components/home/faq-accordion";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { ProductJsonLd } from "@/components/product/product-json-ld";
import { RecommendedProducts } from "@/components/product/recommended-products";
import { TO_CONFIRM } from "@/lib/content";
import { getProduct, getProducts } from "@/lib/shopify/products";

export async function generateStaticParams() {
  try {
    const products = await getProducts({ first: 50 });
    return products.map((p) => ({ handle: p.handle }));
  } catch {
    // If Shopify is unreachable at build time, pages render on first request.
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle).catch(() => null);
  if (!product) return { title: "Product not found" };
  const description = product.seo.description || product.description.slice(0, 160) || undefined;
  const image = product.featuredImage;
  return {
    title: product.seo.title && product.seo.title !== product.title ? product.seo.title : product.title,
    description,
    alternates: { canonical: `/products/${product.handle}` },
    openGraph: {
      title: product.title,
      description,
      url: `/products/${product.handle}`,
      ...(image && {
        images: [{ url: image.url, width: image.width ?? undefined, height: image.height ?? undefined, alt: image.altText ?? product.title }],
      }),
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();

  return (
    <main className="pb-28 md:pb-0">
      <ProductJsonLd product={product} />
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-6 sm:px-8">
        <ol className="flex gap-2 text-sm text-muted-foreground">
          <li>
            <Link href="/shop" className="hover:underline">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate text-foreground">
            {product.title}
          </li>
        </ol>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-8 md:grid-cols-[1.15fr_1fr] md:gap-12 lg:gap-20 lg:py-10">
        <ProductGallery images={product.images} title={product.title} />
        <div className="md:sticky md:top-24 md:self-start">
          <PurchasePanel product={product} headingLevel="h1" />
          {product.description && (
            <div
              className="mt-8 max-w-prose space-y-4 border-t border-foreground/15 pt-8 text-muted-foreground [&_a]:underline [&_strong]:text-foreground"
              // Product description HTML is written by the store owner in Shopify admin.
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          )}
        </div>
      </div>

      <section aria-labelledby="details-heading" className="border-t border-foreground/10 bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 lg:py-20">
          <h2 id="details-heading" className="text-title font-semibold">
            The details
          </h2>
          <dl className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            <Detail term="What's included" placeholder>
              The full list of items in the kit will appear here once samples are confirmed.
            </Detail>
            <Detail term="Specifications & compatibility" placeholder>
              Sizes, materials and desk compatibility are being confirmed with our supplier.
            </Detail>
            <Detail term="Shipping">
              Costs and delivery times are shown at checkout. Read our{" "}
              <Link href="/shipping" className="underline underline-offset-4">
                shipping policy
              </Link>
              .
            </Detail>
            <Detail term="Returns">
              See our{" "}
              <Link href="/refunds" className="underline underline-offset-4">
                returns and refunds policy
              </Link>
              . Your rights under Australian Consumer Law always apply.
            </Detail>
          </dl>
        </div>
      </section>

      <Suspense fallback={null}>
        <RecommendedProducts handle={product.handle} />
      </Suspense>

      <section aria-labelledby="product-faq-heading" className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-8 lg:py-20">
        <h2 id="product-faq-heading" className="mb-6 text-title font-semibold">
          Questions
        </h2>
        <FAQAccordion headingId="product-faq-heading" />
      </section>
    </main>
  );
}

function Detail({
  term,
  placeholder = false,
  children,
}: {
  term: string;
  placeholder?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <dt className="flex flex-wrap items-center gap-2 font-medium">
        {term}
        {placeholder && (
          <span className="rounded-full border border-foreground/20 px-2 py-0.5 text-eyebrow font-medium uppercase text-muted-foreground">
            {TO_CONFIRM}
          </span>
        )}
      </dt>
      <dd className="text-muted-foreground">{children}</dd>
    </div>
  );
}
