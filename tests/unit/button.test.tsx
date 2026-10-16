import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders the branded primary call to action by default", () => {
    render(<Button>Shop the Clean Desk Kit</Button>);
    const button = screen.getByRole("button", { name: "Shop the Clean Desk Kit" });
    expect(button).toHaveClass("bg-lime", "text-lime-foreground", "h-11");
  });

  it("keeps the link variant free of horizontal padding", () => {
    render(<Button variant="link">See the transformation</Button>);
    const button = screen.getByRole("button", { name: "See the transformation" });
    expect(button).toHaveClass("px-0");
    expect(button).not.toHaveClass("px-6");
  });

  it("exposes the disabled state to assistive technology", () => {
    render(<Button disabled>Add to cart</Button>);
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeDisabled();
  });
});
