import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("counts graphemes, not code units", () => {
    render(<Textarea aria-label="Comet" maxGraphemes={10} defaultValue="hi 👩‍🚀" />);
    expect(screen.getByText(/4 \/ 10/)).toBeInTheDocument();
  });

  it("announces the count near the limit and marks overflow invalid", async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Comet" maxGraphemes={5} />);
    const field = screen.getByRole("textbox", { name: "Comet" });

    await user.type(field, "abcdefg");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByText("2 characters over the limit").length).toBeGreaterThan(0);
  });
});
