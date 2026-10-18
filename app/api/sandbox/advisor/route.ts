import { NextRequest, NextResponse } from "next/server";
import { prepareAdvisorRequest } from "@/lib/sandbox/advisor";
import { SIMULATION_DISCLAIMER } from "@/lib/sandbox/types";

export const runtime = "nodejs";

// Simple per-IP limit. Stage 5 replaces this with per-account limits.
const requests = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 25;

function isRateLimited(ip: string) {
  const now = Date.now();
  const timestamps = (requests.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  requests.set(ip, timestamps);
  return timestamps.length > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "You've reached the hourly limit for advisor questions. Please try again later." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const prepared = prepareAdvisorRequest(body);
    if (!prepared.ok) {
      return NextResponse.json({ error: prepared.error }, { status: prepared.status });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const provider = openaiKey
      ? { apiKey: openaiKey, baseUrl: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" }
      : groqKey
        ? { apiKey: groqKey, baseUrl: "https://api.groq.com/openai/v1/chat/completions", model: "openai/gpt-oss-120b" }
        : null;

    if (!provider) {
      return NextResponse.json(
        { error: "The advisor isn't configured yet in this environment.", setupRequired: true },
        { status: 503 }
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    let aiRes: Response;
    try {
      aiRes = await fetch(provider.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
        body: JSON.stringify({ model: provider.model, temperature: 0.3, messages: prepared.messages }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!aiRes.ok) {
      console.error("[sandbox-advisor] AI provider error:", await aiRes.text());
      return NextResponse.json({ error: "The advisor couldn't answer right now. Please try again shortly." }, { status: 502 });
    }

    const data = await aiRes.json();
    const answer = data.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      return NextResponse.json({ error: "Unexpected response. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, answer: answer.trim(), disclaimer: SIMULATION_DISCLAIMER });
  } catch (err) {
    console.error("[sandbox-advisor] Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
