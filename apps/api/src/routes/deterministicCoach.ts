type SentimentTone = "bright" | "neutral" | "heavy";

const POSITIVE_MARKERS = [
  "good",
  "great",
  "grateful",
  "excited",
  "hopeful",
  "energized",
  "joy",
  "ready",
  "proud",
  "calm"
];

const HEAVY_MARKERS = [
  "tired",
  "stuck",
  "lost",
  "sad",
  "overwhelmed",
  "anxious",
  "worried",
  "afraid",
  "lonely",
  "burned out"
];

const QUESTION_MARKERS = ["?", "what now", "how do i", "where do i start", "idk", "i don't know"];

type ScriptedResponse = {
  reply: string;
  sentiment: {
    label: SentimentTone;
    confidence: number;
  };
};

export function scoreSentiment(message: string): { label: SentimentTone; confidence: number } {
  const normalized = message.toLowerCase();
  let score = 0;

  for (const word of POSITIVE_MARKERS) {
    if (normalized.includes(word)) {
      score += 1;
    }
  }

  for (const word of HEAVY_MARKERS) {
    if (normalized.includes(word)) {
      score -= 1;
    }
  }

  const label: SentimentTone = score > 0 ? "bright" : score < 0 ? "heavy" : "neutral";
  const confidence = Math.min(Math.abs(score) / 3, 0.85);

  return { label, confidence };
}

export function hasQuestion(message: string): boolean {
  const normalized = message.toLowerCase();
  return QUESTION_MARKERS.some((marker) => normalized.includes(marker));
}

export function focusSnippet(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) {
    return null;
  }

  const sentences = trimmed
    .split(/[.!?]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const first = sentences[0];
  if (!first) {
    return null;
  }

  const words = first.split(/\s+/);
  const preview = words.slice(0, 12).join(" ");
  return preview.length < first.length ? `${preview}...` : preview;
}

export function scriptedConversation(message: string): ScriptedResponse {
  const sentiment = scoreSentiment(message);
  const snippet = focusSnippet(message);
  const question = hasQuestion(message);

  const opening =
    sentiment.label === "bright"
      ? "I can feel the spark in what you shared."
      : sentiment.label === "heavy"
        ? "I'm sensing some weight in this moment."
        : "Thanks for coming as you are right now.";

  const reflection = snippet ? ` "${snippet}"` : "";

  let prompt: string;
  if (sentiment.label === "bright") {
    prompt = "What's one small move you want to protect while that energy is here?";
  } else if (sentiment.label === "heavy") {
    prompt = question
      ? "Let's not rush it - what would a 2% gentler next step look like?"
      : "Take a breath with me. What feels like the kindest next step you could take?";
  } else {
    prompt = question
      ? "Let's explore it slowly - what detail feels important to examine first?"
      : "Where should we shine the light together right now?";
  }

  return {
    reply: `${opening}${reflection} ${prompt}`.trim(),
    sentiment: {
      label: sentiment.label,
      confidence: sentiment.confidence
    }
  };
}
