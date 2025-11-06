import type { AiAdapter, ConversationInput, ConversationOutput } from "./types";
import { scriptedConversation } from "../routes/deterministicCoach";

class DeterministicAdapter implements AiAdapter {
  name = "deterministic";

  async generate(input: ConversationInput): Promise<ConversationOutput> {
    const result = scriptedConversation(input.message);
    const phase = typeof input.context?.phase === "string" ? input.context.phase : undefined;
    const meta: Record<string, unknown> = {
      strategy: "scripted",
      version: 1,
      adapter: this.name,
      historySize: input.history?.length ?? 0
    };

    if (phase) {
      meta.phase = phase;
    }
    if (input.personality) {
      meta.personality = input.personality;
    }

    return {
      ...result,
      meta
    };
  }
}

export const deterministicAdapter = new DeterministicAdapter();
