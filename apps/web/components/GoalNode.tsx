import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import type { GoalNodeData } from "../lib/conversationTypes";

const stateStyles: Record<
  GoalNodeData["state"],
  {
    base: { opacity: number; scale: number };
    glow: string | string[];
  }
> = {
  dormant: { base: { opacity: 0.3, scale: 0.8 }, glow: "0 0 8px rgba(148, 163, 184, 0.2)" },
  suggested: { base: { opacity: 0.6, scale: 0.9 }, glow: "0 0 12px rgba(94, 234, 212, 0.4)" },
  active: {
    base: { opacity: 1, scale: 1 },
    glow: ["0 0 18px rgba(79, 70, 229, 0.35)", "0 0 28px rgba(94, 234, 212, 0.45)"]
  },
  crystallizing: {
    base: { opacity: 0.8, scale: 0.95 },
    glow: "0 0 14px rgba(192, 132, 252, 0.4)"
  },
  integrated: { base: { opacity: 0.4, scale: 0.7 }, glow: "0 0 6px rgba(148, 163, 184, 0.2)" }
};

type GoalNodeProps = {
  goal: GoalNodeData;
  onInteract: (action: "complete" | "skip" | "explore") => void;
};

export function GoalNode({ goal, onInteract }: GoalNodeProps) {
  const [isBloom, setIsBloom] = useState(false);

  const palette = stateStyles[goal.state];

  return (
    <motion.div
      className="relative"
      animate={palette.base}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      onClick={() => setIsBloom((prev) => !prev)}
    >
      <motion.div
        className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-500 text-center shadow-lg"
        animate={{
          boxShadow: palette.glow
        }}
        transition={{ duration: 2.4, repeat: Infinity, repeatType: "reverse" }}
      >
        <span className="px-4 text-sm font-medium text-white/90">
          {goal.text.length > 24 ? `${goal.text.slice(0, 21)}…` : goal.text}
        </span>
      </motion.div>

      <AnimatePresence>
        {isBloom && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute left-1/2 top-full z-10 mt-3 w-44 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-2 text-xs font-medium text-slate-600">
              <button
                className="rounded-xl bg-emerald-500/10 px-3 py-2 text-emerald-600 transition hover:bg-emerald-500/20"
                onClick={() => onInteract("complete")}
              >
                ✓ Kept the promise
              </button>
              <button
                className="rounded-xl bg-indigo-500/10 px-3 py-2 text-indigo-600 transition hover:bg-indigo-500/20"
                onClick={() => onInteract("explore")}
              >
                ? Sit with it
              </button>
              <button
                className="rounded-xl bg-rose-500/10 px-3 py-2 text-rose-600 transition hover:bg-rose-500/20"
                onClick={() => onInteract("skip")}
              >
                → Not today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

