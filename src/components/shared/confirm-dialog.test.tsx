import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";

import { ConfirmDialog, isConfirmationMatch } from "./confirm-dialog";

describe("isConfirmationMatch", () => {
  it("needs the exact phrase", () => {
    expect(isConfirmationMatch("pebble", "pebble")).toBe(true);
    expect(isConfirmationMatch("Pebble", "pebble")).toBe(false);
    expect(isConfirmationMatch("pebble ", "pebble")).toBe(false);
    expect(isConfirmationMatch("", "pebble")).toBe(false);
  });
});

describe("ConfirmDialog", () => {
  it("keeps confirm disabled until the phrase matches, then confirms", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        trigger={<Button>Delete world</Button>}
        title="Delete Pebble?"
        description="This can't be undone."
        confirmPhrase="pebble"
        confirmLabel="Delete forever"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete world" }));
    const confirm = screen.getByRole("button", { name: "Delete forever" });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText(/to confirm/), "pebbl");
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText(/to confirm/), "e");
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledOnce();
    });
  });
});
