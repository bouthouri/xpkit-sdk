import { describe, expect, it } from "bun:test";

import {
  parseConfig,
  parseOnboardingConfig,
  schemaVersion,
} from "../src/index.js";
import { energyXpRaw, fixtureNames, karvRaw, progresRaw, rawFixtures } from "./helpers/fixtures.js";

describe("fixtures parse against the v1 schema", () => {
  it.each(fixtureNames)("%s.json passes parseConfig", (name) => {
    const config = parseConfig(rawFixtures[name]);
    expect(config.schemaVersion).toBe(schemaVersion);
    expect(config.projectName).not.toBe("");
  });

  it("energy-xp.json is the canonical onboarding: 3 video + 1 notification, in order", () => {
    const { onboarding } = parseConfig(energyXpRaw);
    expect(onboarding.screens.map((s) => s.type)).toEqual([
      "video",
      "video",
      "video",
      "notification",
    ]);
  });

  it("energy-xp.json keeps the onboarding-2-first quirk", () => {
    const { onboarding } = parseConfig(energyXpRaw);
    const [first, second, third] = onboarding.screens;
    // The shipped app opens on onboarding-2.mp4, not onboarding-1.mp4. If a diff
    // against the editor's output ever reorders these, the app changed — not this.
    expect(first.type === "video" && first.source.key).toBe("onboarding-2");
    expect(second.type === "video" && second.source.key).toBe("onboarding-1");
    expect(third.type === "video" && third.source.key).toBe("onboarding-3");
  });

  it("progres.json is the canonical gamification: 6 counters + 25 achievements", () => {
    const { gamification } = parseConfig(progresRaw);
    expect(gamification.variables).toHaveLength(6);
    expect(gamification.achievements).toHaveLength(25);
    expect(gamification.variables.every((v) => v.type === "counter")).toBe(true);
  });

  it("every progres achievement has exactly one >= condition on a declared counter", () => {
    const { gamification } = parseConfig(progresRaw);
    const declared = new Set(gamification.variables.map((v) => v.id));

    for (const achievement of gamification.achievements) {
      expect(achievement.conditions).toHaveLength(1);
      const [condition] = achievement.conditions;
      // `>=` not `==` — imported data can jump a counter past several thresholds
      // at once, and every one of them must unlock. See docs/03.
      expect(condition.operator).toBe(">=");
      expect(declared.has(condition.variableId)).toBe(true);
      expect(condition.threshold).toBeGreaterThan(0);
    }
  });

  it("progres achievement ids are unique (they are the persistence key — Rule 2)", () => {
    const { gamification } = parseConfig(progresRaw);
    const ids = gamification.achievements.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("karv.json is the secondary fixture: 4 screens + 7 mastery tiers with effects", () => {
    const config = parseConfig(karvRaw);
    expect(config.onboarding.screens).toHaveLength(4);
    expect(config.gamification.milestones).toHaveLength(7);
    expect(config.gamification.milestones.every((m) => m.effect)).toBe(true);
    // Levels are contiguous from 0 — karv persists milestone_achieved rows by
    // `${habitId}_${level}`, so `level` is the frozen field here, not `id`.
    expect(config.gamification.milestones.map((m) => m.level)).toEqual([
      0, 1, 2, 3, 4, 5, 6,
    ]);
  });

  it("parseOnboardingConfig accepts a full config and an onboarding-only file", () => {
    const fromFull = parseOnboardingConfig(energyXpRaw);
    expect(fromFull.screens).toHaveLength(4);

    const onboardingOnly = {
      schemaVersion,
      onboarding: (energyXpRaw as { onboarding: unknown }).onboarding,
    };
    expect(parseOnboardingConfig(onboardingOnly).screens).toHaveLength(4);
  });
});

describe("the version gate fires before field validation", () => {
  it("rejects an unknown schemaVersion by name", () => {
    expect(() => parseConfig({ schemaVersion: "2.0.0" })).toThrow(
      "Unsupported schemaVersion: 2.0.0",
    );
  });

  it("rejects a non-object", () => {
    expect(() => parseConfig([])).toThrow("Config must be an object.");
  });
});
