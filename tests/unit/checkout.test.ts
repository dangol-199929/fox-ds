import { describe, expect, it } from "vitest";
import { checkoutHostsFrom, validateCheckoutUrl } from "@/lib/shopify/checkout";

const hosts = ["clean-desk-kit-test.myshopify.com"];

describe("validateCheckoutUrl", () => {
  it("accepts Shopify's https cart URL on the store domain", () => {
    const url = "https://clean-desk-kit-test.myshopify.com/cart/c/abc123?key=xyz";
    expect(validateCheckoutUrl(url, hosts)).toBe(url);
  });

  it("is case-insensitive about the host", () => {
    expect(() =>
      validateCheckoutUrl("https://Clean-Desk-Kit-Test.MyShopify.com/cart/c/abc", hosts),
    ).not.toThrow();
  });

  it.each([
    ["plain http", "http://clean-desk-kit-test.myshopify.com/cart/c/abc"],
    ["another shop", "https://someone-else.myshopify.com/cart/c/abc"],
    ["look-alike suffix", "https://clean-desk-kit-test.myshopify.com.evil.example/cart/c/abc"],
    ["embedded credentials", "https://user:pass@clean-desk-kit-test.myshopify.com/cart/c/abc"],
    ["custom port", "https://clean-desk-kit-test.myshopify.com:8443/cart/c/abc"],
    ["javascript URL", "javascript:alert(1)"],
    ["relative path", "/cart/c/abc"],
    ["empty string", ""],
  ])("rejects %s", (_label, url) => {
    expect(() => validateCheckoutUrl(url, hosts)).toThrow(
      expect.objectContaining({ kind: "invalid_checkout_url" }),
    );
  });

  it("allows a configured custom checkout domain", () => {
    const allowed = checkoutHostsFrom("clean-desk-kit-test.myshopify.com", " Shop.Example.com.au , ");
    expect(allowed).toEqual(["clean-desk-kit-test.myshopify.com", "shop.example.com.au"]);
    expect(validateCheckoutUrl("https://shop.example.com.au/cart/c/abc", allowed)).toBe(
      "https://shop.example.com.au/cart/c/abc",
    );
  });

  it("ignores malformed extra domains", () => {
    expect(checkoutHostsFrom("a.myshopify.com", "https://x.com/,ok.com.au")).toEqual([
      "a.myshopify.com",
      "ok.com.au",
    ]);
  });
});
