import { expect, test } from "@playwright/test";

// Viewport widths from the brief. Each must render without sideways scrolling.
const widths = [320, 375, 390, 430, 768, 1024, 1440];

test.describe("home page layout", () => {
  for (const width of widths) {
    test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("uses Australian English and a page title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-AU");
    await expect(page).toHaveTitle(/Clean Desk Kit/);
  });
});
