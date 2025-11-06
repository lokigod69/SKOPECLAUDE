import type { TimeOfDay } from "./timeOfDay";

export type SentimentTone = "bright" | "neutral" | "heavy";

type GradientStops = {
  inner: string;
  outer: string;
  accent: string;
};

type BreathingPalette = Record<TimeOfDay, Record<SentimentTone, GradientStops>>;

export const breathingPalette: BreathingPalette = {
  dawn: {
    bright: {
      inner: "hsl(23 100% 95%)",
      outer: "hsl(330 90% 90%)",
      accent: "hsla(23 85% 65% / 0.45)"
    },
    neutral: {
      inner: "hsl(23 85% 92%)",
      outer: "hsl(268 83% 90%)",
      accent: "hsla(200 80% 70% / 0.35)"
    },
    heavy: {
      inner: "hsl(210 60% 85%)",
      outer: "hsl(260 60% 78%)",
      accent: "hsla(210 65% 55% / 0.4)"
    }
  },
  day: {
    bright: {
      inner: "hsl(180 95% 94%)",
      outer: "hsl(210 85% 86%)",
      accent: "hsla(180 95% 65% / 0.35)"
    },
    neutral: {
      inner: "hsl(200 92% 92%)",
      outer: "hsl(210 72% 80%)",
      accent: "hsla(200 80% 60% / 0.4)"
    },
    heavy: {
      inner: "hsl(201 55% 86%)",
      outer: "hsl(210 50% 70%)",
      accent: "hsla(200 55% 55% / 0.45)"
    }
  },
  dusk: {
    bright: {
      inner: "hsl(280 85% 92%)",
      outer: "hsl(330 80% 85%)",
      accent: "hsla(300 75% 65% / 0.38)"
    },
    neutral: {
      inner: "hsl(268 80% 88%)",
      outer: "hsl(300 68% 78%)",
      accent: "hsla(268 62% 60% / 0.4)"
    },
    heavy: {
      inner: "hsl(250 58% 78%)",
      outer: "hsl(268 48% 68%)",
      accent: "hsla(250 45% 55% / 0.42)"
    }
  },
  night: {
    bright: {
      inner: "hsl(230 56% 22%)",
      outer: "hsl(260 35% 20%)",
      accent: "hsla(210 85% 60% / 0.35)"
    },
    neutral: {
      inner: "hsl(235 60% 18%)",
      outer: "hsl(240 42% 15%)",
      accent: "hsla(220 55% 45% / 0.35)"
    },
    heavy: {
      inner: "hsl(220 45% 16%)",
      outer: "hsl(240 35% 12%)",
      accent: "hsla(220 60% 35% / 0.45)"
    }
  }
};

export function getBreathingStops(timeOfDay: TimeOfDay, sentiment: SentimentTone): GradientStops {
  return breathingPalette[timeOfDay][sentiment];
}
