import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useConversationStore } from "./conversationStore";

const ORIGINAL_FETCH = global.fetch;

function resetStore() {
  useConversationStore.setState({
    history: [],
    sentiment: "neutral",
    personality: null,
    personalityHint: null,
    adapterName: null,
    goals: [],
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
    const mockResponse = {
      ok: true,
      json: async () => ({
        response: "Let's explore that together.",
        emotion: "bright",
        sentiment: { tone: "bright" },
        personality: { type: "wise_friend", confidence: 0.8 }
      })
    } as Response;
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock as unknown as typeof fetch;

    await useConversationStore.getState().submit("I feel grateful today");

    const {
      history,
      sentiment,
      isLoading,
      personalityHint: storedHint,
      personality: storedPersonality,
      goals
    } =
      useConversationStore.getState();

    const [[url, options]] = fetchMock.mock.calls;
    expect(url).toBe("/api/conversation");
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
    expect(storedHint).toBe("wise friend");
    expect(storedPersonality).toMatchObject({
      stage: "discovering",
      archetype: "Wise Friend"
    });
    expect(goals.length).toBeLessThanOrEqual(1);
  });

  it("suggests goals after repeated desire statements", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: "Let's sit with that.",
        emotion: "neutral",
        sentiment: { tone: "neutral" },
        personality: { type: "wise_friend" }
      })
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    // Seed history with desire-laden messages
    useConversationStore.setState((state) => ({
      ...state,
      history: Array.from({ length: 5 }).map((_, index) => ({
        id: `seed-${index}`,
        role: index % 2 === 0 ? "user" : "assistant",
        content: index % 2 === 0 ? "I want to feel stronger" : "Tell me more",
        createdAt: new Date().toISOString(),
        sentiment: "neutral"
      }))
    }));

    await useConversationStore.getState().submit("I need to rebuild my morning routine");

    const { goals } = useConversationStore.getState();
    expect(goals.length).toBeGreaterThanOrEqual(1);
    expect(goals[0].text.length).toBeGreaterThan(0);
  });

  it("adds system message and error when the API call fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    await useConversationStore.getState().submit("I feel stuck");

    const { history, error, isLoading, personality, goals } = useConversationStore.getState();
    expect(history).toHaveLength(2);
    expect(history[1].role).toBe("system");
    expect(error).toBe("We couldn't reach the conversation service. Please try again in a moment.");
    expect(isLoading).toBe(false);
    expect(personality).toBeNull();
    expect(goals).toEqual([]);
  });
});
