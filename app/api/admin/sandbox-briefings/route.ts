import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/sandbox/admin-check";
import { llmFromEnv, generateBriefing, NICHES } from "@/lib/sandbox/briefing/generate";
import { isMonth, planCombos } from "@/lib/sandbox/briefing/plan";
import { collectNews, FetchLike } from "@/lib/sandbox/briefing/rss";
import { MAX_NEWS_AGE_DAYS, NEWS_FEEDS } from "@/lib/sandbox/briefing/sources";
import { isUuid } from "@/lib/sandbox/entitlement";
import { Briefing, NewsItem } from "@/lib/sandbox/briefing/types";
import { deliverChunk, OutMessage, recipientsFor } from "@/lib/sandbox/briefing/deliver";
import { pickBriefing, renderBriefingEmail } from "@/lib/sandbox/briefing/email";
import { sendBatch } from "@/lib/sandbox/briefing/resend";
import { loadRecipients, supabaseStore } from "@/lib/sandbox/briefing/server";
import { DEFAULT_SITE_URL, emailSecret, oneClickUrl, unsubscribeUrl } from "@/lib/sandbox/briefing/unsubscribe";
import { monthLabel } from "@/lib/sandbox/briefing/generate";

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

    // Email: count who would receive a briefing, send a test to the admin, or send a batch.
    if (body.action === "preview" || body.action === "send") {
      if (!isUuid(body.id)) return err("Missing briefing.");
      const { data: row } = await db.from("sandbox_briefings").select("id, month, niche, state, status, content").eq("id", body.id).single();
      if (!row) return err("Briefing not found.", 404);
      if (row.status !== "approved" && row.status !== "sent") return err("Approve this briefing before sending it.");

      const { data: monthRows, error: monthError } = await db
        .from("sandbox_briefings")
        .select("id, niche, state, status")
        .eq("month", row.month);
      if (monthError) throw monthError;
      const all = monthRows ?? [];
      const store = supabaseStore(db);
      const nicheLabel = NICHES.find((n) => n.id === row.niche)?.label ?? row.niche;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
      const secret = emailSecret(process.env);
      if (!secret) return err("No signing secret is available for unsubscribe links.", 503);

      const build = (email: string, state: string): OutMessage => {
        const mail = renderBriefingEmail({
          briefing: row.content as Briefing,
          monthLabel: monthLabel(row.month),
          nicheLabel,
          state: state || row.state,
          siteUrl,
          unsubscribeUrl: unsubscribeUrl(siteUrl, email, secret),
        });
        return {
          to: email,
          ...mail,
          headers: {
            "List-Unsubscribe": `<${oneClickUrl(siteUrl, email, secret)}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        };
      };

      if (body.action === "preview") {
        const audience = recipientsFor(row.id, all, await loadRecipients(db));
        const done = await store.delivered(row.id);
        return NextResponse.json({ ok: true, total: audience.length, alreadySent: audience.filter((r) => done.has(r.email)).length });
      }

      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) return err("RESEND_API_KEY is not set.", 503);
      const from = process.env.BRIEFING_FROM || "Arch Consult <no-reply@archbrandingconsult.online>";
      const replyTo = process.env.BRIEFING_REPLY_TO || undefined;

      if (body.test === true) {
        if (!admin.email) return err("Your admin account has no email address.");
        const res = await sendBatch({ apiKey, from, replyTo, messages: [{ ...build(admin.email, row.state), subject: `[TEST] ${build(admin.email, row.state).subject}` }] });
        return res.ok ? NextResponse.json({ ok: true, sentTo: admin.email }) : err(res.error ?? "Could not send the test.", 502);
      }

      const audience = recipientsFor(row.id, all, await loadRecipients(db));
      const stateOf = new Map(audience.map((r) => [r.email, r.state]));
      const result = await deliverChunk({
        briefingId: row.id,
        audience,
        store,
        mailer: (messages) => sendBatch({ apiKey, from, replyTo, messages }),
        build: (r) => build(r.email, stateOf.get(r.email) ?? ""),
        limit: 40,
      });
      if (result.error) return NextResponse.json({ ok: false, error: result.error, remaining: result.remaining });
      if (result.remaining === 0 && result.total > 0) {
        await db.from("sandbox_briefings").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", row.id);
      }
      return NextResponse.json({ ok: true, ...result });
    }

    return err("Unknown action.");
  } catch (e) {
    console.error("[sandbox-briefings] Unexpected error:", e);
    return err("Something went wrong. Please try again.", 500);
  }
}
