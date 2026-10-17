import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/components/cart/cart-context";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentCart } from "@/lib/shopify/current-cart";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Clean Desk Kit · Desk accessories & cable management",
    template: "%s · Clean Desk Kit",
  },
  description:
    "Cable management, laptop stands, desk mats and lighting for a tidier, calmer desk. Australian store, prices in AUD.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Clean Desk Kit",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#f7f6f2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Not awaited: the cart reads a cookie, so it streams in behind Suspense
  // boundaries in the header and drawer while the rest of the page is static.
  const cartPromise = getCurrentCart().catch(() => null);

  return (
    <html lang="en-AU" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-lime px-4 py-2 font-medium text-lime-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <CartProvider cartPromise={cartPromise}>
          <AnnouncementBar />
          <SiteHeader />
          <div id="main" className="flex flex-1 flex-col">
            {children}
          </div>
          <SiteFooter />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
