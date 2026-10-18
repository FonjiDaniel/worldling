import { beforeEach, describe, expect, it } from "vitest";

import { randomParams, worldParamsSchema } from "@convex/shared/worldParams";

import { DRAFT_KEY, loadDraft, parseDraft, saveDraft, serializeDraft } from "./draft";
import {
  applyColor,
  applyPalette,
  applyPreset,
  type CreatorWorld,
  freshWorld,
  fromPercent,
  randomize,
  sameWorld,
  SLIDERS,
  sliderPercent,
} from "./edits";
import { createHistory, HISTORY_LIMIT, record, redo, undo } from "./history";
import { createCreatorStore } from "./store";
import { isTextEntry, shortcutFor } from "./use-creator-shortcuts";

const world = (seed = 7): CreatorWorld => freshWorld(seed);

describe("history", () => {
  it("undoes and redoes with labels, and a new change clears redo", () => {
    let history = createHistory(1);
    history = record(history, 2, "terrain");
    history = record(history, 3, "ocean");
    const back = undo(history);
    expect(back).toMatchObject({ label: "ocean", history: { present: 2 } });
    const forward = back && redo(back.history);
    expect(forward).toMatchObject({ label: "ocean", history: { present: 3 } });
    const branched = back && record(back.history, 9, "spin");
    expect(branched?.future).toEqual([]);
    expect(undo(createHistory(1))).toBeNull();
    expect(redo(createHistory(1))).toBeNull();
  });

  it("keeps at most the last 100 steps", () => {
    let history = createHistory(0);
    for (let i = 1; i <= HISTORY_LIMIT + 20; i += 1) history = record(history, i, "step");
    expect(history.past).toHaveLength(HISTORY_LIMIT);
    expect(history.past[0]?.state).toBe(20);
  });
});

describe("creator store", () => {
  it("turns a slider drag into one undo step", () => {
    const store = createCreatorStore(world());
    const start = store.getState().history.present;
    const drag = (value: number) => {
      const { present } = store.getState().history;
      store.getState().preview({ ...present, params: SLIDERS.seaLevel.set(present.params, value) });
    };
    drag(0.1);
    drag(0.2);
    drag(0.3);
    store.getState().commit("Ocean");
    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().undo()).toBe("Ocean");
    expect(store.getState().history.present).toEqual(start);
  });

  it("skips a gesture that changed nothing", () => {
    const store = createCreatorStore(world());
    store.getState().preview(store.getState().history.present);
    store.getState().commit("Spin");
    expect(store.getState().history.past).toHaveLength(0);
  });
});

describe("edits", () => {
  it("maps sliders to percent and back", () => {
    expect(sliderPercent(SLIDERS.amplitude, 0.125)).toBe(50);
    expect(fromPercent(SLIDERS.scale, 100)).toBe(3);
  });

  it("applies a preset keeping the seed and motion", () => {
    const start = world();
    const tilted = { ...start.params, motion: { spin: 0.9, tilt: 0.4 } };
    const frozen = applyPreset(tilted, "frozen");
    expect(frozen).toMatchObject({
      biome: "frozen",
      seed: start.params.seed,
      motion: tilted.motion,
    });
  });

  it("applies a curated palette and clamps custom colors", () => {
    const params = applyPalette(world().params, "crystal-opal");
    expect(params.palette.id).toBe("crystal-opal");
    const vivid = applyColor(params, "stop2", "#FF0000");
    expect(vivid.adjusted).toBe(true);
    expect(vivid.params.palette).toMatchObject({ id: "custom" });
    expect(vivid.params.palette.stops[2]).not.toBe("#ff0000");
    expect(applyColor(params, "ocean", params.ocean.color).adjusted).toBe(false);
  });

  it("randomizes the name only while it hasn't been typed", () => {
    const named = { ...world(), name: "Home", nameEdited: true };
    expect(randomize(named, 99).name).toBe("Home");
    expect(randomize(world(), 99)).toMatchObject({ params: { seed: 99 }, nameEdited: false });
  });

  it("holds params exactly as the server stores them", () => {
    for (let seed = 0; seed < 30; seed += 1) {
      const { params } = freshWorld(seed);
      expect(worldParamsSchema.parse(params)).toEqual(params);
    }
  });
});

describe("draft", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round trips through storage", () => {
    const draft = { ...world(3), name: "Tide haven", nameEdited: true };
    saveDraft(draft);
    expect(loadDraft()).toEqual(draft);
  });

  it("drops corrupt or foreign drafts", () => {
    expect(parseDraft("{not json")).toBeNull();
    expect(parseDraft(JSON.stringify({ v: 2 }))).toBeNull();
    localStorage.setItem(DRAFT_KEY, "[]");
    expect(loadDraft()).toBeNull();
  });

  it("clamps an out-of-range draft on load", () => {
    const params = randomParams(5);
    const raw = serializeDraft(
      {
        name: "Vale",
        nameEdited: false,
        params: { ...params, terrain: { ...params.terrain, scale: 40 } },
      },
      1,
    );
    expect(parseDraft(raw)?.params.terrain.scale).toBe(3);
  });
});

describe("shortcuts", () => {
  const key = (
    k: string,
    mods: Partial<Record<"ctrlKey" | "metaKey" | "shiftKey" | "altKey", boolean>>,
  ) => ({
    key: k,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...mods,
  });

  it("reads undo and redo on both platforms", () => {
    expect(shortcutFor(key("z", { ctrlKey: true }))).toBe("undo");
    expect(shortcutFor(key("Z", { metaKey: true, shiftKey: true }))).toBe("redo");
    expect(shortcutFor(key("y", { ctrlKey: true }))).toBe("redo");
    expect(shortcutFor(key("z", {}))).toBeNull();
    expect(shortcutFor(key("z", { ctrlKey: true, altKey: true }))).toBeNull();
  });

  it("leaves text fields alone", () => {
    const text = document.createElement("input");
    const radio = document.createElement("input");
    radio.type = "radio";
    expect(isTextEntry(text)).toBe(true);
    expect(isTextEntry(document.createElement("textarea"))).toBe(true);
    expect(isTextEntry(radio)).toBe(false);
    expect(isTextEntry(document.createElement("button"))).toBe(false);
  });
});

describe("sameWorld", () => {
  it("ignores key order and name spacing", () => {
    const { params } = world();
    const { version, ...rest } = params;
    const reordered = { ...rest, version };
    expect(
      sameWorld({ name: " Tide  haven", params }, { name: "Tide haven", params: reordered }),
    ).toBe(true);
    expect(
      sameWorld({ name: "Tide", params }, { name: "Tide", params: SLIDERS.spin.set(params, 0.9) }),
    ).toBe(false);
  });
});
