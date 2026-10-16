import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/format";

describe("formatMoney", () => {
  it("formats AUD with a dollar sign and two decimals", () => {
    expect(formatMoney({ amount: "29.95", currencyCode: "AUD" })).toBe("$29.95");
    expect(formatMoney({ amount: "30", currencyCode: "AUD" })).toBe("$30.00");
  });
});
