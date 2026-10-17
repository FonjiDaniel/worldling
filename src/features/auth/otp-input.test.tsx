import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { OtpInput } from "./otp-input";

function Harness({ onComplete }: { onComplete?: (value: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <>
      <span id="label">Your code</span>
      <OtpInput
        length={8}
        value={value}
        onChange={setValue}
        labelledBy="label"
        {...(onComplete !== undefined && { onComplete })}
      />
      <output data-testid="value">{value}</output>
    </>
  );
}

const cells = () => screen.getAllByRole("textbox");
function cell(index: number): HTMLElement {
  const element = cells()[index];
  if (element === undefined) throw new Error(`No cell ${String(index)}`);
  return element;
}
const value = () => screen.getByTestId("value").textContent;

describe("OtpInput", () => {
  it("renders labelled numeric cells with one-time-code autofill on the first", () => {
    render(<Harness />);
    expect(screen.getByRole("group", { name: "Your code" })).toBeInTheDocument();
    expect(cells()).toHaveLength(8);
    expect(cells()[0]).toHaveAttribute("autocomplete", "one-time-code");
    expect(cells()[0]).toHaveAttribute("inputmode", "numeric");
    expect(cells()[3]).toHaveAccessibleName("Digit 4 of 8");
  });

  it("advances as you type and ignores letters", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(cell(0));
    await user.keyboard("12a3");
    expect(value()).toBe("123");
    expect(cells()[3]).toHaveFocus();
  });

  it("fills every cell from a paste into any cell and completes", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    await user.click(cell(5));
    await user.paste(" 1234-5678 ");
    expect(value()).toBe("12345678");
    expect(onComplete).toHaveBeenCalledWith("12345678");
  });

  it("steps back with Backspace and moves with arrows", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(cell(0));
    await user.keyboard("123");
    await user.keyboard("{Backspace}");
    // The empty fourth cell deletes the 3 and focus lands on its now-empty cell.
    expect(value()).toBe("12");
    expect(cells()[2]).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(cells()[1]).toHaveFocus();
    // Right stops at the first empty cell, so nobody skips ahead of the code.
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(cells()[2]).toHaveFocus();
  });
});
