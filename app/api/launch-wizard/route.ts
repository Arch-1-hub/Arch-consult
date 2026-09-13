import { NextRequest, NextResponse } from "next/server";
import { services } from "@/lib/constants";

export const runtime = "nodejs";

type LaunchPayload = {
  businessIdea: string;
  industry: string;
  location: string;
  targetCustomers: string;
  problem: string;
  productService: string;
  pricing: string;
  competitors: string;
  goals: string;
  resources: string;
};

const requests = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 6;

function isRateLimited(ip: string) {
  const now = Date.now();
  const timestamps = (requests.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  requests.set(ip, timestamps);
  return timestamps.length > MAX_PER_WINDOW;
}

function validate(body: Partial<LaunchPayload>): string | null {
  const required: (keyof LaunchPayload)[] = [
    "businessIdea",
    "industry",
    "location",
    "targetCustomers",
    "problem",
    "productService",
    "pricing",
    "goals",
  ];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim().length < 2) {
      return `Please fill in the "${field}" field.`;
    }
  }
  return null;
}

function sanitize(value: string) {
  return value.replace(/[<>]/g, "").trim();
}

const SYSTEM_PROMPT = `You are the Arch Consult AI Business Strategist, generating a Business Launch Plan for someone starting a business. You are given their idea, industry, location, target customers, the problem they're solving, their product/service, pricing, competitors, goals, and available resources.

Rules:
- Ground everything in the specific details given — never generic startup advice.
- Never claim guaranteed outcomes or promise success.
- Never present yourself as a human consultant; suggest a human consultation when the plan reveals real complexity.
- When suggesting Arch Consult services, only reference these exact names: ${services.map((s) => s.name).join(", ")}.
- Be specific and practical — a founder should be able to act on this immediately.

Respond ONLY with JSON matching exactly this shape, no markdown, no extra text:
{
  "businessConceptSummary": "3-4 sentences summarizing the business concept clearly, based on what they described",
  "targetAudience": "2-3 sentences describing the target audience specifically",
  "valueProposition": "1-2 sentences: what specific value this offers that alternatives don't",
  "positioning": "2-3 sentences on how this business should be positioned in its market",
  "brandPersonality": "2-3 adjectives with a short explanation of the brand personality that fits this business",
  "brandNamingSuggestions": ["name suggestion 1", "name suggestion 2", "name suggestion 3"],
  "revenueModel": "2-3 sentences on how this business should structure pricing/revenue given what they described",
  "marketingStrategy": "3-4 sentences on the marketing approach that fits this specific business and budget/resources",
  "customerAcquisitionStrategy": "2-3 sentences on how to get the first customers specifically",
  "launchRoadmap": "3-4 sentences summarizing the overall path from here to launch",
  "swot": {
    "strengths": ["specific strength 1", "strength 2"],
    "weaknesses": ["specific weakness 1", "weakness 2"],
    "opportunities": ["specific opportunity 1", "opportunity 2"],
    "threats": ["specific threat 1", "threat 2"]
  },
  "actionPlan": {
    "thirtyDays": ["specific action 1", "action 2", "action 3"],
    "sixtyDays": ["specific action 1", "action 2", "action 3"],
    "ninetyDays": ["specific action 1", "action 2", "action 3"]
  },
  "suggestedServices": ["exact service name from the allowed list", "..."]
}`;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "You've reached the hourly limit for launch plans. Please try again later, or book a consultation directly." },
      { status: 429 }
    );
  }

  let body: Partial<LaunchPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
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
          "The Business Launch Wizard isn't fully configured in this environment yet — an OPENAI_API_KEY or GROQ_API_KEY needs to be added. In the meantime, you can book a consultation with a human consultant directly.",
        setupRequired: true,
      },
      { status: 503 }
    );
  }

  const payload: LaunchPayload = {
    businessIdea: sanitize(body.businessIdea!),
    industry: sanitize(body.industry!),
    location: sanitize(body.location!),
    targetCustomers: sanitize(body.targetCustomers!),
    problem: sanitize(body.problem!),
    productService: sanitize(body.productService!),
    pricing: sanitize(body.pricing!),
    competitors: body.competitors ? sanitize(body.competitors) : "Not specified",
    goals: sanitize(body.goals!),
    resources: body.resources ? sanitize(body.resources) : "Not specified",
  };

  const userMessage = [
    `Business idea: ${payload.businessIdea}`,
    `Industry: ${payload.industry}`,
    `Location: ${payload.location}`,
    `Target customers: ${payload.targetCustomers}`,
    `Problem being solved: ${payload.problem}`,
    `Product/service: ${payload.productService}`,
    `Pricing: ${payload.pricing}`,
    `Competitors: ${payload.competitors}`,
    `Goals: ${payload.goals}`,
    `Available resources: ${payload.resources}`,
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
        temperature: 0.65,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[launch-wizard] AI provider error:", errText);
      return NextResponse.json(
        { error: "Couldn't generate your launch plan right now. Please try again shortly." },
        { status: 502 }
      );
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Unexpected AI response. Please try again." }, { status: 502 });
    }

    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      console.error("[launch-wizard] Failed to parse AI JSON:", content);
      return NextResponse.json({ error: "Unreadable AI response. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    console.error("[launch-wizard] Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
