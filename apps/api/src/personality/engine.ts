import { focusSnippet, scoreSentiment } from "../routes/deterministicCoach";
import type { ConversationHistoryItem, PersonalitySnapshot, SentimentTone } from "../ai/types";
import { conversationMemoryStore } from "../state/conversationStore";
import type { ConversationStateSnapshot } from "../state/conversationStore";
import type { PersonalityComputation, PersonalityEngineInput } from "./types";

const STAGE_THRESHOLDS = {
  discovering: 0,
  forming: 4,
  anchoring: 10
};

const STAGE_TEMPLATES: Record<
  PersonalitySnapshot["stage"],
  { voice: string; focus: string; affirmations: string[] }
> = {
  discovering: {
    voice: "Curious companion",
    focus: "Notice what lights you up",
    affirmations: ["Every small spark is data.", "You are allowed to arrive as you are."]
  },
  forming: {
    voice: "Steady rhythm",
    focus: "Protect the rituals that serve you",
    affirmations: ["Consistency can feel like kindness.", "You can adjust without abandoning."]
  },
  anchoring: {
    voice: "Quiet confidence",
    focus: "Trust the muscle memory you've built",
    affirmations: ["Your practices live in you now.", "Return only to what nourishes."]
  }
};

const STAGE_HINTS: Record<
  PersonalitySnapshot["stage"],
  Record<SentimentTone, string>
> = {
  discovering: {
    bright: "Collect the details of what feels alive right now.",
    neutral: "Stay curious about what wants to emerge.",
    heavy: "Name the weight gently - awareness is the first step."
  },
  forming: {
    bright: "Channel that energy into one tiny ritual you can repeat.",
    neutral: "Choose one practice to refine; let it guide the day.",
    heavy: "Find the 2% move that keeps momentum without forcing."
  },
  anchoring: {
    bright: "Share the light - teaching it will deepen your integration.",
    neutral: "Check which habits still fit; release the ones that don't.",
    heavy: "Lean on the muscle memory you already built; it can hold you."
  }
};

function determineStage(interactions: number): PersonalitySnapshot["stage"] {
  if (interactions >= STAGE_THRESHOLDS.anchoring) {
    return "anchoring";
  }
  if (interactions >= STAGE_THRESHOLDS.forming) {
    return "forming";
  }
  return "discovering";
}

function deriveArchetype(score: number): string {
  if (score >= 3) {
    return "Radiant Explorer";
  }
  if (score <= -3) {
    return "Grounded Ember";
  }
  return "Listening Mirror";
}

function composeHint(
  stage: PersonalitySnapshot["stage"],
  tone: SentimentTone,
  message: string
): string {
  const base = STAGE_HINTS[stage][tone];
  const snippet = focusSnippet(message);
  return snippet ? `${base} I'm holding "${snippet}".` : base;
}

export function resetPersonalityStore(userId?: string): void {
  conversationMemoryStore.reset(userId);
}

export function computePersonality(input: PersonalityEngineInput): PersonalityComputation {
  const currentState = conversationMemoryStore.load(input.userId);

  const tone = input.sentiment ?? scoreSentiment(input.message).label;
  const toneDelta = tone === "bright" ? 1 : tone === "heavy" ? -1 : 0;

  const interactions = currentState.interactions + 1;
  const score = currentState.score + toneDelta;

  const stage = determineStage(interactions);
  const template = STAGE_TEMPLATES[stage];
  const archetype = deriveArchetype(score);

  const snapshot: PersonalitySnapshot = {
    stage,
    archetype,
    voice: template.voice,
    focus: template.focus,
    affirmations: template.affirmations
  };

  const hint = composeHint(stage, tone, input.message);

  conversationMemoryStore.savePersonality(input.userId, snapshot, score, interactions);

  return {
    snapshot,
    hint,
    interactions,
    score
  };
}

export function trackConversationHistory(
  userId: string | undefined,
  entry: ConversationHistoryItem
): ConversationStateSnapshot {
  return conversationMemoryStore.appendHistory(userId, entry);
}

export function seedConversationHistory(
  userId: string | undefined,
  history: ConversationHistoryItem[]
): ConversationStateSnapshot {
  return conversationMemoryStore.seedHistory(userId, history);
}

export function loadConversationContext(
  userId: string | undefined
): {
  history: ConversationHistoryItem[];
  personality?: PersonalitySnapshot;
  interactions: number;
  score: number;
} {
  const snapshot = conversationMemoryStore.load(userId);
  return {
    history: snapshot.history,
    personality: snapshot.personality,
    interactions: snapshot.interactions,
    score: snapshot.score
  };
}
