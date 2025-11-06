import { beforeEach, describe, expect, it } from "vitest";

import { computePersonality, resetPersonalityStore } from "./engine";

describe("personality engine", () => {
  beforeEach(() => {
    resetPersonalityStore();
  });

  it("returns discovering stage profile on first interaction", () => {
    const result = computePersonality({
      userId: "user-1",
      message: "I feel hopeful and excited."
    });

    expect(result.snapshot.stage).toBe("discovering");
    expect(result.snapshot.archetype).toMatch(/Explorer|Mirror/);
    expect(result.hint).toMatch(/Collect the details|Stay curious/);
  });

  it("evolves stage after repeated interactions with mixed tones", () => {
    const userId = "user-2";
    for (let i = 0; i < 5; i += 1) {
      computePersonality({
        userId,
        message: i % 2 === 0 ? "I feel tired and stuck." : "I'm finding small wins.",
        sentiment: i % 2 === 0 ? "heavy" : "bright"
      });
    }

    const result = computePersonality({
      userId,
      message: "I'm still showing up."
    });

    expect(result.snapshot.stage === "forming" || result.snapshot.stage === "anchoring").toBe(true);
    expect(result.snapshot.focus).toBeDefined();
    expect(result.hint.length).toBeGreaterThan(0);
  });
});

