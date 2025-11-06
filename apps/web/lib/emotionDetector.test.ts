import { describe, expect, it } from "vitest";

import { detectEmotion } from "./emotionDetector";

describe("detectEmotion", () => {
  it("identifies bright tone with matching cues", () => {
    const result = detectEmotion("I feel grateful and excited about today");
    expect(result.tone).toBe("bright");
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.matches.bright).toContain("grateful");
  });

  it("identifies heavy tone with matching cues", () => {
    const result = detectEmotion("Feeling stuck and lonely right now");
    expect(result.tone).toBe("heavy");
    expect(result.matches.heavy).toContain("stuck");
  });

  it("defaults to neutral when cues are balanced", () => {
    const result = detectEmotion("Just checking in about the project");
    expect(result.tone).toBe("neutral");
  });
});

