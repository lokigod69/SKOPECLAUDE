import type { SentimentTone } from "./palette";

export type ConversationRole = "user" | "assistant" | "system";

export type ConversationMessage = {
  id: string;
  role: ConversationRole;
  content: string;
  createdAt: string;
  sentiment?: SentimentTone;
};

export type ConversationHistoryPayload = {
  role: ConversationRole;
  content: string;
  sentiment?: SentimentTone;
  createdAt?: string;
};

export type PersonalityStage = "discovering" | "forming" | "anchoring";

export type PersonalitySnapshot = {
  stage: PersonalityStage;
  archetype: string;
  voice: string;
  focus: string;
  affirmations: string[];
};

