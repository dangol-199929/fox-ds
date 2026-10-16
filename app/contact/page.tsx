import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Clean Desk Kit about orders, shipping or returns.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const email = siteConfig.contactEmail;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-8 lg:py-20">
      <h1 className="text-headline font-semibold">Contact us</h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        Questions about an order, shipping or returns? We&apos;re a small Australian store and read
        every message.
      </p>
      {email ? (
        <p className="mt-10">
          <a
            href={`mailto:${email}`}
            className="text-title font-semibold underline decoration-lime decoration-4 underline-offset-8"
          >
            {email}
          </a>
        </p>
      ) : (
        <div className="mt-10 rounded-lg border border-foreground/15 bg-secondary p-6">
          <p className="text-eyebrow font-medium uppercase text-muted-foreground">Being set up</p>
          <p className="mt-2 text-lg">Our support email is being set up and will appear here shortly.</p>
        </div>
      )}
      <p className="mt-10 text-sm text-muted-foreground">
        If you&apos;ve placed an order, include your order number so we can help faster.
      </p>
    </main>
  );
}
