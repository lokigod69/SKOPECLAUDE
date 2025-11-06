import type { Request } from "express";

import { resolveAiAdapter } from "./index";
import type {
  AiAdapter,
  ConversationHistoryItem,
  ConversationInput
} from "./types";

const USER_ID_HEADER = "x-user-id";
const USER_PHASE_HEADER = "x-user-phase";
const SESSION_ID_HEADER = "x-session-id";
const CLIENT_VERSION_HEADER = "x-client-version";

function normalizeHeader(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

type ConversationPayload = {
  message: string;
  history?: ConversationHistoryItem[];
};

export function buildConversationInput(
  payload: ConversationPayload,
  req: Request
): ConversationInput {
  const userId = normalizeHeader(req.header(USER_ID_HEADER));
  const phase = normalizeHeader(req.header(USER_PHASE_HEADER));
  const sessionId = normalizeHeader(req.header(SESSION_ID_HEADER));
  const clientVersion = normalizeHeader(req.header(CLIENT_VERSION_HEADER));

  const context: Record<string, unknown> = {};

  if (phase) {
    context.phase = phase.toLowerCase();
  }
  if (sessionId) {
    context.sessionId = sessionId;
  }
  if (clientVersion) {
    context.clientVersion = clientVersion;
  }

  return {
    message: payload.message,
    history: payload.history,
    userId,
    context: Object.keys(context).length > 0 ? context : undefined
  };
}

export function prepareAdapterRequest(
  req: Request,
  payload: ConversationPayload
): {
  adapter: AiAdapter;
  input: ConversationInput;
} {
  const adapter = resolveAiAdapter();
  const input = buildConversationInput(payload, req);
  return { adapter, input };
}
