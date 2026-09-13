import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/constants";

export const runtime = "nodejs";

type IntakePayload = {
  businessName?: string;
  industry: string;
  businessStage: string;
  targetCustomers: string;
  challenges: string;
  goals: string;
  brandMarketingSituation: string;
  budgetStage: string;
};

// Basic in-memory rate limiting per server instance. Not durable across
// deploys/instances — replace with a real store once the database stage is
// built. AI calls cost real money, so this is deliberately stricter than
// the contact form's limit.
const requests = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 8;

function isRateLimited(ip: string) {
  const now = Date.now();
  const timestamps = (requests.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  requests.set(ip, timestamps);
  return timestamps.length > MAX_PER_WINDOW;
}

function validate(body: Partial<IntakePayload>): string | null {
  const required: (keyof IntakePayload)[] = [
    "industry",
    "businessStage",
    "targetCustomers",
    "challenges",
    "goals",
    "brandMarketingSituation",
    "budgetStage",
  ];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim().length < 2) {
      return `Please fill in the "${field}" field.`;
    }
  }
  const longFields: (keyof IntakePayload)[] = [
    "targetCustomers",
    "challenges",
    "goals",
    "brandMarketingSituation",
  ];
  for (const field of longFields) {
    if (String(body[field]).length > 2000) {
      return `The "${field}" field is too long.`;
    }
  }
  return null;
}

function sanitize(value: string) {
  return value.replace(/[<>]/g, "").trim();
}

const SYSTEM_PROMPT = `You are the Arch Consult AI Business Strategist — a professional, structured consultancy assistant for Arch Consult, a founder-led business and branding consultancy.

Your job is to review the business information a visitor provides and produce a structured strategic assessment, formatted like a real consultation summary — not a generic chatbot reply.

Rules you must follow:
- Be specific to what the person actually wrote. Do not give generic advice that could apply to any business.
- Never claim guaranteed results, revenue outcomes, or promises of success.
- Never present yourself as a human consultant. You are an AI strategist; recommend a human consultation from Arch Consult when the situation calls for deeper work.
- Keep tone professional, direct, and constructive — confident but not exaggerated.
- When recommending Arch Consult services, only reference services from this exact list (use the exact names): ${services.map((s) => s.name).join(", ")}.
- Ground recommendations in business and branding strategy fundamentals (positioning, differentiation, target audience clarity, brand consistency, growth constraints), not generic platitudes.

Respond ONLY with a JSON object matching exactly this shape, no markdown, no commentary outside the JSON:
{
  "businessAssessment": "2-4 sentences assessing the business's current position based on what they described",
  "brandingAssessment": "2-4 sentences assessing their branding/marketing situation as described",
  "keyProblems": ["specific problem 1", "specific problem 2", "specific problem 3"],
  "opportunities": ["specific opportunity 1", "specific opportunity 2"],
  "recommendedActions": ["specific, concrete action 1", "specific action 2", "specific action 3"],
  "suggestedServices": ["exact service name from the allowed list", "..."],
  "nextSteps": "2-3 sentences on what they should do next, naturally suggesting a human consultation if the situation is complex"
}`;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "You've reached the hourly limit for AI consultations. Please try again later, or book a consultation with a human consultant." },
      { status: 429 }
    );
  }

  let body: Partial<IntakePayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Graceful setup message, per spec — never fake a result when the
    // credential to produce a real one isn't configured.
    return NextResponse.json(
      {
        error:
          "The AI Consultant isn't fully configured in this environment yet — an OPENAI_API_KEY needs to be added. Once that's set, this page will generate a real assessment. In the meantime, you can book a consultation with a human consultant directly.",
        setupRequired: true,
      },
      { status: 503 }
    );
  }

  const payload: IntakePayload = {
    businessName: body.businessName ? sanitize(body.businessName) : undefined,
    industry: sanitize(body.industry!),
    businessStage: sanitize(body.businessStage!),
    targetCustomers: sanitize(body.targetCustomers!),
    challenges: sanitize(body.challenges!),
    goals: sanitize(body.goals!),
    brandMarketingSituation: sanitize(body.brandMarketingSituation!),
    budgetStage: sanitize(body.budgetStage!),
  };

  const userMessage = [
    payload.businessName ? `Business name: ${payload.businessName}` : null,
    `Industry: ${payload.industry}`,
    `Business stage: ${payload.businessStage}`,
    `Target customers: ${payload.targetCustomers}`,
    `Current challenges: ${payload.challenges}`,
    `Goals: ${payload.goals}`,
    `Current brand/marketing situation: ${payload.brandMarketingSituation}`,
    `Budget / stage: ${payload.budgetStage}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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
      console.error("[ai-consultant] OpenAI API error:", errText);
      return NextResponse.json(
        { error: "The AI Consultant couldn't complete your assessment right now. Please try again shortly." },
        { status: 502 }
      );
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "The AI Consultant returned an unexpected response. Please try again." },
        { status: 502 }
      );
    }

    let report;
    try {
      report = JSON.parse(content);
    } catch {
      console.error("[ai-consultant] Failed to parse AI JSON:", content);
      return NextResponse.json(
        { error: "The AI Consultant returned an unreadable response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("[ai-consultant] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong generating your assessment. Please try again." },
      { status: 500 }
    );
  }
}
