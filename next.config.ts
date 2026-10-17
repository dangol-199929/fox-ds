import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Product images are served and resized by Shopify's CDN (see the loader).
    loader: "custom",
    loaderFile: "./lib/shopify-image-loader.ts",
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com", pathname: "/**" }],
  },
  turbopack: {
    // Pin the root so a stray lockfile in a parent folder is never picked up.
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
