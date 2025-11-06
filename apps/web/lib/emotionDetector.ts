import type { SentimentTone } from "./palette";

export type EmotionSignal = {
  tone: SentimentTone;
  confidence: number;
  matches: {
    bright: string[];
    heavy: string[];
  };
};

const BRIGHT_CUES = [
  "joy",
  "excited",
  "hopeful",
  "grateful",
  "good",
  "great",
  "light",
  "calm",
  "energized",
  "ready",
  "proud"
];

const HEAVY_CUES = [
  "stuck",
  "tired",
  "sad",
  "lost",
  "afraid",
  "anxious",
  "lonely",
  "worried",
  "overwhelmed",
  "burned",
  "heavy",
  "guilty",
  "angry"
];

function collectMatches(message: string, cues: string[]): string[] {
  const results: string[] = [];
  for (const cue of cues) {
    if (message.includes(cue)) {
      results.push(cue);
    }
  }
  return results;
}

export function detectEmotion(message: string): EmotionSignal {
  const normalized = message.toLowerCase();
  const brightMatches = collectMatches(normalized, BRIGHT_CUES);
  const heavyMatches = collectMatches(normalized, HEAVY_CUES);

  let score = 0;
  score += brightMatches.length * 0.7;
  score -= heavyMatches.length * 0.75;

  const tone: SentimentTone = score > 0.6 ? "bright" : score < -0.6 ? "heavy" : "neutral";
  const magnitude = Math.min(Math.abs(score), 2.4);
  const confidence = Number((magnitude / 2.4).toFixed(2));

  return {
    tone,
    confidence,
    matches: {
      bright: brightMatches,
      heavy: heavyMatches
    }
  };
}

