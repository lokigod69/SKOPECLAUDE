'use client';

import type { ConversationMessage, GoalNodeData, PersonalitySnapshot } from "./conversationTypes";
import type { SentimentTone } from "./palette";

export type PersistedState = {
  history: ConversationMessage[];
  sentiment: SentimentTone;
  personality: PersonalitySnapshot | null;
  personalityHint: string | null;
  goals: GoalNodeData[];
  version: number;
  updatedAt: string;
};

const STORAGE_KEY = "goal-app-conversation";
const CLIENT_ID_KEY = "goal-app-client-id";
const CURRENT_VERSION = 3;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadPersistedConversation(): PersistedState | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (parsed.version !== CURRENT_VERSION) {
      return null;
    }

    return {
      history: parsed.history ?? [],
      sentiment: parsed.sentiment ?? "neutral",
      personality: parsed.personality ?? null,
      personalityHint: parsed.personalityHint ?? null,
      goals: parsed.goals ?? [],
      version: CURRENT_VERSION,
      updatedAt: parsed.updatedAt ?? new Date().toISOString()
    };
  } catch {
    return null;
  }
}

type PersistedSnapshot = Pick<
  PersistedState,
  "history" | "sentiment" | "personality" | "personalityHint" | "goals"
>;

export function savePersistedConversation(state: PersistedSnapshot): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      history: state.history,
      sentiment: state.sentiment,
      personality: state.personality ?? null,
      personalityHint: state.personalityHint ?? null,
      goals: state.goals ?? [],
      version: CURRENT_VERSION,
      updatedAt: new Date().toISOString()
    })
  );
}

export function clearPersistedConversation(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function getOrCreateClientId(): string {
  if (!isBrowser()) {
    return "anonymous";
  }

  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `anon-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(CLIENT_ID_KEY, generated);
  return generated;
}
