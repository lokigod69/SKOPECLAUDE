import { describe, expect, it } from "vitest";

import { mockOpenAiAdapter } from "./mockOpenAiAdapter";

describe("mockOpenAiAdapter", () => {
  it("produces a reflective response for bright sentiment", async () => {
    const result = await mockOpenAiAdapter.generate({
      message: "I feel grateful and excited to start.",
      history: [
        { role: "user", content: "started a new habit", sentiment: "bright" },
        { role: "assistant", content: "keep going", sentiment: "neutral" }
      ]
    });

    expect(result.sentiment.label).toBe("bright");
    expect(result.reply).toMatch(/momentum/i);
    expect(result.meta?.adapter).toBe("mock-openai");
    expect(result.meta?.historySize).toBe(2);
  });

  it("adjusts prompt when question and heavy tone are present", async () => {
    const result = await mockOpenAiAdapter.generate({
      message: "Feeling anxious and stuck, what now?",
      context: { phase: "dance" },
      personality: {
        stage: "forming",
        archetype: "Listening Mirror",
        voice: "Steady encouragement",
        focus: "Balance courage with pause",
        affirmations: ["You can take one step and rest."]
      }
    });

    expect(result.sentiment.label).toBe("heavy");
    expect(result.reply).toMatch(/take pressure off|keep holding/i);
    expect(result.meta?.phase).toBe("dance");
    expect(result.meta?.personality).toMatchObject({ archetype: "Listening Mirror" });
  });
});
