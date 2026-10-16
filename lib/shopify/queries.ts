// Storefront API GraphQL documents (API version from SHOPIFY_STOREFRONT_API_VERSION).
// Every operation uses @inContext(country: AU) so prices come back in the
// Australian market's currency (AUD) as configured in Shopify Markets.

export const STORE_COUNTRY = "AU";

const IMAGE_FIELDS = /* GraphQL */ `
  fragment ImageFields on Image {
    url
    altText
    width
    height
  }
`;

const VARIANT_FIELDS = /* GraphQL */ `
  fragment VariantFields on ProductVariant {
    id
    title
    availableForSale
    currentlyNotInStock
    selectedOptions {
      name
      value
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    image {
      ...ImageFields
    }
  }
`;

const PRODUCT_FIELDS = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    availableForSale
    productType
    tags
    vendor
    updatedAt
    options {
      name
      optionValues {
        name
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      ...ImageFields
    }
    images(first: 20) {
      nodes {
        ...ImageFields
      }
    }
    variants(first: 100) {
      nodes {
        ...VariantFields
      }
    }
    seo {
      title
      description
    }
  }
  ${IMAGE_FIELDS}
  ${VARIANT_FIELDS}
`;

export const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query ProductByHandle($handle: String!, $country: CountryCode!)
  @inContext(country: $country) {
    product(handle: $handle) {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS}
`;

export const PRODUCTS_QUERY = /* GraphQL */ `
  query Products(
    $first: Int!
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $query: String
    $country: CountryCode!
  ) @inContext(country: $country) {
    products(first: $first, sortKey: $sortKey, reverse: $reverse, query: $query) {
      nodes {
        ...ProductFields
      }
    }
  }
  ${PRODUCT_FIELDS}
`;

export const COLLECTION_PRODUCTS_QUERY = /* GraphQL */ `
  query CollectionProducts($handle: String!, $first: Int!, $country: CountryCode!)
  @inContext(country: $country) {
    collection(handle: $handle) {
      handle
      title
      description
      products(first: $first) {
        nodes {
          ...ProductFields
        }
      }
    }
  }
  ${PRODUCT_FIELDS}
`;

const CART_FIELDS = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
          amountPerQuantity {
            amount
            currencyCode
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            selectedOptions {
              name
              value
            }
            image {
              ...ImageFields
            }
            product {
              handle
              title
            }
          }
        }
      }
    }
  }
  ${IMAGE_FIELDS}
`;

const CART_PAYLOAD = /* GraphQL */ `
  cart {
    ...CartFields
  }
  userErrors {
    code
    field
    message
  }
  warnings {
    code
    message
  }
`;

export const CART_QUERY = /* GraphQL */ `
  query Cart($cartId: ID!, $country: CountryCode!) @inContext(country: $country) {
    cart(id: $cartId) {
      ...CartFields
    }
  }
  ${CART_FIELDS}
`;

export const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation CartCreate($input: CartInput!, $country: CountryCode!)
  @inContext(country: $country) {
    cartCreate(input: $input) {
      ${CART_PAYLOAD}
    }
  }
  ${CART_FIELDS}
`;

export const CART_LINES_ADD_MUTATION = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!, $country: CountryCode!)
  @inContext(country: $country) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      ${CART_PAYLOAD}
    }
  }
  ${CART_FIELDS}
`;

export const CART_LINES_UPDATE_MUTATION = /* GraphQL */ `
  mutation CartLinesUpdate(
    $cartId: ID!
    $lines: [CartLineUpdateInput!]!
    $country: CountryCode!
  ) @inContext(country: $country) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      ${CART_PAYLOAD}
    }
  }
  ${CART_FIELDS}
`;

export const CART_LINES_REMOVE_MUTATION = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!, $country: CountryCode!)
  @inContext(country: $country) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      ${CART_PAYLOAD}
    }
  }
  ${CART_FIELDS}
`;

export const SHOP_POLICIES_QUERY = /* GraphQL */ `
  query ShopPolicies {
    shop {
      name
      privacyPolicy {
        title
        body
        handle
      }
      refundPolicy {
        title
        body
        handle
      }
      shippingPolicy {
        title
        body
        handle
      }
      termsOfService {
        title
        body
        handle
      }
    }
  }
`;

export const SEARCH_PRODUCTS_QUERY = /* GraphQL */ `
  query SearchProducts(
    $query: String!
    $first: Int!
    $sortKey: SearchSortKeys
    $reverse: Boolean
    $productFilters: [ProductFilter!]
    $country: CountryCode!
  ) @inContext(country: $country) {
    search(
      query: $query
      first: $first
      types: PRODUCT
      sortKey: $sortKey
      reverse: $reverse
      productFilters: $productFilters
      unavailableProducts: LAST
    ) {
      totalCount
      productFilters {
        id
        label
        type
        values {
          id
          label
          count
          input
        }
      }
      nodes {
        ... on Product {
          ...ProductFields
        }
      }
    }
  }
  ${PRODUCT_FIELDS}
`;

export const PRODUCT_RECOMMENDATIONS_QUERY = /* GraphQL */ `
  query ProductRecommendations(
    $handle: String!
    $intent: ProductRecommendationIntent!
    $country: CountryCode!
  ) @inContext(country: $country) {
    productRecommendations(productHandle: $handle, intent: $intent) {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS}
`;
