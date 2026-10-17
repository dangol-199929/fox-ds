import { Suspense } from "react";
import { CategoryTiles } from "@/components/home/category-tiles";
import { FAQAccordion } from "@/components/home/faq-accordion";
import { FeaturedProduct, FeaturedProductSkeleton } from "@/components/home/featured-product";
import { HeroSection } from "@/components/home/hero-section";
import { NewArrivals } from "@/components/home/new-arrivals";
import { TrustBar } from "@/components/home/trust-bar";
import { NewsletterSection } from "@/components/newsletter/newsletter-section";
import { ProductGridSkeleton } from "@/components/shop/product-grid";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <TrustBar />
      <Suspense fallback={null}>
        <CategoryTiles />
      </Suspense>
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8">
            <ProductGridSkeleton count={4} className="lg:grid-cols-4" />
          </div>
        }
      >
        <NewArrivals />
      </Suspense>
      <Suspense fallback={<FeaturedProductSkeleton />}>
        <FeaturedProduct />
      </Suspense>
      <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-32 border-t border-foreground/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1fr_1.6fr] lg:py-20">
          <h2 id="faq-heading" className="text-title font-semibold">
            Questions, answered.
          </h2>
          <FAQAccordion headingId="faq-heading" />
        </div>
      </section>
      <NewsletterSection />
    </main>
  );
}
