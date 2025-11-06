'use client';

import { create } from "zustand";

import type { SentimentTone } from "./palette";
import { detectEmotion } from "./emotionDetector";
import {
  getOrCreateClientId,
  loadPersistedConversation,
  savePersistedConversation
} from "./LocalPersistence";
import type {
  ConversationHistoryPayload,
  ConversationMessage,
  PersonalitySnapshot
} from "./conversationTypes";

type SubmitResult = {
  reply: string;
  sentiment?: {
    label: SentimentTone;
    confidence: number;
  };
  meta?: {
    adapter?: string;
    personalityHint?: string;
    personality?: PersonalitySnapshot;
  };
};

type ConversationPayload = {
  message: string;
  history: ConversationHistoryPayload[];
};

type ConversationHydration = {
  history: ConversationMessage[];
  sentiment: SentimentTone;
  personality?: PersonalitySnapshot | null;
  personalityHint?: string | null;
};

type ConversationState = {
  history: ConversationMessage[];
  sentiment: SentimentTone;
  personality?: PersonalitySnapshot | null;
  personalityHint?: string | null;
  adapterName?: string | null;
  input: string;
  isLoading: boolean;
  error?: string;
  hydrate: (snapshot: ConversationHydration) => void;
  setInput: (value: string) => void;
  submit: (message?: string) => Promise<void>;
  setHistory: (messages: ConversationMessage[]) => void;
  setSentiment: (tone: SentimentTone) => void;
  clearError: () => void;
  bootstrap: () => void;
};

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api"}/conversation`;
const MAX_HISTORY_ITEMS = 6;

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 10);
}

function buildHistoryPayload(history: ConversationMessage[]): ConversationHistoryPayload[] {
  return history.slice(-MAX_HISTORY_ITEMS).map((message) => ({
    role: message.role,
    content: message.content,
    sentiment: message.sentiment,
    createdAt: message.createdAt
  }));
}

async function postConversation(
  payload: ConversationPayload,
  headers: Record<string, string>
): Promise<SubmitResult> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Failed to create conversation exchange.");
  }

  const data = (await response.json()) as SubmitResult;
  if (!data.reply) {
    throw new Error("Conversation service returned an empty reply.");
  }

  return data;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  history: [],
  sentiment: "neutral",
  personality: null,
  personalityHint: null,
  adapterName: null,
  input: "",
  isLoading: false,
  error: undefined,
  hydrate(snapshot) {
    set(() => ({
      history: snapshot.history,
      sentiment: snapshot.sentiment,
      personality: snapshot.personality ?? null,
      personalityHint: snapshot.personalityHint ?? null
    }));
  },
  bootstrap() {
    const snapshot = loadPersistedConversation();
    if (snapshot) {
      set(() => ({
        history: snapshot.history,
        sentiment: snapshot.sentiment,
        personality: snapshot.personality ?? null,
        personalityHint: snapshot.personalityHint ?? null
      }));
    }
  },
  setHistory(messages) {
    set(() => ({ history: messages }));
  },
  setSentiment(tone) {
    set(() => ({ sentiment: tone }));
  },
  setInput(value) {
    set(() => ({ input: value }));
  },
  clearError() {
    set(() => ({ error: undefined }));
  },
  async submit(overrideMessage) {
    const currentInput = overrideMessage ?? get().input;
    const trimmed = currentInput.trim();
    if (!trimmed) {
      return;
    }

    const timestamp = new Date().toISOString();
    const emotion = detectEmotion(trimmed);
    const userMessage: ConversationMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
      createdAt: timestamp,
      sentiment: emotion.tone
    };

    const userId = getOrCreateClientId();
    const phase = get().personality?.stage;
    const historyWithUser = [...get().history, userMessage];

    set(() => ({
      history: historyWithUser,
      input: "",
      isLoading: true,
      sentiment: emotion.tone,
      error: undefined
    }));

    try {
      const payload: ConversationPayload = {
        message: trimmed,
        history: buildHistoryPayload(historyWithUser)
      };
      const headers: Record<string, string> = {
        "x-user-id": userId
      };
      if (phase) {
        headers["x-user-phase"] = phase;
      }

      const result = await postConversation(payload, headers);
      const assistantTone = result.sentiment?.label ?? emotion.tone;
      const assistantMessage: ConversationMessage = {
        id: createId(),
        role: "assistant",
        content: result.reply,
        createdAt: new Date().toISOString(),
        sentiment: result.sentiment?.label
      };

      set((state) => {
        const updatedHistory = [...state.history, assistantMessage];
        savePersistedConversation({
          history: updatedHistory,
          sentiment: assistantTone,
          personality: result.meta?.personality ?? state.personality ?? null,
          personalityHint: result.meta?.personalityHint ?? state.personalityHint ?? null
        });

        return {
          history: updatedHistory,
          isLoading: false,
          sentiment: assistantTone,
          personality: result.meta?.personality ?? state.personality ?? null,
          personalityHint: result.meta?.personalityHint ?? state.personalityHint ?? null,
          adapterName: result.meta?.adapter ?? state.adapterName ?? null
        };
      });
    } catch (error) {
      const fallback: ConversationMessage = {
        id: createId(),
        role: "system",
        content: "I'm having trouble connecting right now. Let's try again in a moment.",
        createdAt: new Date().toISOString()
      };

      set((state) => {
        const updatedHistory = [...state.history, fallback];
        savePersistedConversation({
          history: updatedHistory,
          sentiment: state.sentiment,
          personality: state.personality ?? null,
          personalityHint: state.personalityHint ?? null
        });

        return {
          history: updatedHistory,
          isLoading: false,
          error:
            error instanceof Error
              ? "We couldn't reach the conversation service. Please try again in a moment."
              : "Unexpected conversation error"
        };
      });
    }
  }
}));
