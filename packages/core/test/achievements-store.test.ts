import type { StoreApi } from "zustand/vanilla";
import { beforeEach, describe, expect, it } from "bun:test";

import { progresRaw } from "./helpers/fixtures.js";
import {
  configureXPKit,
  createAchievementsStore,
  parseConfig,
  resetXPKitForTests,
  type Achievement,
  type AchievementsStore,
  type StorageAdapter,
} from "../src/index.js";

let catalog: readonly Achievement[];
let backing: Map<string, string>;

function memoryStorage(map: Map<string, string>): StorageAdapter {
  return {
    get: (name) => map.get(name) ?? null,
    set: (name, value) => void map.set(name, value),
    remove: (name) => void map.delete(name),
  };
}

// The store is typed as a plain StoreApi; persisted instances also carry zustand's
// `persist` API at runtime.
async function rehydrate(store: StoreApi<AchievementsStore>): Promise<void> {
  await (store as unknown as { persist: { rehydrate(): Promise<void> } }).persist.rehydrate();
}

beforeEach(() => {
  catalog = parseConfig(progresRaw).gamification.achievements;
  backing = new Map();
  resetXPKitForTests();
  configureXPKit({ storage: memoryStorage(backing), keyPrefix: "test" });
});

describe("createAchievementsStore", () => {
  it("increment returns newlyUnlocked once", () => {
    const store = createAchievementsStore({ catalog, persist: false });
    expect(store.getState().increment("progressCreated")).toEqual(["starter"]);
    expect(store.getState().increment("progressCreated")).toEqual([]);
    expect(store.getState().counters).toEqual({ progressCreated: 2 });
    expect(store.getState().unlocked).toEqual(["starter"]);
  });

  it("setCounter can unlock many in catalog order, reset clears", () => {
    const store = createAchievementsStore({ catalog, persist: false });
    expect(store.getState().setCounter("progressCreated", 10)).toEqual([
      "starter",
      "strategist",
      "planner",
    ]);
    store.getState().reset();
    expect(store.getState().counters).toEqual({});
    expect(store.getState().unlocked).toEqual([]);
  });

  it("restores unlocks on a second store over the same storage", async () => {
    const a = createAchievementsStore({ catalog });
    await rehydrate(a);
    a.getState().setCounter("progressCreated", 3);
    expect(a.getState().unlocked).toEqual(["starter", "strategist"]);

    const b = createAchievementsStore({ catalog });
    await rehydrate(b);
    expect(b.getState().unlocked).toEqual(["starter", "strategist"]);
    expect(b.getState().counters).toEqual({ progressCreated: 3 });

    // Already-unlocked ids are not returned again; only the new one is.
    expect(b.getState().increment("progressCreated", 7)).toEqual(["planner"]);
    expect(b.getState().unlocked).toEqual(["starter", "strategist", "planner"]);
  });

  it("never drops an unlocked id that left the catalog", async () => {
    const a = createAchievementsStore({ catalog });
    await rehydrate(a);
    a.getState().setCounter("progressCreated", 3);

    const trimmed = catalog.filter((x) => x.id !== "starter");
    const b = createAchievementsStore({ catalog: trimmed });
    await rehydrate(b);
    expect(b.getState().unlocked).toEqual(["starter", "strategist"]);
    b.getState().increment("progressCreated");
    expect(b.getState().unlocked).toEqual(["starter", "strategist"]);
    b.getState().setCounter("progressCreated", 10);
    expect(b.getState().unlocked).toEqual(["starter", "strategist", "planner"]);
  });

  it("persists only counters and unlocked", async () => {
    const store = createAchievementsStore({ catalog });
    await rehydrate(store);
    store.getState().increment("progressCreated");
    const stored = JSON.parse(backing.get("test:achievements")!);
    expect(Object.keys(stored.state).sort()).toEqual(["counters", "unlocked"]);
    expect(stored.state).toEqual({ counters: { progressCreated: 1 }, unlocked: ["starter"] });
  });

  it("persist: false writes nothing", () => {
    const store = createAchievementsStore({ catalog, persist: false });
    store.getState().increment("progressCreated");
    expect(backing.size).toBe(0);
  });
});
