import type { ConversationMessage, GoalNodeData } from "./conversationTypes";

const DESIRE_MARKERS = ["want", "wish", "need", "struggling", "longing", "dream", "hope"];
const ACTION_TEMPLATES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bi want to\b/i, replacement: "" },
  { pattern: /\bi want\b/i, replacement: "" },
  { pattern: /\bi wish i could\b/i, replacement: "" },
  { pattern: /\bi wish\b/i, replacement: "" },
  { pattern: /\bi need to\b/i, replacement: "" },
  { pattern: /\bi need\b/i, replacement: "" },
  { pattern: /\bi'm struggling to\b/i, replacement: "Practice " },
  { pattern: /\bi'm struggling with\b/i, replacement: "Care for " },
  { pattern: /\bi hope to\b/i, replacement: "" }
];

function isDesireMessage(message: ConversationMessage): boolean {
  if (message.role !== "user") return false;
  const content = message.content.toLowerCase();
  return DESIRE_MARKERS.some((marker) => content.includes(marker));
}

function transformToActionable(raw: string): string {
  let transformed = raw.trim();
  for (const { pattern, replacement } of ACTION_TEMPLATES) {
    transformed = transformed.replace(pattern, replacement).trim();
  }

  if (!transformed) {
    return "Explore this desire";
  }

  // Add gentle leading verb if sentence starts abruptly
  if (/^[a-z]/.test(transformed)) {
    transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
  }

  if (!/[.!?]$/.test(transformed)) {
    transformed = `${transformed}.`;
  }

  return transformed;
}

export function extractPotentialGoals(history: ConversationMessage[]): GoalNodeData[] {
  if (history.length < 6) {
    return [];
  }

  const desires = history.filter(isDesireMessage);
  if (desires.length === 0) {
    return [];
  }

  return desires.slice(-3).map((entry) => ({
    id: entry.id,
    raw: entry.content,
    text: transformToActionable(entry.content),
    state: "dormant" as const,
    engagement: 0
  }));
}

