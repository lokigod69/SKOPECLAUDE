import fs from "node:fs";
import path from "node:path";

import type { ConversationHistoryItem, PersonalitySnapshot } from "../ai/types";

export type ConversationStateSnapshot = {
  history: ConversationHistoryItem[];
  personality?: PersonalitySnapshot;
  interactions: number;
  score: number;
  updatedAt: number;
};

type ConversationState = ConversationStateSnapshot;

type SerializedState = Record<string, ConversationState>;

function clonePersonality(personality?: PersonalitySnapshot): PersonalitySnapshot | undefined {
  if (!personality) {
    return undefined;
  }
  return {
    ...personality,
    affirmations: [...personality.affirmations]
  };
}

function cloneHistory(history: ConversationHistoryItem[]): ConversationHistoryItem[] {
  return history.map((item) => ({ ...item }));
}

function createDefaultState(): ConversationState {
  return {
    history: [],
    interactions: 0,
    score: 0,
    personality: undefined,
    updatedAt: Date.now()
  };
}

function cloneState(state: ConversationState): ConversationStateSnapshot {
  return {
    history: cloneHistory(state.history),
    personality: clonePersonality(state.personality),
    interactions: state.interactions,
    score: state.score,
    updatedAt: state.updatedAt
  };
}

function ensureDirectory(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

const DEFAULT_DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE =
  process.env.CONVERSATION_STORE_PATH ??
  path.join(DEFAULT_DATA_DIR, "conversationStore.json");

class ConversationMemoryStore {
  private readonly store = new Map<string, ConversationState>();
  private readonly maxHistory: number;
  private readonly dataFile: string;

  constructor(options: { maxHistory?: number; dataFile?: string } = {}) {
    this.maxHistory = options.maxHistory ?? 12;
    this.dataFile = options.dataFile ?? DATA_FILE;
    this.loadFromDisk();
  }

  private key(userId?: string): string {
    return userId && userId.trim().length > 0 ? userId : "anonymous";
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(this.dataFile)) {
        return;
      }
      const raw = fs.readFileSync(this.dataFile, "utf8");
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as SerializedState;
      for (const [key, state] of Object.entries(parsed)) {
        this.store.set(key, {
          ...state,
          history: cloneHistory(state.history ?? []),
          personality: clonePersonality(state.personality)
        });
      }
    } catch (error) {
      console.warn("Failed to load conversation memory store:", error);
    }
  }

  private persist(): void {
    try {
      ensureDirectory(this.dataFile);
      const serializable: SerializedState = {};
      for (const [key, state] of this.store.entries()) {
        serializable[key] = {
          history: cloneHistory(state.history),
          personality: clonePersonality(state.personality),
          interactions: state.interactions,
          score: state.score,
          updatedAt: state.updatedAt
        };
      }
      fs.writeFileSync(this.dataFile, JSON.stringify(serializable, null, 2), "utf8");
    } catch (error) {
      console.warn("Failed to persist conversation memory store:", error);
    }
  }

  load(userId?: string): ConversationStateSnapshot {
    const state = this.store.get(this.key(userId)) ?? createDefaultState();
    return cloneState(state);
  }

  seedHistory(userId: string | undefined, history: ConversationHistoryItem[]): ConversationStateSnapshot {
    if (!history.length) {
      return this.load(userId);
    }

    const key = this.key(userId);
    const current = this.store.get(key) ?? createDefaultState();
    const trimmed = cloneHistory(history.slice(-this.maxHistory));
    const nextState: ConversationState = {
      ...current,
      history: trimmed,
      updatedAt: Date.now()
    };
    this.store.set(key, nextState);
    this.persist();
    return cloneState(nextState);
  }

  appendHistory(
    userId: string | undefined,
    message: ConversationHistoryItem
  ): ConversationStateSnapshot {
    const key = this.key(userId);
    const state = this.store.get(key) ?? createDefaultState();
    const last = state.history[state.history.length - 1];
    if (last && last.role === message.role && last.content === message.content) {
      return cloneState(state);
    }

    const clampedHistory = [...state.history, { ...message }].slice(-this.maxHistory);

    const nextState: ConversationState = {
      ...state,
      history: clampedHistory,
      updatedAt: Date.now()
    };
    this.store.set(key, nextState);
    this.persist();
    return cloneState(nextState);
  }

  savePersonality(
    userId: string | undefined,
    personality: PersonalitySnapshot,
    score: number,
    interactions: number
  ): ConversationStateSnapshot {
    const key = this.key(userId);
    const state = this.store.get(key) ?? createDefaultState();
    const nextState: ConversationState = {
      ...state,
      personality: clonePersonality(personality),
      score,
      interactions,
      updatedAt: Date.now()
    };
    this.store.set(key, nextState);
    this.persist();
    return cloneState(nextState);
  }

  reset(userId?: string): void {
    if (userId) {
      this.store.delete(this.key(userId));
    } else {
      this.store.clear();
    }
    this.persist();
  }
}

export const conversationMemoryStore = new ConversationMemoryStore({ maxHistory: 12 });
