import { useMemo } from "react";

import type { SentimentTone } from "./palette";
import { getBreathingStops } from "./palette";
import { getTimeOfDay } from "./timeOfDay";

type UseBreathingGradientOptions = {
  sentiment?: SentimentTone;
  date?: Date;
};

type GradientAnimation = {
  style: React.CSSProperties;
  initial: {
    scale: number;
    opacity: number;
    backgroundPosition: string;
  };
  transition: {
    repeat: number;
    repeatType: "mirror";
    duration: number;
    ease: number[];
  };
  animate: {
    scale: number[];
    opacity: number[];
    backgroundPosition: string[];
  };
};

const DEFAULT_SENTIMENT: SentimentTone = "neutral";

export function useBreathingGradient(options: UseBreathingGradientOptions = {}): GradientAnimation {
  const sentiment = options.sentiment ?? DEFAULT_SENTIMENT;

  return useMemo(() => {
    const timeOfDay = getTimeOfDay(options.date);
    const stops = getBreathingStops(timeOfDay, sentiment);

    const gradient = `radial-gradient(circle at 20% 20%, ${stops.inner}, ${stops.outer})`;
    const overlay = `radial-gradient(circle at 75% 30%, transparent 0%, ${stops.accent} 60%, transparent 80%)`;
    const backgroundPosition = "20% 20%, 75% 30%";

    return {
      style: {
        backgroundImage: `${gradient}, ${overlay}`,
        backgroundSize: "160% 160%, 200% 200%"
      },
      initial: {
        scale: 1,
        opacity: 0.95,
        backgroundPosition
      },
      animate: {
        scale: [1, 1.025, 1],
        opacity: [0.95, 1, 0.95],
        backgroundPosition: [backgroundPosition, "30% 30%, 80% 35%", backgroundPosition]
      },
      transition: {
        repeat: Infinity,
        repeatType: "mirror",
        duration: 12,
        ease: [0.42, 0, 0.58, 1]
      }
    };
  }, [options.date?.getTime(), sentiment]);
}
