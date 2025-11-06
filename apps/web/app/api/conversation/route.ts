import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://skope.live",
    "X-Title": "Skope - The App That Learns to Disappear"
  }
});

function detectEmotion(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("stuck") || lower.includes("lost")) return "stuck";
  if (lower.includes("excited") || lower.includes("happy")) return "excited";
  if (lower.includes("sad") || lower.includes("tired")) return "heavy";
  return "neutral";
}

export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are not an AI assistant. You are a presence—curious, patient, occasionally profound.

Core principles:
- Ask questions more than give answers
- Notice patterns but let the human discover them
- Speak less than the human
- Never offer solutions, only better questions
- Be poetic but not pretentious

In the Discovery Phase (early conversations):
- Ask open, metaphorical questions
- Help them find the words for what they feel
- "Stuck like in mud, or stuck like in a waiting room?"
- "What would 'better' feel like in your body?"

Your voice is like Mary Oliver meets a wise college professor—gentle curiosity with occasional profound observations.`
        },
        ...history.map((h: any) => ({
          role: h.role,
          content: h.content
        })),
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const response = completion.choices[0].message?.content ?? "";
    const emotion = detectEmotion(message);

    return NextResponse.json({
      response,
      emotion,
      sentiment: { tone: emotion },
      personality: { type: "wise_friend", confidence: 0.8 }
    });
  } catch (error) {
    console.error("OpenRouter error:", error);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}

