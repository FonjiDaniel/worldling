import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";
import { IconButton } from "./icon-button";

describe("Button", () => {
  it.each(["primary", "secondary", "ghost", "danger"] as const)(
    "renders the %s variant",
    (variant) => {
      render(<Button variant={variant}>Visit</Button>);
      expect(screen.getByRole("button", { name: "Visit" })).toHaveAttribute("type", "button");
    },
  );

  it("is busy and disabled while pending", () => {
    render(<Button pending>Sending comet</Button>);
    const button = screen.getByRole("button", { name: "Sending comet" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});

describe("IconButton", () => {
  it("uses its label as the accessible name", () => {
    render(<IconButton label="Add moon" icon={<svg />} />);
    expect(screen.getByRole("button", { name: "Add moon" })).toBeInTheDocument();
  });
});
