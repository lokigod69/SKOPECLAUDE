import { scriptedConversation, scoreSentiment, focusSnippet, hasQuestion } from "../routes/deterministicCoach";
import type { AiAdapter, ConversationInput, ConversationOutput } from "./types";

const PHASE_GLOSSES: Record<string, string> = {
  discovery: "We are still listening for the edges. Stay with the texture of it.",
  dance: "You have practiced this rhythm. Notice where it wants to lead next.",
  integration: "Your steps are almost muscle memory. Let us check what still needs presence."
};

const ANALYSIS_TEMPLATES: Record<string, string> = {
  bright: "The emotional tone leans bright with momentum we can harness.",
  neutral: "The emotional tone feels balanced; we can choose the direction intentionally.",
  heavy: "There is weight here that deserves gentleness and pacing."
};

function phaseGuidance(phase?: unknown): string {
  if (typeof phase === "string") {
    const lower = phase.toLowerCase();
    if (PHASE_GLOSSES[lower]) {
      return PHASE_GLOSSES[lower];
    }
  }
  return PHASE_GLOSSES.discovery;
}

function formatReflection(snippet: string | null): string {
  if (!snippet) {
    return "";
  }
  return `Here is the fragment I am holding: "${snippet}".`;
}

function craftPrompt(sentiment: ReturnType<typeof scoreSentiment>, isQuestion: boolean): string {
  if (sentiment.label === "bright") {
    return "What commitment would protect that spark over the next 24 hours?";
  }
  if (sentiment.label === "heavy") {
    return isQuestion
      ? "Take pressure off the answer. What is the smallest experiment that would move this one notch?"
      : "Before moving forward, what support would make this feel 2% lighter?";
  }
  return isQuestion
    ? "Name the first detail that deserves more light and we will stay with it."
    : "Choose one angle you want to examine more closely and I will stay with you there.";
}

class MockOpenAiAdapter implements AiAdapter {
  name = "mock-openai";

  async generate(input: ConversationInput): Promise<ConversationOutput> {
    await new Promise((resolve) => setTimeout(resolve, 20));

    const analysis = scoreSentiment(input.message);
    const snippet = focusSnippet(input.message);
    const question = hasQuestion(input.message);
    const deterministic = scriptedConversation(input.message);
    const phase = input.context?.phase;

    const replyLines = [
      ANALYSIS_TEMPLATES[analysis.label],
      formatReflection(snippet),
      phaseGuidance(phase),
      craftPrompt(analysis, question)
    ].filter(Boolean);

    const meta: Record<string, unknown> = {
      strategy: "mock-openai",
      deterministicSeed: deterministic.reply,
      adapter: this.name,
      latencyMs: 20
    };

    if (typeof phase === "string") {
      meta.phase = phase;
    }
    if (input.history?.length) {
      meta.historySize = input.history.length;
    }
    if (input.personality) {
      meta.personality = input.personality;
      replyLines.push(`Keep holding ${input.personality.focus.toLowerCase()}.`);
    }

    return {
      reply: replyLines.join(" "),
      sentiment: analysis,
      meta
    };
  }
}

export const mockOpenAiAdapter = new MockOpenAiAdapter();
