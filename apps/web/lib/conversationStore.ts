'use client';

import { create } from "zustand";

import type { SentimentTone } from "./palette";
import { detectEmotion } from "./emotionDetector";
import { loadPersistedConversation, savePersistedConversation } from "./LocalPersistence";
import type {
  ConversationHistoryPayload,
  ConversationMessage,
  GoalNodeData,
  PersonalitySnapshot
} from "./conversationTypes";
import { extractPotentialGoals } from "./goalExtractor";

type SubmitResult = {
  response: string;
  emotion: string;
  sentiment?: {
    tone?: string;
  };
  personality?: {
    type?: string;
    confidence?: number;
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
  goals?: GoalNodeData[];
};

type ConversationState = {
  history: ConversationMessage[];
  sentiment: SentimentTone;
  personality?: PersonalitySnapshot | null;
  personalityHint?: string | null;
  adapterName?: string | null;
  goals: GoalNodeData[];
  input: string;
  isLoading: boolean;
  error?: string;
  hydrate: (snapshot: ConversationHydration) => void;
  setInput: (value: string) => void;
  submit: (message?: string) => Promise<void>;
  setHistory: (messages: ConversationMessage[]) => void;
  setSentiment: (tone: SentimentTone) => void;
  interactWithGoal: (goalId: string, action: "complete" | "skip" | "explore") => void;
  clearError: () => void;
  bootstrap: () => void;
};

const API_URL = "/api/conversation";
const MAX_HISTORY_ITEMS = 6;
const DEFAULT_PERSONALITY_VOICE = "Gentle, curious presence";
const DEFAULT_PERSONALITY_FOCUS = "Hold the space for reflection";
const MAX_GOALS = 3;
const COMPLETION_THRESHOLD = 3;

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

function toTitleCase(input: string): string {
  return input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));
}

function buildPersonalitySnapshot(
  existing: PersonalitySnapshot | null,
  type?: string
): PersonalitySnapshot | null {
  if (!type) {
    return existing ?? null;
  }

  const archetype = toTitleCase(type.replace(/_/g, " "));
  return {
    stage: existing?.stage ?? "discovering",
    archetype,
    voice: existing?.voice ?? DEFAULT_PERSONALITY_VOICE,
    focus: existing?.focus ?? DEFAULT_PERSONALITY_FOCUS,
    affirmations: existing?.affirmations ?? []
  };
}

function mergeGoals(
  existing: GoalNodeData[],
  suggestions: GoalNodeData[]
): GoalNodeData[] {
  if (!suggestions.length) {
    return existing;
  }

  const merged: GoalNodeData[] = [...existing];

  for (const suggestion of suggestions) {
    if (merged.length >= MAX_GOALS) {
      break;
    }
    const alreadyExists = merged.some(
      (goal) => goal.raw.toLowerCase() === suggestion.raw.toLowerCase()
    );
    if (!alreadyExists) {
      merged.push({
        id: createId(),
        raw: suggestion.raw,
        text: suggestion.text,
        state: merged.length === 0 ? "suggested" : "dormant",
        engagement: 0
      });
    }
  }

  if (merged.length > 0 && merged[0].state === "dormant") {
    merged[0] = { ...merged[0], state: "suggested" };
  }

  return merged.slice(0, MAX_GOALS);
}

async function postConversation(payload: ConversationPayload): Promise<SubmitResult> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Failed to create conversation exchange.");
  }

  const data = (await response.json()) as SubmitResult;
  if (!data.response) {
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
  goals: [],
  input: "",
  isLoading: false,
  error: undefined,
  hydrate(snapshot) {
    set(() => ({
      history: snapshot.history,
      sentiment: snapshot.sentiment,
      personality: snapshot.personality ?? null,
      personalityHint: snapshot.personalityHint ?? null,
      goals: snapshot.goals ?? []
    }));
  },
  bootstrap() {
    const snapshot = loadPersistedConversation();
    if (snapshot) {
      set(() => ({
        history: snapshot.history,
        sentiment: snapshot.sentiment,
        personality: snapshot.personality ?? null,
        personalityHint: snapshot.personalityHint ?? null,
        goals: snapshot.goals ?? []
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
  interactWithGoal(goalId, action) {
    set((state) => {
      const goals = state.goals.map((goal) => {
        if (goal.id !== goalId) {
          return goal;
        }
        const next = { ...goal };
        if (action === "complete") {
          next.engagement += 1;
          next.state =
            next.engagement >= COMPLETION_THRESHOLD ? "crystallizing" : "active";
        } else if (action === "explore") {
          next.state = next.state === "dormant" ? "suggested" : "crystallizing";
        } else if (action === "skip") {
          next.state = "suggested";
        }
        return next;
      });

      savePersistedConversation({
        history: state.history,
        sentiment: state.sentiment,
        personality: state.personality ?? null,
        personalityHint: state.personalityHint ?? null,
        goals
      });

      return { goals };
    });
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

      const result = await postConversation(payload);
      const assistantTone = (result.sentiment?.tone as SentimentTone) ?? emotion.tone;
      const assistantMessage: ConversationMessage = {
        id: createId(),
        role: "assistant",
        content: result.response,
        createdAt: new Date().toISOString(),
        sentiment: assistantTone
      };

      set((state) => {
        const updatedHistory = [...state.history, assistantMessage];
        const nextPersonalityHint =
          result.personality?.type?.replace(/_/g, " ") ?? state.personalityHint ?? null;
        const nextPersonality = buildPersonalitySnapshot(state.personality, result.personality?.type);
        const suggestedGoals = extractPotentialGoals(updatedHistory);
        const goals = mergeGoals(state.goals ?? [], suggestedGoals);
        savePersistedConversation({
          history: updatedHistory,
          sentiment: assistantTone,
          personality: nextPersonality,
          personalityHint: nextPersonalityHint,
          goals
        });

        return {
          history: updatedHistory,
          isLoading: false,
          sentiment: assistantTone,
          personality: nextPersonality,
          personalityHint: nextPersonalityHint,
          adapterName: "openrouter",
          goals
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
          personalityHint: state.personalityHint ?? null,
          goals: state.goals
        });

        return {
          history: updatedHistory,
          isLoading: false,
          error:
            error instanceof Error
              ? "We couldn't reach the conversation service. Please try again in a moment."
              : "Unexpected conversation error",
          goals: state.goals
        };
      });
    }
  }
}));
