import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConvexError } from "convex/values";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadDraft, saveDraft } from "@/features/creator/draft";
import { freshWorld } from "@/features/creator/edits";
import { takeCelebration } from "@/features/world/celebration";

import { OnboardingForm } from "./onboarding-form";
import { AVAILABILITY_DEBOUNCE_MS } from "./username-field";

type Availability = { available: true } | { available: false; reason: string };

const availability = vi.fn<(args: unknown) => Availability | undefined>();
const complete = vi.fn<(args: unknown) => Promise<unknown>>();
const replace = vi.fn<(path: string) => void>();
let search = "next=/settings";

vi.mock("convex/react", () => ({
  useQuery: (_ref: unknown, args: unknown) => (args === "skip" ? undefined : availability(args)),
  useMutation: () => complete,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("@/components/ui/toaster", () => ({ toast: { error: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  search = "next=/settings";
  localStorage.clear();
  sessionStorage.clear();
  availability.mockReturnValue({ available: true });
  complete.mockResolvedValue({ username: "dawn_light", worldId: "w1" });
});

async function typeUsername(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByLabelText("Username"), text);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AVAILABILITY_DEBOUNCE_MS + 10);
  });
}

describe("OnboardingForm", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("flags a bad format at once, without asking the server", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<OnboardingForm />);
    await typeUsername(user, "a-");
    expect(screen.getByText(/3 to 20 lowercase letters/)).toBeInTheDocument();
    expect(availability).not.toHaveBeenCalled();
  });

  it("announces an available name, then creates the world and follows next", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<OnboardingForm />);
    await typeUsername(user, "Dawn_Light");
    expect(await screen.findByText("dawn_light is yours to take.")).toBeInTheDocument();
    expect(availability).toHaveBeenLastCalledWith({ username: "dawn_light" });

    await user.type(screen.getByLabelText("Display name"), "Kai");
    await user.click(screen.getByRole("button", { name: "Bring my world to life" }));
    expect(complete).toHaveBeenCalledWith({ username: "dawn_light", displayName: "Kai" });
    expect(replace).toHaveBeenCalledWith("/settings");
  });

  it("keeps submit off while the name is taken", async () => {
    availability.mockReturnValue({ available: false, reason: "taken" });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<OnboardingForm />);
    await typeUsername(user, "kai");
    await user.type(screen.getByLabelText("Display name"), "Kai");
    expect(await screen.findByText(/already calls that world home/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bring my world to life" })).toBeDisabled();
  });

  it("shows a server conflict inline when someone takes the name first", async () => {
    complete.mockRejectedValue(
      new ConvexError({
        code: "CONFLICT",
        message: "taken",
        details: { fieldErrors: { username: ["taken"] } },
      }),
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<OnboardingForm />);
    await typeUsername(user, "kai");
    await user.type(screen.getByLabelText("Display name"), "Kai");
    await user.click(screen.getByRole("button", { name: "Bring my world to life" }));
    expect(await screen.findByText(/already calls that world home/)).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("claims the draft from /create and lands on the new world with a celebration", async () => {
    search = "next=/me";
    const draft = { ...freshWorld(11), name: "Tide  haven" };
    saveDraft(draft);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<OnboardingForm />);
    expect(screen.getByText("comes with you.", { exact: false })).toHaveTextContent(
      "Tide haven comes with you.",
    );
    await typeUsername(user, "Dawn_Light");
    await user.type(screen.getByLabelText("Display name"), "Kai");
    await user.click(screen.getByRole("button", { name: "Bring my world to life" }));
    expect(complete).toHaveBeenCalledWith({
      username: "dawn_light",
      displayName: "Kai",
      draft: { name: "Tide haven", params: draft.params },
    });
    expect(replace).toHaveBeenCalledWith("/w/dawn_light");
    expect(loadDraft()).toBeNull();
    expect(takeCelebration("dawn_light")).toBe(true);
  });
});
