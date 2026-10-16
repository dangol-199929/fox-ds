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
