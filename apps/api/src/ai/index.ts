import { deterministicAdapter } from "./deterministicAdapter";
import { mockOpenAiAdapter } from "./mockOpenAiAdapter";
import type { AiAdapter } from "./types";

type AdapterRegistry = {
  [key: string]: AiAdapter;
};

const registry: AdapterRegistry = {
  deterministic: deterministicAdapter,
  "mock-openai": mockOpenAiAdapter
};

export function resolveAiAdapter(): AiAdapter {
  const key = process.env.AI_ADAPTER?.toLowerCase();
  if (!key) {
    return registry.deterministic;
  }

  return registry[key] ?? registry.deterministic;
}

export type { AiAdapter };
export type { ConversationInput, ConversationOutput, SentimentTone } from "./types";
