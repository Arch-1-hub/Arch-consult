import { NextRequest, NextResponse } from "next/server";
import { getToolBySlug } from "@/lib/ai-tools-data";

export const runtime = "nodejs";

// Shared rate limit across all AI tools combined, per IP — these are
// lighter-weight than the full Consultant/Health Check/Launch Wizard, but
// still cost real money per call.
const requests = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 15;

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

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "You've reached the hourly limit for AI tools. Please try again later." },
      { status: 429 }
    );
  }

  let body: { tool?: string; fields?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const tool = body.tool ? getToolBySlug(body.tool) : undefined;
  if (!tool) {
    return NextResponse.json({ error: "Unknown tool." }, { status: 400 });
  }

  const fields = body.fields || {};
  for (const field of tool.fields) {
    if (field.required && !String(fields[field.key] || "").trim()) {
      return NextResponse.json({ error: `Please fill in "${field.label}".` }, { status: 400 });
    }
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
          "AI tools aren't fully configured in this environment yet — an OPENAI_API_KEY or GROQ_API_KEY needs to be added.",
        setupRequired: true,
      },
      { status: 503 }
    );
  }

  const userInput = tool.fields
    .map((field) => {
      const value = fields[field.key];
      return value ? `${field.label}: ${sanitize(String(value))}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are an Arch Consult AI tool: "${tool.name}". ${tool.promptFocus}

Rules:
- Ground everything in the specific details given — never generic filler.
- Never claim guaranteed outcomes or promise success.
- Never present yourself as a human consultant.
- Be specific and practical.

Respond ONLY with JSON matching exactly this shape, no markdown, no extra text:
{
  "title": "a short title for this output",
  "sections": [
    ${tool.expectedSections
      .map((s) => `{ "heading": "${s}", "content": ["specific point 1", "specific point 2"] }`)
      .join(",\n    ")}
  ]
}
Each section's "content" is an array of strings — use multiple short strings for a list, or a single string for a short paragraph. Use exactly these section headings, in this order: ${tool.expectedSections.join(", ")}.`;

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
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[ai-tools] AI provider error:", errText);
      return NextResponse.json(
        { error: "Couldn't generate a result right now. Please try again shortly." },
        { status: 502 }
      );
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Unexpected AI response. Please try again." }, { status: 502 });
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      console.error("[ai-tools] Failed to parse AI JSON:", content);
      return NextResponse.json({ error: "Unreadable AI response. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[ai-tools] Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
