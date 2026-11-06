import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decideAccess } from "@/lib/sandbox/entitlement";
import { validateInputs } from "@/lib/sandbox/engine";
import { runWithRules } from "@/lib/sandbox/run";
import { getSandboxUser, loadAccessState } from "@/lib/sandbox/server-access";
import { SimulationInputs } from "@/lib/sandbox/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSandboxUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to run a simulation.", code: "anon" }, { status: 401 });
    }
    if (!user.verified) {
      return NextResponse.json({ error: "Please verify your email address first.", code: "unverified" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    if (!isObj(body) || !isObj(body.ctx) || !isObj(body.inputs)) {
      return NextResponse.json({ error: "Missing simulation details." }, { status: 400 });
    }
    const c = body.ctx;
    if ((c.status !== "company" && c.status !== "sole") || typeof c.professionalServices !== "boolean") {
      return NextResponse.json({ error: "Missing simulation details." }, { status: 400 });
    }
    const ctx = { status: c.status, professionalServices: c.professionalServices } as const;
    const inputs = body.inputs as unknown as SimulationInputs;
    const stateName = typeof body.stateName === "string" ? body.stateName.slice(0, 60) : "";

    if (!Array.isArray(inputs.products) || !Array.isArray(inputs.staff)) {
      return NextResponse.json({ error: "Missing simulation details." }, { status: 400 });
    }
    const problems = validateInputs(inputs);
    if (problems.length > 0) {
      return NextResponse.json({ error: problems.join(" ") }, { status: 400 });
    }

    const admin = createAdminClient();
    const state = await loadAccessState(admin, user);
    const decision = decideAccess(state);
    if (!decision.allowed) {
      return NextResponse.json(
        { error: decision.message, code: decision.code },
        { status: decision.code === "upgrade" ? 402 : 429 }
      );
    }

    const run = runWithRules(inputs, ctx);

    const { data, error } = await admin
      .from("sandbox_simulations")
      .insert({ user_id: user.id, inputs, ctx, state_name: stateName, was_free: decision.plan === "free" })
      .select("id")
      .single();

    if (error) {
      // 23505 = the database's one-free-simulation rule caught a second quick request.
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You have used your free simulation. Choose a package to unlock the sandbox.", code: "upgrade" },
          { status: 402 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      ok: true,
      simulationId: data.id,
      plan: decision.plan,
      result: run.result,
      notes: run.notes,
    });
  } catch (err) {
    console.error("[sandbox-simulations] Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong running your simulation. Please try again." }, { status: 500 });
  }
}
