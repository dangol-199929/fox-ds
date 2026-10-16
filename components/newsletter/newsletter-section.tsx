import { NewsletterSignup } from "./newsletter-signup";

export function NewsletterSection() {
  return (
    <section aria-labelledby="newsletter-heading" className="border-t border-foreground/10 bg-lime/35">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-8 md:grid-cols-2 md:items-center lg:py-24">
        <div className="space-y-4">
          <h2 id="newsletter-heading" className="text-headline font-semibold">
            A little less clutter in your inbox.
          </h2>
          <p className="max-w-md text-lg text-muted-foreground">
            Get desk setup ideas, product updates, and occasional offers. No daily noise.
          </p>
        </div>
        <NewsletterSignup />
      </div>
    </section>
  );
}
