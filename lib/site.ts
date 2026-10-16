// Store-wide settings that aren't product data. Product data, prices, stock
// and policies always come from Shopify instead.

export const siteConfig = {
  name: "Clean Desk Kit",
  /** Handle of the hero product in Shopify. */
  featuredProductHandle: "clean-desk-kit",
  /** Optional: set NEXT_PUBLIC_CONTACT_EMAIL once the business inbox exists. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  /** Add real profile URLs when the accounts exist; empty entries are hidden. */
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || null,
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || null,
  },
} as const;

export const mainNav = [
  { label: "Shop", href: "/shop" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
] as const;

export const policyNav = [
  { label: "Shipping", href: "/shipping" },
  { label: "Returns & refunds", href: "/refunds" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "/contact" },
] as const;
