'use client';

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useRef } from "react";

import { clearPersistedConversation } from "../lib/LocalPersistence";
import { useConversationStore } from "../lib/conversationStore";
import { GoalNode } from "./GoalNode";

const MOTIONS = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

export function ConversationFlow() {
  const {
    history,
    input,
    setInput,
    submit,
    isLoading,
    sentiment,
    error,
    clearError,
    personality,
    personalityHint,
    adapterName,
    goals,
    bootstrap,
    interactWithGoal
  } = useConversationStore((state) => ({
    history: state.history,
    input: state.input,
    setInput: state.setInput,
    submit: state.submit,
    isLoading: state.isLoading,
    sentiment: state.sentiment,
    error: state.error,
    clearError: state.clearError,
    personality: state.personality,
    personalityHint: state.personalityHint,
    adapterName: state.adapterName,
    goals: state.goals,
    bootstrap: state.bootstrap,
    interactWithGoal: state.interactWithGoal
  }));
  const hasBootstrappedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasBootstrappedRef.current) {
      return;
    }
    bootstrap();
    hasBootstrappedRef.current = true;
  }, [bootstrap]);

  useEffect(() => {
    if (hasBootstrappedRef.current && history.length === 0) {
      clearPersistedConversation();
    }
  }, [history.length]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    if (typeof node.scrollTo === "function") {
      node.scrollTo({
        top: node.scrollHeight,
        behavior: "smooth"
      });
    } else {
      node.scrollTop = node.scrollHeight;
    }
  }, [history]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function handleGoalInteraction(goalId: string, action: "complete" | "skip" | "explore") {
    interactWithGoal(goalId, action);
  }

  return (
    <section className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-3xl border border-white/40 bg-white/65 px-6 py-8 shadow-[0_40px_80px_rgba(40,40,80,0.15)] backdrop-blur-2xl transition-all duration-500 ease-out">
      <header className="flex flex-col gap-3 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Phase 0</p>
        <h1 className="text-3xl font-semibold text-slate-900">What brought you here today?</h1>
        <p className="text-sm text-slate-600">
          Breathe with the question. Answer in your own language&mdash;we will listen before we speak.
        </p>
        <AnimatePresence initial={false}>
          {personality ? (
            <motion.div
              key="personality-spotlight"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: [0.17, 0.55, 0.55, 1] }}
              className="mx-auto mt-2 flex max-w-lg flex-col gap-1 rounded-2xl border border-slate-200/70 bg-white/80 px-5 py-4 text-left shadow-[0_30px_60px_rgba(15,23,42,0.12)] backdrop-blur"
            >
              <span className="text-[11px] uppercase tracking-[0.38em] text-slate-400">
                Emerging coach voice
              </span>
              <p className="text-sm font-semibold text-slate-700">
                {personality.archetype} - {personality.stage}
              </p>
              <p className="text-sm text-slate-500">{personalityHint ?? personality.voice}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <div
        ref={scrollRef}
        className="flex max-h-72 min-h-[10rem] flex-col gap-3 overflow-y-auto px-1 pb-1"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {history.map((message) => (
            <motion.div
              key={message.id}
              layout
              variants={MOTIONS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md transition ${
                message.role === "user"
                  ? "ml-auto bg-slate-900 text-slate-50"
                  : message.role === "assistant"
                    ? "mr-auto bg-white/90 text-slate-800 shadow-slate-900/10"
                    : "mx-auto bg-amber-100 text-amber-800 shadow-amber-900/15"
              }`}
            >
              <span>{message.content}</span>
              {message.sentiment ? (
                <span className="mt-2 block text-[10px] uppercase tracking-[0.28em] text-slate-400">
                  Tone - {message.sentiment}
                </span>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading ? (
          <motion.div
            layout
            key="breathing-indicator"
            className="mx-auto flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
          >
            <span className="inline-flex h-2 w-2 items-center justify-center rounded-full bg-slate-400" />
            Listening
          </motion.div>
        ) : null}
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-3 text-left">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Your words
          </span>
          <textarea
            value={input}
            onChange={(event) => {
              if (error) {
                clearError();
              }
              setInput(event.target.value);
            }}
            placeholder="Tell me where you are in this moment..."
            className="min-h-[120px] rounded-2xl border border-slate-300/40 bg-white/70 px-4 py-3 text-base text-slate-800 shadow-inner shadow-slate-900/5 outline-none transition focus:border-slate-400 focus:shadow-[0_0_0_3px_rgba(148,163,184,0.18)]"
          />
        </label>

        {error ? (
          <motion.p
            key="error-message"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2 text-xs font-medium text-rose-700 shadow-sm"
          >
            {error}
          </motion.p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.28em] text-slate-400">
          <span>
            Sentiment - <span className="font-semibold text-slate-500">{sentiment}</span>
          </span>
          {adapterName ? (
            <span className="text-[10px] uppercase tracking-[0.3em] text-slate-300">
              Adapter - {adapterName}
            </span>
          ) : null}
          <button
            type="submit"
            disabled={isLoading || input.trim().length === 0}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold tracking-[0.2em] text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700/50 disabled:text-slate-400"
          >
            {isLoading ? "Listening..." : "Share"}
          </button>
        </div>
      </form>

      {goals.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8">
          {goals.map((goal) => (
            <GoalNode key={goal.id} goal={goal} onInteract={(action) => handleGoalInteraction(goal.id, action)} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
