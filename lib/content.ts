// Editorial copy shared across pages. Anything not yet confirmed by the
// business is marked TO_CONFIRM and shown as a visible placeholder rather
// than an invented promise.

import { shippingConfig } from "@/lib/site";

const shippingCost = shippingConfig
  ? `Shipping within Australia is a flat $${shippingConfig.flatRate.toFixed(2)}, or free on orders over $${shippingConfig.freeOver}. `
  : "Shipping costs are shown at checkout. ";

export const TO_CONFIRM = "To be confirmed";

export type FaqItem = { question: string; answer: string; confirmed: boolean };

export const faqs: FaqItem[] = [
  {
    question: "What comes in the kit?",
    answer:
      "20 black self-adhesive hook-and-loop cable straps. Each strap is about 90 mm long and 20 mm wide. These details come from our supplier, and we'll confirm them when our own sample arrives.",
    confirmed: true,
  },
  {
    question: "Is it compatible with my desk setup?",
    answer:
      "The straps stick to clean, dry, smooth surfaces, like the back or underside of most desks, and each one wraps a few cables at a time. Textured, dusty or delicate surfaces may not hold, and the adhesive may mark some finishes, so try one on a hidden spot first.",
    confirmed: true,
  },
  {
    question: "How do I install the straps?",
    answer:
      "Clean and dry the spot, peel off the backing, press the pad down firmly, then wrap the strap around your cables. Open and re-close the strap whenever you need to add or move a cable.",
    confirmed: true,
  },
  {
    question: "How much is shipping, and how long does it take?",
    answer:
      shippingCost +
      "Delivery times depend on our supplier and are being confirmed with test orders. See our shipping policy for the latest details before you order.",
    confirmed: false,
  },
  {
    question: "What is the return policy?",
    answer:
      "Our returns and refunds policy is being finalised. It will be published on the Returns & refunds page. Your rights under Australian Consumer Law always apply.",
    confirmed: false,
  },
];
