import { describe, expect, it } from "vitest";

import { conversationMemoryStore } from "./conversationStore";

describe("conversationMemoryStore", () => {
  it("appends history and clamps to max entries", () => {
    conversationMemoryStore.reset();
    for (let i = 0; i < 15; i += 1) {
      conversationMemoryStore.appendHistory("user-1", {
        role: "user",
        content: `message-${i}`,
        createdAt: String(i)
      });
    }

    const snapshot = conversationMemoryStore.load("user-1");
    expect(snapshot.history).toHaveLength(12);
    expect(snapshot.history[0].content).toBe("message-3");
  });

  it("saves personality with copy semantics", () => {
    conversationMemoryStore.reset("user-2");
    const personality = {
      stage: "discovering" as const,
      archetype: "Radiant Explorer",
      voice: "Curious companion",
      focus: "Notice what lights you up",
      affirmations: ["Spark", "Breathe"]
    };

    const snapshot = conversationMemoryStore.savePersonality("user-2", personality, 3, 4);
    personality.affirmations.push("Mutated");

    const loaded = conversationMemoryStore.load("user-2");
    expect(snapshot.personality?.affirmations).toHaveLength(2);
    expect(loaded.personality?.affirmations).not.toContain("Mutated");
    expect(loaded.score).toBe(3);
    expect(loaded.interactions).toBe(4);
  });

  it("seeds history with provided items", () => {
    conversationMemoryStore.reset("user-3");
    conversationMemoryStore.seedHistory("user-3", [
      { role: "assistant", content: "hello" },
      { role: "user", content: "hi" }
    ]);

    const snapshot = conversationMemoryStore.load("user-3");
    expect(snapshot.history).toHaveLength(2);
    expect(snapshot.history[1].content).toBe("hi");
  });
});

