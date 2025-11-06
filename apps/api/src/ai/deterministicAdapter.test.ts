import { describe, expect, it } from "vitest";

import { deterministicAdapter } from "./deterministicAdapter";

describe("deterministicAdapter", () => {
  it("returns scripted reply with metadata", async () => {
    const result = await deterministicAdapter.generate({
      message: "I feel hopeful about the next chapter.",
      history: [{ role: "user", content: "hopeful", sentiment: "bright" }],
      personality: {
        stage: "discovering",
        archetype: "Radiant Explorer",
        voice: "Curious and warm",
        focus: "Protect the spark daily",
        affirmations: ["Begin gently, stay kind."]
      }
    });

    expect(result.reply).toMatch(/spark/i);
    expect(result.sentiment.label).toBe("bright");
    expect(result.meta?.strategy).toBe("scripted");
    expect(result.meta?.adapter).toBe("deterministic");
    expect(result.meta?.historySize).toBe(1);
    expect(result.meta?.personality).toMatchObject({
      archetype: "Radiant Explorer"
    });
  });

  it("handles heavy messages with questions", async () => {
    const result = await deterministicAdapter.generate({
      message: "I'm anxious and stuck. what now?",
      context: { phase: "integration" }
    });

    expect(result.sentiment.label).toBe("heavy");
    expect(result.reply).toMatch(/not rush it/i);
    expect(result.meta?.phase).toBe("integration");
  });
});
