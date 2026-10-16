// App-facing shapes. Shopify's raw GraphQL responses are reshaped into these
// in products.ts and cart.ts so components never deal with edges/nodes.

export type Money = {
  amount: string;
  currencyCode: string;
};

export type Image = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type SelectedOption = {
  name: string;
  value: string;
};

export type ProductOption = {
  name: string;
  values: string[];
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  /** Shopify sets this when inventory is tracked and stock is 0 but overselling is allowed. */
  currentlyNotInStock: boolean;
  selectedOptions: SelectedOption[];
  price: Money;
  compareAtPrice: Money | null;
  image: Image | null;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  productType: string;
  tags: string[];
  vendor: string;
  options: ProductOption[];
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  featuredImage: Image | null;
  images: Image[];
  variants: ProductVariant[];
  seo: { title: string | null; description: string | null };
  updatedAt: string;
};

export type CartLine = {
  id: string;
  quantity: number;
  cost: { totalAmount: Money; amountPerQuantity: Money };
  merchandise: {
    id: string;
    title: string;
    availableForSale: boolean;
    selectedOptions: SelectedOption[];
    image: Image | null;
    product: { handle: string; title: string };
  };
};

export type CartWarning = {
  code: string;
  message: string;
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
  };
  lines: CartLine[];
};

export type CartResult = {
  cart: Cart;
  /** Non-blocking notices from Shopify, e.g. a quantity reduced to available stock. */
  warnings: CartWarning[];
};
