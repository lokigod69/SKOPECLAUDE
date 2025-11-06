import express from "express";
import request from "supertest";

import { router } from "./index";
import { resetPersonalityStore } from "../personality/engine";

describe("POST /api/conversation", () => {
  const app = express().use(express.json()).use("/api", router);
  const originalAdapter = process.env.AI_ADAPTER;

  beforeEach(() => {
    delete process.env.AI_ADAPTER;
    resetPersonalityStore();
  });

  afterEach(() => {
    if (typeof originalAdapter === "string") {
      process.env.AI_ADAPTER = originalAdapter;
    } else {
      delete process.env.AI_ADAPTER;
    }
  });

  it("rejects invalid payload", async () => {
    const response = await request(app).post("/api/conversation").send({});
    expect(response.status).toBe(400);
  });

  it("returns a scripted neutral reply with personality meta", async () => {
    const response = await request(app)
      .post("/api/conversation")
      .send({ message: "hello" });

    expect(response.status).toBe(200);
    expect(response.body.reply).toMatch(/thanks for coming/i);
    expect(response.body.sentiment.label).toBe("neutral");
    expect(response.body.meta.adapter).toBe("deterministic");
    expect(response.body.meta.personality.stage).toBe("discovering");
    expect(response.body.meta.personalityHint).toMatch(/curious|collect/i);
  });

  it("infers bright sentiment from positive cues", async () => {
    const response = await request(app)
      .post("/api/conversation")
      .send({ message: "I feel hopeful and grateful today" });

    expect(response.status).toBe(200);
    expect(response.body.sentiment.label).toBe("bright");
    expect(response.body.sentiment.confidence).toBeGreaterThan(0);
    expect(response.body.reply).toMatch(/spark/i);
    expect(response.body.meta.adapter).toBe("deterministic");
    expect(response.body.meta.personality.archetype).toBeDefined();
  });

  it("softens the tone for heavy messages with questions and updates personality", async () => {
    const response = await request(app)
      .post("/api/conversation")
      .send({ message: "I'm stuck and anxious. what now?" });

    expect(response.status).toBe(200);
    expect(response.body.sentiment.label).toBe("heavy");
    expect(response.body.reply).toMatch(/not rush it/i);
    expect(response.body.meta.personalityHint).toMatch(/step|momentum/i);
  });

  it("routes requests through the mock-openai adapter when selected", async () => {
    process.env.AI_ADAPTER = "mock-openai";
    const response = await request(app)
      .post("/api/conversation")
      .set("x-user-id", "user-42")
      .set("x-user-phase", "Integration")
      .send({
        message: "I'm calm but unsure, what now?",
        history: [{ role: "user", content: "Unsure yesterday", sentiment: "neutral" }]
      });

    expect(response.status).toBe(200);
    expect(response.body.meta.adapter).toBe("mock-openai");
    expect(response.body.meta.phase).toBe("integration");
    expect(response.body.meta.personality.stage).toBeDefined();
    expect(response.body.reply).toMatch(/momentum|take pressure off|holding/i);
  });

  it("persists history between requests for the same user", async () => {
    const userId = "user-history";

    await request(app)
      .post("/api/conversation")
      .set("x-user-id", userId)
      .send({ message: "First hello" });

    const response = await request(app)
      .post("/api/conversation")
      .set("x-user-id", userId)
      .send({ message: "Second reflection" });

    expect(response.status).toBe(200);
    expect(response.body.meta.personality.stage).toBeDefined();
    expect(response.body.meta.adapter).toBe("deterministic");
    expect(response.body.meta.historySize).toBeGreaterThanOrEqual(3);
  });
});
