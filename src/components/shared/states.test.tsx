import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";

describe("EmptyState", () => {
  it("shows the title and description", () => {
    render(<EmptyState title="No comets yet" description="Share your world." />);
    expect(screen.getByRole("heading", { name: "No comets yet" })).toBeInTheDocument();
    expect(screen.getByText("Share your world.")).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("is an alert with a working retry", async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
