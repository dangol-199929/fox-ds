import Link from "next/link";
import { getShopPolicy, type PolicyKind } from "@/lib/shopify/shop";

/**
 * Renders a policy exactly as published in Shopify (Settings → Policies).
 * When it hasn't been written yet, says so plainly instead of inventing terms.
 */
export async function PolicyPage({ kind, fallbackTitle }: { kind: PolicyKind; fallbackTitle: string }) {
  let policy;
  let failed = false;
  try {
    policy = await getShopPolicy(kind);
  } catch {
    failed = true;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-8 lg:py-20">
      <h1 className="text-headline font-semibold">{policy?.title ?? fallbackTitle}</h1>
      {failed ? (
        <p role="alert" className="mt-8 text-lg text-muted-foreground">
          We couldn&apos;t load this policy right now. Please refresh the page or try again shortly.
        </p>
      ) : policy ? (
        <div
          className="policy-body mt-10 space-y-4 text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:ml-5 [&_ol]:list-decimal [&_strong]:text-foreground [&_ul]:list-disc"
          // Policy HTML is written by the store owner in Shopify admin.
          dangerouslySetInnerHTML={{ __html: policy.body }}
        />
      ) : (
        <div className="mt-8 space-y-4 rounded-lg border border-foreground/15 bg-secondary p-6">
          <p className="text-eyebrow font-medium uppercase text-muted-foreground">Being finalised</p>
          <p className="text-lg">
            This policy hasn&apos;t been published yet. Please{" "}
            <Link href="/contact" className="underline underline-offset-4">
              contact us
            </Link>{" "}
            before ordering if you have questions.
          </p>
          <p className="text-muted-foreground">Your rights under Australian Consumer Law always apply.</p>
        </div>
      )}
    </main>
  );
}
