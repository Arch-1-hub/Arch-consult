import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/sandbox/admin-check";
import { llmFromEnv, generateBriefing, NICHES } from "@/lib/sandbox/briefing/generate";
import { isMonth, planCombos } from "@/lib/sandbox/briefing/plan";
import { collectNews, FetchLike } from "@/lib/sandbox/briefing/rss";
import { MAX_NEWS_AGE_DAYS, NEWS_FEEDS } from "@/lib/sandbox/briefing/sources";
import { isUuid } from "@/lib/sandbox/entitlement";
import { Briefing, NewsItem } from "@/lib/sandbox/briefing/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Each call drafts at most one briefing, so a minute is plenty.
export const maxDuration = 60;

const err = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return err("Admins only.", 403);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return err("Invalid request body.");
    }
    const db = createAdminClient();

    // Step 1: read the news and decide which briefings to draft.
    if (body.action === "collect") {
      if (!isMonth(body.month)) return err("Invalid month.");
      const { items, status } = await collectNews(NEWS_FEEDS, fetch as unknown as FetchLike, new Date(), MAX_NEWS_AGE_DAYS);
      const news: NewsItem[] = items.slice(0, 150);

      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data: sims, error: simError } = await db
        .from("sandbox_simulations")
        .select("business_type, state_name")
        .gte("created_at", since)
        .not("business_type", "is", null)
        .limit(2000);
      if (simError) throw simError;

      const { data: run, error: runError } = await db
        .from("sandbox_briefing_runs")
        .insert({ month: body.month, feed_status: status, items_collected: news.length, news })
        .select("id")
        .single();
      if (runError) throw runError;

      return NextResponse.json({ ok: true, runId: run.id, feedStatus: status, itemCount: news.length, combos: planCombos(sims ?? []) });
    }

    // Step 2: draft one briefing.
    if (body.action === "generate") {
      if (!isUuid(body.runId) || typeof body.niche !== "string") return err("Missing details.");
      const state = typeof body.state === "string" ? body.state.trim().slice(0, 60) : "";
      if (!NICHES.some((n) => n.id === body.niche)) return err("Unknown business type.");

      const llm = llmFromEnv(process.env);
      if (!llm) return err("No AI key is set (OPENAI_API_KEY or GROQ_API_KEY).", 503);

      const { data: run, error: runError } = await db
        .from("sandbox_briefing_runs")
        .select("month, news")
        .eq("id", body.runId)
        .single();
      if (runError || !run) return err("That run was not found.", 404);

      const { data: existing } = await db
        .from("sandbox_briefings")
        .select("status")
        .eq("month", run.month)
        .eq("niche", body.niche)
        .eq("state", state)
        .maybeSingle();
      if (existing && (existing.status === "approved" || existing.status === "sent")) {
        return NextResponse.json({ ok: true, skipped: true });
      }

      const result = await generateBriefing({
        month: run.month,
        niche: body.niche,
        state: state || null,
        news: (run.news ?? []) as NewsItem[],
        llm,
      });
      if (!result.ok || !result.briefing) return NextResponse.json({ ok: false, error: result.error ?? "Could not draft this briefing." });

      const { error: saveError } = await db.from("sandbox_briefings").upsert(
        {
          month: run.month,
          niche: body.niche,
          state,
          status: "draft",
          content: result.briefing,
          sources: result.sources,
          generated_at: new Date().toISOString(),
          approved_at: null,
          approved_by: null,
        },
        { onConflict: "month,niche,state" }
      );
      if (saveError) throw saveError;
      return NextResponse.json({ ok: true });
    }

    // Step 3: record how the run went.
    if (body.action === "finish") {
      if (!isUuid(body.runId)) return err("Missing run.");
      await db
        .from("sandbox_briefing_runs")
        .update({ briefings_drafted: Number(body.drafted) || 0, briefings_failed: Number(body.failed) || 0 })
        .eq("id", body.runId);
      return NextResponse.json({ ok: true });
    }

    // Review: approve, reject, or take out one item.
    if (body.action === "review") {
      if (!isUuid(body.id)) return err("Missing briefing.");
      const { data: row, error: rowError } = await db
        .from("sandbox_briefings")
        .select("id, status, content")
        .eq("id", body.id)
        .single();
      if (rowError || !row) return err("Briefing not found.", 404);
      if (row.status === "sent") return err("This briefing has already been sent.");

      if (body.status === "approved" || body.status === "rejected") {
        const { error } = await db
          .from("sandbox_briefings")
          .update(
            body.status === "approved"
              ? { status: "approved", approved_at: new Date().toISOString(), approved_by: admin.id }
              : { status: "rejected", approved_at: null, approved_by: null }
          )
          .eq("id", row.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      if (body.status === "remove-item") {
        const content = row.content as Briefing;
        const index = Number(body.index);
        if (!Number.isInteger(index) || index < 0 || index >= content.items.length) return err("No such item.");
        content.items.splice(index, 1);
        const { error } = await db
          .from("sandbox_briefings")
          .update({ content, status: "draft", approved_at: null, approved_by: null })
          .eq("id", row.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
    }

    return err("Unknown action.");
  } catch (e) {
    console.error("[sandbox-briefings] Unexpected error:", e);
    return err("Something went wrong. Please try again.", 500);
  }
}
