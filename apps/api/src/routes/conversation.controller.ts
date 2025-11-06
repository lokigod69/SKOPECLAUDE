import type { Request, Response } from "express";
import { z } from "zod";

import { prepareAdapterRequest } from "../ai/factory";
import type { ConversationHistoryItem } from "../ai/types";
import {
  computePersonality,
  loadConversationContext,
  seedConversationHistory,
  trackConversationHistory
} from "../personality/engine";
import { scoreSentiment } from "./deterministicCoach";

const historyItemSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "History message requires content"),
  sentiment: z.enum(["bright", "neutral", "heavy"]).optional(),
  createdAt: z.string().optional()
});

const requestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  history: z.array(historyItemSchema).max(12).optional()
});

const conversationController = {
  async create(req: Request, res: Response) {
    const parseResult = requestSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: "invalid_request",
        details: parseResult.error.flatten()
      });
    }

    const { message, history } = parseResult.data as {
      message: string;
      history?: ConversationHistoryItem[];
    };

    const { adapter, input } = prepareAdapterRequest(req, { message, history });
    const existingContext = loadConversationContext(input.userId);

    if (!existingContext.history.length && history?.length) {
      seedConversationHistory(input.userId, history);
    }

    const sentimentSignal = scoreSentiment(message);

    const userEntry = {
      role: "user" as const,
      content: message,
      sentiment: sentimentSignal.label,
      createdAt: new Date().toISOString()
    };
    const userState = trackConversationHistory(input.userId, userEntry);

    const personality = computePersonality({
      userId: input.userId,
      message,
      history: userState.history,
      sentiment: sentimentSignal.label
    });

    const response = await adapter.generate({
      ...input,
      history: userState.history,
      personality: personality.snapshot
    });

    const assistantState = trackConversationHistory(input.userId, {
      role: "assistant",
      content: response.reply,
      sentiment: response.sentiment?.label,
      createdAt: new Date().toISOString()
    });

    const finalContext = assistantState ?? loadConversationContext(input.userId);

    const meta = {
      adapter: response.meta?.adapter ?? adapter.name,
      ...response.meta,
      personality: personality.snapshot,
      personalityHint: personality.hint,
      historySize: finalContext.history.length
    };

    return res.status(200).json({
      ...response,
      meta
    });
  }
};

export { conversationController };
