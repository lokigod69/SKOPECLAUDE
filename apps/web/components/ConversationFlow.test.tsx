import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConversationFlow } from "./ConversationFlow";
import { useConversationStore } from "../lib/conversationStore";
import type { PersonalitySnapshot } from "../lib/conversationTypes";

const STORAGE_KEY = "goal-app-conversation";
const ORIGINAL_FETCH = global.fetch;

function primeStorage() {
  const snapshot = {
    history: [
      {
        id: "welcome",
        role: "assistant" as const,
        content: "Welcome back. Pick up where you left off?",
        createdAt: new Date().toISOString(),
        sentiment: "neutral"
      }
    ],
    sentiment: "neutral",
    personality: null,
    personalityHint: null,
    version: 2,
    updatedAt: new Date().toISOString()
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

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

describe("ConversationFlow component", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetStore();
    global.fetch = ORIGINAL_FETCH;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = ORIGINAL_FETCH;
  });

  it("hydrates history from local storage and displays messages", async () => {
    primeStorage();
    render(<ConversationFlow />);

    expect(await screen.findByText(/welcome back/i)).toBeInTheDocument();
  });

  it("submits a new message and shows assistant reply", async () => {
    const user = userEvent.setup();
    const personality: PersonalitySnapshot = {
      stage: "discovering",
      archetype: "Radiant Explorer",
      voice: "Gentle curiosity",
      focus: "Hold the spark softly",
      affirmations: ["Your pace is already enough."]
    };
    const mockResponse = {
      ok: true,
      json: async () => ({
        reply: "Echo: I hear you.",
        sentiment: { label: "neutral", confidence: 0.4 },
        meta: {
          adapter: "deterministic",
          personalityHint: "Keep the spark within reach.",
          personality
        }
      })
    };

    global.fetch = vi.fn().mockResolvedValue(mockResponse) as unknown as typeof fetch;

    render(<ConversationFlow />);

    const textarea = screen.getByPlaceholderText(/tell me where you are/i);
    await user.type(textarea, "I feel hopeful");
    await user.click(screen.getByRole("button", { name: /share/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(await screen.findByText(/echo: i hear you/i)).toBeInTheDocument();
    expect(screen.getByText(/sentiment/i)).toHaveTextContent("Sentiment");
    expect(screen.getByText(/adapter/i)).toHaveTextContent(/deterministic/i);
    expect(await screen.findByText(/radiant explorer/i)).toBeInTheDocument();
    expect(screen.getByText(/keep the spark/i)).toBeInTheDocument();
  });
});
