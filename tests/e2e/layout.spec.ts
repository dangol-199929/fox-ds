import { expect, test } from "@playwright/test";

// Viewport widths from the brief. Each page must render without sideways scrolling.
const widths = [320, 375, 390, 430, 768, 1024, 1440];
const pages = ["/", "/shop", "/products/clean-desk-kit", "/shipping", "/privacy", "/contact", "/no-such-page"];

for (const path of pages) {
  test.describe(`${path} layout`, () => {
    for (const width of widths) {
      test(`no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  });
}

test("pages use Australian English and have exactly one h1", async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", "en-AU");
    await expect(page).toHaveTitle(/Clean Desk Kit/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  }
});

test("mobile menu opens, links work and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();

  await page.getByRole("button", { name: "Open menu" }).click();
  await menu.getByRole("link", { name: "Shop" }).click();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(menu).toBeHidden();
});

test("FAQ accordion is keyboard operable", async ({ page }) => {
  await page.goto("/#faq");
  const trigger = page.getByRole("button", { name: "What comes in the kit?" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
});

test("unknown product shows the not-found state", async ({ page }) => {
  await page.goto("/products/this-product-does-not-exist");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/isn.t available|tidied away/);
});

test.describe("shop filters", () => {
  test("filters come from the URL, show as chips and can be cleared", async ({ page }) => {
    await page.goto("/shop?filter=filter.v.availability.1");
    const chips = page.getByRole("list", { name: "Active filters" });
    await expect(chips.getByRole("button", { name: /Availability: In stock/ })).toBeVisible();
    await chips.getByRole("button", { name: "Clear all" }).click();
    await expect(page).toHaveURL(/\/shop$/);
  });

  test("shows a helpful empty state when nothing matches", async ({ page }) => {
    await page.goto("/shop?min=99999");
    await expect(page.getByText("No products match these filters.")).toBeVisible();
    await page.getByRole("link", { name: "Clear all filters" }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("link", { name: "Clean Desk Kit" }).first()).toBeVisible();
  });

  test("mobile filter drawer opens with a filter count", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/shop?filter=filter.v.availability.1");
    await page.getByRole("button", { name: "Filters (1)" }).click();
    const drawer = page.getByRole("dialog", { name: "Filters" });
    await expect(drawer.getByRole("checkbox", { name: /In stock/ })).toBeChecked();
    // Clearing the only filter returns to the plain shop, where (with a small
    // catalogue) the filter UI is hidden again, so click rather than uncheck().
    await drawer.getByRole("checkbox", { name: /In stock/ }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("button", { name: /Filters/ })).toHaveCount(0);
  });

  test("ignores junk in the URL instead of erroring", async ({ page }) => {
    const response = await page.goto('/shop?filter={"x":1}&sort=newest&min=abc');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Shop" })).toBeVisible();
  });
});
