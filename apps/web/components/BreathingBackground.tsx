'use client';

import { motion, useReducedMotion } from "framer-motion";

import type { SentimentTone } from "../lib/palette";
import { useBreathingGradient } from "../lib/useBreathingGradient";
import { useConversationStore } from "../lib/conversationStore";

type BreathingBackgroundProps = {
  sentiment?: SentimentTone;
};

export function BreathingBackground({ sentiment }: BreathingBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();
  const storeSentiment = useConversationStore((state) => state.sentiment);
  const tone = sentiment ?? storeSentiment;
  const { animate, transition, style, initial } = useBreathingGradient({ sentiment: tone });

  const motionAnimate = prefersReducedMotion
    ? {
        scale: initial.scale,
        opacity: initial.opacity,
        backgroundPosition: initial.backgroundPosition
      }
    : animate;
  const motionTransition = prefersReducedMotion ? { duration: 0 } : transition;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full blur-[0px]"
      initial={initial}
      style={style}
      animate={motionAnimate}
      transition={motionTransition}
    />
  );
}
