import { expect, test } from "@playwright/test";

// Viewport widths from the brief. Each page must render without sideways scrolling.
const widths = [320, 375, 390, 430, 768, 1024, 1440];
// The desk mat has 20 photos: a regression check for the thumbnail strip.
const pages = ["/", "/shop", "/shop?category=desk-mats", "/products/clean-desk-kit", "/products/pu-leather-desk-mat", "/shipping", "/privacy", "/contact", "/account", "/no-such-page"];

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

test.describe("search and categories", () => {
  test("header search goes to results", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const search = page.getByRole("search").getByRole("searchbox", { name: "Search products" });
    await search.fill("stand");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/shop\?q=stand$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Results for “stand”");
    await expect(page.getByRole("link", { name: "Folding Laptop Stand" })).toBeVisible();
  });

  test("mobile search opens from the header", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "Search" }).click();
    const sheet = page.getByRole("dialog", { name: "Search" });
    await sheet.getByRole("searchbox").fill("mat");
    await sheet.getByRole("searchbox").press("Enter");
    await expect(page).toHaveURL(/\/shop\?q=mat$/);
    await expect(sheet).toBeHidden();
  });

  test("a search with no matches explains what to do", async ({ page }) => {
    await page.goto("/shop?q=zzqqxxnothing");
    await expect(page.getByText("Nothing matches “zzqqxxnothing”.")).toBeVisible();
    await expect(page.getByRole("link", { name: "See all products" })).toBeVisible();
  });

  test("category pills filter the shop", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("navigation", { name: "Categories" }).last().getByRole("link", { name: /Desk mats/ }).click();
    await expect(page).toHaveURL(/category=desk-mats/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Desk mats");
    await expect(page.getByRole("link", { name: "PU Leather Desk Mat" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Folding Laptop Stand" })).toHaveCount(0);
  });

  test("unknown categories fall back to the whole shop", async ({ page }) => {
    const response = await page.goto("/shop?category=not-a-category");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Shop all");
  });
});
