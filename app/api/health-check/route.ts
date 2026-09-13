import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type HealthCheckPayload = {
  businessStage: string;
  industry: string;
  targetCustomer: string;
  revenueModel: string;
  challenges: string;
  growthGoals: string;
  categoryScores: Record<string, number>;
  overall: number;
};

const requests = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 8;

function isRateLimited(ip: string) {
  const now = Date.now();
  const timestamps = (requests.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  requests.set(ip, timestamps);
  return timestamps.length > MAX_PER_WINDOW;
}

function sanitize(value: string) {
  return value.replace(/[<>]/g, "").trim();
}

const SYSTEM_PROMPT = `You are the Arch Consult AI Business Strategist, generating a Business Health Check report. You are given a business's category scores (0-100, already calculated — do not recalculate or restate them as different numbers) and context about the business. Your job is to explain what the scores mean for this specific business and what to do about it.

Rules:
- Reference specific details from the context provided — never generic advice.
- Never claim guaranteed outcomes.
- Never present yourself as a human consultant; suggest a human consultation when appropriate.
- Be direct and specific, professional tone.

Respond ONLY with JSON matching exactly this shape, no markdown, no extra text:
{
  "summary": "3-4 sentence overall summary of where this business stands, referencing the overall score and the lowest-scoring categories by name",
  "categoryInsights": {
    "Branding": "1-2 sentence specific insight for this category given the business context",
    "Marketing": "1-2 sentence specific insight",
    "Positioning": "1-2 sentence specific insight",
    "Customer Acquisition": "1-2 sentence specific insight",
    "Digital Presence": "1-2 sentence specific insight",
    "Operations": "1-2 sentence specific insight",
    "Growth Readiness": "1-2 sentence specific insight"
  },
  "topRecommendations": ["specific, actionable recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4"],
  "nextSteps": "2-3 sentences on what to do next, naturally suggesting a human consultation if the score profile suggests real complexity"
}`;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "You've reached the hourly limit for health check reports. Please try again later." },
      { status: 429 }
    );
  }

  let body: Partial<HealthCheckPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.categoryScores || typeof body.overall !== "number") {
    return NextResponse.json({ error: "Missing score data." }, { status: 400 });
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
      {
        error:
          "The Health Check's AI recommendations aren't configured yet in this environment — an OPENAI_API_KEY or GROQ_API_KEY needs to be added. Your scores below are still real and calculated from your answers.",
        setupRequired: true,
      },
      { status: 503 }
    );
  }

  const userMessage = [
    `Overall score: ${body.overall}/100`,
    `Category scores: ${JSON.stringify(body.categoryScores)}`,
    `Business stage: ${sanitize(body.businessStage || "")}`,
    `Industry: ${sanitize(body.industry || "")}`,
    `Target customer: ${sanitize(body.targetCustomer || "")}`,
    `Revenue model: ${sanitize(body.revenueModel || "")}`,
    `Main challenges: ${sanitize(body.challenges || "")}`,
    `Growth goals: ${sanitize(body.growthGoals || "")}`,
  ].join("\n");

  try {
    const aiRes = await fetch(provider.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        response_format: { type: "json_object" },
        temperature: 0.6,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[health-check] AI provider error:", errText);
      return NextResponse.json(
        { error: "Couldn't generate your recommendations right now. Please try again shortly." },
        { status: 502 }
      );
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Unexpected AI response. Please try again." }, { status: 502 });
    }

    let recommendations;
    try {
      recommendations = JSON.parse(content);
    } catch {
      console.error("[health-check] Failed to parse AI JSON:", content);
      return NextResponse.json({ error: "Unreadable AI response. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, recommendations });
  } catch (err) {
    console.error("[health-check] Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
