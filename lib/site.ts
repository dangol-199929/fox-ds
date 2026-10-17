// Store-wide settings that aren't product data. Product data, prices, stock
// and policies always come from Shopify instead.

export const siteConfig = {
  name: "Clean Desk Kit",
  /** Handle of the hero product in Shopify. */
  featuredProductHandle: "clean-desk-kit",
  /**
   * Shopify collection used as one fallback for recommendations. "frontpage"
   * is Shopify's built-in Home page collection.
   */
  featuredCollectionHandle: "frontpage",
  /** Optional: set NEXT_PUBLIC_CONTACT_EMAIL once the business inbox exists. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  /** Add real profile URLs when the accounts exist; empty entries are hidden. */
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || null,
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || null,
  },
} as const;

/**
 * Mirrors the Australian rate in Shopify admin (Settings → Shipping and
 * delivery → General profile). Shopify checkout charges the real rate; this
 * copy is only for the announcement bar and the cart's free-shipping meter.
 * Change both together. Set to null to hide shipping messaging entirely.
 */
export const shippingConfig: { flatRate: number; freeOver: number } | null = {
  flatRate: 7.25,
  freeOver: 60,
};

/**
 * Shop categories. Each maps to a Shopify product type, so a product joins a
 * category when its "Type" is set in Shopify admin. Categories with no
 * products are hidden automatically wherever products are counted.
 */
export const categories = [
  { slug: "cable-management", label: "Cable management", productType: "Cable management" },
  { slug: "stands-risers", label: "Stands & risers", productType: "Stands & risers" },
  { slug: "desk-mats", label: "Desk mats", productType: "Desk mats" },
  { slug: "lighting", label: "Lighting", productType: "Lighting" },
  { slug: "desk-accessories", label: "Desk accessories", productType: "Desk accessories" },
] as const;

export type Category = (typeof categories)[number];

export function categoryBySlug(slug: string | null | undefined): Category | null {
  return categories.find((c) => c.slug === slug) ?? null;
}

export function categoryByProductType(productType: string): Category | null {
  return categories.find((c) => c.productType === productType) ?? null;
}

export const categoryHref = (category: Category) => `/shop?category=${category.slug}`;

export const mainNav = [
  { label: "Shop all", href: "/shop" },
  ...categories.map((c) => ({ label: c.label, href: categoryHref(c) })),
] as const;

export const policyNav = [
  { label: "Shipping", href: "/shipping" },
  { label: "Returns & refunds", href: "/refunds" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "/contact" },
] as const;
