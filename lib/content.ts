// Editorial copy shared across pages. Anything not yet confirmed by the
// business is marked TO_CONFIRM and shown as a visible placeholder rather
// than an invented promise.

export const TO_CONFIRM = "To be confirmed";

export type FaqItem = { question: string; answer: string; confirmed: boolean };

export const faqs: FaqItem[] = [
  {
    question: "What comes in the kit?",
    answer:
      "The final kit contents are being confirmed with our supplier. The product page will list every item once samples have been checked.",
    confirmed: false,
  },
  {
    question: "Is it compatible with my desk setup?",
    answer:
      "Compatibility details (desk thickness, cable sizes and mounting surfaces) will be published after the kit contents are confirmed.",
    confirmed: false,
  },
  {
    question: "How do I install the products?",
    answer:
      "Step-by-step setup instructions will be added once the final kit has been tested. If you get stuck, contact us and we'll help.",
    confirmed: false,
  },
  {
    question: "How long does shipping take?",
    answer:
      "Delivery times depend on our supplier and are being confirmed. See our shipping policy for the latest details before you order.",
    confirmed: false,
  },
  {
    question: "What is the return policy?",
    answer:
      "Our returns and refunds policy is being finalised. It will be published on the Returns & refunds page. Your rights under Australian Consumer Law always apply.",
    confirmed: false,
  },
];
