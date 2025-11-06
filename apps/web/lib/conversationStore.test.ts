import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PersonalitySnapshot } from "./conversationTypes";
import { useConversationStore } from "./conversationStore";

const ORIGINAL_FETCH = global.fetch;

function resetStore() {
  useConversationStore.setState({
    history: [],
    sentiment: "neutral",
    personality: null,
    personalityHint: null,
    adapterName: null,
    input: "",
    isLoading: false,
    error: undefined
  });
}

describe("useConversationStore", () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = ORIGINAL_FETCH;
  });

  it("records user message and assistant reply with sentiment", async () => {
    const personality: PersonalitySnapshot = {
      stage: "discovering",
      archetype: "Radiant Explorer",
      voice: "Curious and gentle",
      focus: "Build soft routines",
      affirmations: ["You can move softly and still move forward."]
    };
    const mockResponse = {
      ok: true,
      json: async () => ({
        reply: "Let's explore that together.",
        sentiment: { label: "bright", confidence: 0.7 },
        meta: {
          adapter: "deterministic",
          personalityHint: "Follow the spark for one small step.",
          personality
        }
      })
    } as Response;
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock as unknown as typeof fetch;

    await useConversationStore.getState().submit("I feel grateful today");

    const { history, sentiment, isLoading, personalityHint: storedHint, personality: storedPersonality } =
      useConversationStore.getState();

    const [[url, options]] = fetchMock.mock.calls;
    expect(url).toContain("/conversation");
    const body = JSON.parse(options.body as string);
    expect(body.message).toBe("I feel grateful today");
    expect(body.history).toHaveLength(1);
    expect(body.history[0].role).toBe("user");
    expect(body.history[0].sentiment).toBe("bright");

    expect(history).toHaveLength(2);
    expect(history[0].role).toBe("user");
    expect(history[0].sentiment).toBe("bright");
    expect(history[1].role).toBe("assistant");
    expect(history[1].content).toContain("Let's explore");
    expect(sentiment).toBe("bright");
    expect(isLoading).toBe(false);
    expect(storedHint).toBe("Follow the spark for one small step.");
    expect(storedPersonality).toMatchObject(personality);
  });

  it("adds system message and error when the API call fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    await useConversationStore.getState().submit("I feel stuck");

    const { history, error, isLoading, personality } = useConversationStore.getState();
    expect(history).toHaveLength(2);
    expect(history[1].role).toBe("system");
    expect(error).toBe("We couldn't reach the conversation service. Please try again in a moment.");
    expect(isLoading).toBe(false);
    expect(personality).toBeNull();
  });
});
