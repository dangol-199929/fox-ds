import "server-only";
import { EnvValidationError, getShopifyEnv } from "@/lib/env";
import {
  graphqlError,
  httpError,
  networkError,
  ShopifyError,
  timeoutError,
} from "./errors";

const DEFAULT_TIMEOUT_MS = 10_000;

type ShopifyFetchOptions = {
  query: string;
  variables?: Record<string, unknown>;
  /**
   * Queries are safe to retry once after a network failure, 429 or 5xx.
   * Mutations are never retried, so a cart change is not applied twice.
   */
  retry?: boolean;
  timeoutMs?: number;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

function configError(error: unknown): ShopifyError {
  const detail =
    error instanceof EnvValidationError ? error.issues.join("; ") : "unknown";
  return new ShopifyError(
    `Shopify is not configured: ${detail}`,
    "config",
    "The store isn't available right now. Please try again later.",
    { cause: error },
  );
}

function isRetryableStatus(status: number) {
  return status === 429 || status >= 500;
}

async function request<T>(
  endpoint: string,
  token: string,
  body: string,
  timeoutMs: number,
): Promise<{ status: number; json?: GraphQLResponse<T> }> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw timeoutError(timeoutMs);
    }
    throw networkError(error);
  }

  if (!response.ok) return { status: response.status };

  try {
    return { status: response.status, json: (await response.json()) as GraphQLResponse<T> };
  } catch (error) {
    throw networkError(error);
  }
}

/**
 * Sends a GraphQL operation to the Shopify Storefront API.
 *
 * Server only: the token is read from server environment variables and never
 * reaches the browser. Caching is handled by callers with `"use cache"`, so
 * the underlying fetch is always uncached.
 */
export async function shopifyFetch<T>({
  query,
  variables,
  retry = false,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: ShopifyFetchOptions): Promise<T> {
  let env;
  try {
    env = getShopifyEnv();
  } catch (error) {
    throw configError(error);
  }

  const body = JSON.stringify({ query, variables });
  const attempts = retry ? 2 : 1;

  let lastError: ShopifyError | undefined;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const { status, json } = await request<T>(
        env.storefrontEndpoint,
        env.storefrontToken,
        body,
        timeoutMs,
      );

      if (!json) {
        lastError = httpError(status);
        if (isRetryableStatus(status)) continue;
        throw lastError;
      }

      if (json.errors?.length) {
        throw graphqlError(json.errors.map((e) => e.message));
      }
      if (!json.data) {
        throw graphqlError(["response contained no data"]);
      }
      return json.data;
    } catch (error) {
      if (
        error instanceof ShopifyError &&
        (error.kind === "network" || error.kind === "timeout")
      ) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? networkError(undefined);
}
