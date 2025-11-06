export type SentimentTone = "bright" | "neutral" | "heavy";

export type ConversationRole = "user" | "assistant" | "system";

export type ConversationHistoryItem = {
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

export type ConversationInput = {
  message: string;
  userId?: string;
  history?: ConversationHistoryItem[];
  personality?: PersonalitySnapshot;
  context?: Record<string, unknown>;
};

export type ConversationMeta = Record<string, unknown> & {
  adapter?: string;
  personalityHint?: string;
  personality?: PersonalitySnapshot;
};

export type ConversationOutput = {
  reply: string;
  sentiment: {
    label: SentimentTone;
    confidence: number;
  };
  meta?: ConversationMeta;
};

export interface AiAdapter {
  name: string;
  generate(input: ConversationInput): Promise<ConversationOutput>;
}
