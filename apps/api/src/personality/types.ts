import type {
  ConversationHistoryItem,
  PersonalitySnapshot,
  SentimentTone
} from "../ai/types";

export type PersonalityEngineInput = {
  userId?: string;
  message: string;
  history?: ConversationHistoryItem[];
  sentiment?: SentimentTone;
};

export type PersonalityComputation = {
  snapshot: PersonalitySnapshot;
  hint: string;
  interactions: number;
  score: number;
};

