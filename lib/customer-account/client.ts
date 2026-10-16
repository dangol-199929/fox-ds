import "server-only";
import { getDiscovery } from "./config";

export class CustomerAuthError extends Error {
  constructor() {
    super("Customer session is no longer valid");
    this.name = "CustomerAuthError";
  }
}

/**
 * Calls the Customer Account API with the signed-in customer's token. The API
 * only ever returns that customer's own data. Responses are never cached.
 */
export async function customerFetch<T>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { graphqlEndpoint } = await getDiscovery();
  const res = await fetch(graphqlEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: accessToken },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 401 || res.status === 403) throw new CustomerAuthError();
  if (!res.ok) throw new Error(`Customer Account API responded with HTTP ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(`Customer Account API error: ${json.errors.map((e) => e.message).join("; ")}`);
  if (!json.data) throw new Error("Customer Account API returned no data");
  return json.data;
}

export const CUSTOMER_OVERVIEW_QUERY = /* GraphQL */ `
  query CustomerOverview {
    customer {
      firstName
      lastName
      displayName
      emailAddress {
        emailAddress
      }
      orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          name
          processedAt
          financialStatus
          fulfillmentStatus
          cancelledAt
          totalPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

export const CUSTOMER_ORDER_QUERY = /* GraphQL */ `
  query CustomerOrder($id: ID!) {
    order(id: $id) {
      id
      name
      processedAt
      financialStatus
      fulfillmentStatus
      cancelledAt
      statusPageUrl
      subtotal {
        amount
        currencyCode
      }
      totalShipping {
        amount
        currencyCode
      }
      totalTax {
        amount
        currencyCode
      }
      totalPrice {
        amount
        currencyCode
      }
      lineItems(first: 50) {
        nodes {
          id
          title
          variantTitle
          quantity
          totalPrice {
            amount
            currencyCode
          }
        }
      }
      fulfillments(first: 10) {
        nodes {
          trackingInformation {
            company
            number
            url
          }
        }
      }
    }
  }
`;

export const CUSTOMER_UPDATE_MUTATION = /* GraphQL */ `
  mutation CustomerUpdate($input: CustomerUpdateInput!) {
    customerUpdate(input: $input) {
      customer {
        firstName
        lastName
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type Money = { amount: string; currencyCode: string };

export type OrderSummary = {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string;
  cancelledAt: string | null;
  totalPrice: Money;
};

export type CustomerOverview = {
  customer: {
    firstName: string | null;
    lastName: string | null;
    displayName: string;
    emailAddress: { emailAddress: string | null } | null;
    orders: { nodes: OrderSummary[] };
  };
};

export type CustomerOrder = {
  order:
    | (OrderSummary & {
        statusPageUrl: string;
        subtotal: Money | null;
        totalShipping: Money;
        totalTax: Money | null;
        lineItems: {
          nodes: { id: string; title: string; variantTitle: string | null; quantity: number; totalPrice: Money | null }[];
        };
        fulfillments: {
          nodes: { trackingInformation: { company: string | null; number: string | null; url: string | null }[] }[];
        };
      })
    | null;
};
