import { Suspense } from "react";
import { BenefitsSection } from "@/components/home/benefits-section";
import { BeforeAfterSection } from "@/components/home/before-after-section";
import { FAQAccordion } from "@/components/home/faq-accordion";
import { FeaturedProduct, FeaturedProductSkeleton } from "@/components/home/featured-product";
import { HeroSection } from "@/components/home/hero-section";
import { HowItWorks } from "@/components/home/how-it-works";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <BeforeAfterSection />
      <Suspense fallback={<FeaturedProductSkeleton />}>
        <FeaturedProduct />
      </Suspense>
      <HowItWorks />
      <BenefitsSection />
      <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-20 border-t border-foreground/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-8 md:grid-cols-[1fr_1.6fr] lg:py-24">
          <h2 id="faq-heading" className="text-headline font-semibold">
            Questions, answered.
          </h2>
          <FAQAccordion headingId="faq-heading" />
        </div>
      </section>
    </main>
  );
}
