import { describe, expect, it } from "vitest";
import {
  EnvValidationError,
  parseShopifyEnv,
  parseSiteUrl,
  parseWebhookSecret,
} from "@/lib/env";

// Obviously fake values. No real credentials belong in tests.
const valid = {
  SHOPIFY_STORE_DOMAIN: "clean-desk-kit-test.myshopify.com",
  SHOPIFY_STOREFRONT_API_VERSION: "2026-10",
  SHOPIFY_STOREFRONT_PUBLIC_TOKEN: "test-public-token",
};

function issuesFor(fn: () => unknown): string[] {
  try {
    fn();
  } catch (error) {
    if (error instanceof EnvValidationError) return error.issues;
    throw error;
  }
  throw new Error("expected EnvValidationError");
}

describe("parseShopifyEnv", () => {
  it("accepts valid settings and builds the Storefront endpoint", () => {
    expect(parseShopifyEnv(valid)).toEqual({
      storeDomain: "clean-desk-kit-test.myshopify.com",
      apiVersion: "2026-10",
      storefrontToken: "test-public-token",
      storefrontEndpoint:
        "https://clean-desk-kit-test.myshopify.com/api/2026-10/graphql.json",
    });
  });

  it("trims whitespace and lowercases the domain", () => {
    const env = parseShopifyEnv({
      ...valid,
      SHOPIFY_STORE_DOMAIN: "  Clean-Desk-Kit-Test.MyShopify.com ",
    });
    expect(env.storeDomain).toBe("clean-desk-kit-test.myshopify.com");
  });

  it("reports every missing variable at once", () => {
    const issues = issuesFor(() => parseShopifyEnv({}));
    expect(issues).toHaveLength(3);
    expect(issues.join("\n")).toMatch(/SHOPIFY_STORE_DOMAIN is required/);
    expect(issues.join("\n")).toMatch(/SHOPIFY_STOREFRONT_API_VERSION is required/);
    expect(issues.join("\n")).toMatch(/SHOPIFY_STOREFRONT_PUBLIC_TOKEN is required/);
  });

  it("treats empty strings as missing", () => {
    const issues = issuesFor(() =>
      parseShopifyEnv({ ...valid, SHOPIFY_STOREFRONT_PUBLIC_TOKEN: "" }),
    );
    expect(issues).toEqual(["SHOPIFY_STOREFRONT_PUBLIC_TOKEN is required"]);
  });

  it.each([
    "https://clean-desk-kit-test.myshopify.com",
    "clean-desk-kit-test.myshopify.com/",
    "cleandeskkit.com.au",
    "evil.com/?x=.myshopify.com",
  ])("rejects a store domain that is not a bare *.myshopify.com host: %s", (domain) => {
    const issues = issuesFor(() =>
      parseShopifyEnv({ ...valid, SHOPIFY_STORE_DOMAIN: domain }),
    );
    expect(issues[0]).toMatch(/^SHOPIFY_STORE_DOMAIN must be/);
  });

  it.each(["2026-11", "unstable", "2026-1", "latest"])(
    "rejects an API version that is not a stable quarterly release: %s",
    (version) => {
      const issues = issuesFor(() =>
        parseShopifyEnv({ ...valid, SHOPIFY_STOREFRONT_API_VERSION: version }),
      );
      expect(issues[0]).toMatch(/^SHOPIFY_STOREFRONT_API_VERSION must be/);
    },
  );

  it("rejects a token containing whitespace", () => {
    const issues = issuesFor(() =>
      parseShopifyEnv({ ...valid, SHOPIFY_STOREFRONT_PUBLIC_TOKEN: "abc def" }),
    );
    expect(issues[0]).toMatch(/must not contain whitespace/);
  });

  it("never includes the secret value in error messages", () => {
    const secretish = "this-value-must-not-leak-into-logs";
    const error = (() => {
      try {
        parseShopifyEnv({
          ...valid,
          SHOPIFY_STORE_DOMAIN: secretish,
          SHOPIFY_STOREFRONT_PUBLIC_TOKEN: `${secretish} x`,
        });
      } catch (e) {
        return e as Error;
      }
    })();
    expect(error?.message).not.toContain(secretish);
  });
});

describe("parseWebhookSecret", () => {
  it("returns the trimmed secret", () => {
    expect(parseWebhookSecret({ SHOPIFY_WEBHOOK_SECRET: " test-secret " })).toBe(
      "test-secret",
    );
  });

  it("rejects a missing or blank secret", () => {
    expect(() => parseWebhookSecret({})).toThrow(EnvValidationError);
    expect(() => parseWebhookSecret({ SHOPIFY_WEBHOOK_SECRET: "   " })).toThrow(
      EnvValidationError,
    );
  });
});

describe("parseSiteUrl", () => {
  it("accepts https URLs", () => {
    expect(
      parseSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://example.com.au" }).origin,
    ).toBe("https://example.com.au");
  });

  it("allows http only for localhost", () => {
    expect(
      parseSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }).host,
    ).toBe("localhost:3000");
    expect(() =>
      parseSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://example.com.au" }),
    ).toThrow(/must use https/);
  });

  it("rejects missing and relative URLs", () => {
    expect(() => parseSiteUrl({})).toThrow(/is required/);
    expect(() => parseSiteUrl({ NEXT_PUBLIC_SITE_URL: "/shop" })).toThrow(
      /absolute URL/,
    );
  });
});
