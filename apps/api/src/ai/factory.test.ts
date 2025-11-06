import type { Request } from "express";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildConversationInput, prepareAdapterRequest } from "./factory";

function createRequest(headers: Record<string, string> = {}): Request {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );

  return {
    header(name: string) {
      return normalized[name.toLowerCase()] ?? undefined;
    }
  } as unknown as Request;
}

describe("AI adapter factory", () => {
  const originalAdapter = process.env.AI_ADAPTER;

  afterEach(() => {
    process.env.AI_ADAPTER = originalAdapter;
  });

  it("builds conversation input with normalized context and history", () => {
    const req = createRequest({
      "x-user-id": " user-123 ",
      "x-user-phase": "Dance",
      "x-session-id": " session-789 ",
      "x-client-version": "1.2.3"
    });

    const input = buildConversationInput(
      {
        message: "Hello",
        history: [{ role: "user", content: "hello", sentiment: "neutral" }]
      },
      req
    );

    expect(input.userId).toBe("user-123");
    expect(input.history).toHaveLength(1);
    expect(input.context).toMatchObject({
      phase: "dance",
      sessionId: "session-789",
      clientVersion: "1.2.3"
    });
  });

  it("selects requested adapter when preparing", () => {
    process.env.AI_ADAPTER = "mock-openai";
    const req = createRequest();
    const { adapter, input } = prepareAdapterRequest(req, {
      message: "Testing the adapter.",
      history: []
    });

    expect(adapter.name).toBe("mock-openai");
    expect(input.message).toBe("Testing the adapter.");
    expect(input.history).toEqual([]);
  });
});
