import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/sandbox/admin-check";
import { generateClientBriefing, llmFromEnv, monthLabel } from "@/lib/sandbox/briefing/generate";
import { fetchLocalNews } from "@/lib/sandbox/briefing/local";
import { isMonth } from "@/lib/sandbox/briefing/plan";
import { collectNews, FetchLike } from "@/lib/sandbox/briefing/rss";
import { MAX_NEWS_AGE_DAYS, NEWS_FEEDS } from "@/lib/sandbox/briefing/sources";
import { isUuid } from "@/lib/sandbox/entitlement";
import { profileTitle } from "@/lib/sandbox/profile";
import { Briefing, NewsItem } from "@/lib/sandbox/briefing/types";
import { dispatchApproved, DispatchStore, OutMessage } from "@/lib/sandbox/briefing/dispatch";
import { GrowthSection } from "@/lib/sandbox/briefing/growth";
import { renderBriefingEmail } from "@/lib/sandbox/briefing/email";
import { sendBatch } from "@/lib/sandbox/briefing/resend";
import { loadOptouts, loadRecipients, loadSim } from "@/lib/sandbox/briefing/server";
import { DEFAULT_SITE_URL, emailSecret, oneClickUrl, unsubscribeUrl } from "@/lib/sandbox/briefing/unsubscribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Each call drafts at most one client's briefing, so a minute is plenty.
export const maxDuration = 60;

const err = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

type Db = ReturnType<typeof createAdminClient>;

interface Row {
  id: string;
  email: string;
  title: string;
  area: string;
  state: string;
  content: Briefing;
  growth: GrowthSection | null;
}

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

    // Step 1: read the nationwide news and list the clients who need a briefing this month.
    if (body.action === "collect") {
      if (!isMonth(body.month)) return err("Invalid month.");
      const { items, status } = await collectNews(NEWS_FEEDS, fetch as unknown as FetchLike, new Date(), MAX_NEWS_AGE_DAYS);
      const news: NewsItem[] = items.slice(0, 150);

      const recipients = await loadRecipients(db);
      const done = await db.from("sandbox_client_briefings").select("user_id, status").eq("month", body.month);
      if (done.error) throw done.error;
      const locked = new Set((done.data ?? []).filter((d) => d.status === "approved" || d.status === "sent").map((d) => d.user_id));
      const clients = recipients.filter((r) => !locked.has(r.userId)).map((r) => ({ userId: r.userId, simId: r.simId, email: r.email }));

      const { data: run, error: runError } = await db
        .from("sandbox_briefing_runs")
        .insert({ month: body.month, feed_status: status, items_collected: news.length, news })
        .select("id")
        .single();
      if (runError) throw runError;
      return NextResponse.json({ ok: true, runId: run.id, feedStatus: status, itemCount: news.length, clients });
    }

    // Step 2: draft one client's briefing.
    if (body.action === "generate") {
      if (!isUuid(body.runId) || !isUuid(body.userId) || !isUuid(body.simId)) return err("Missing details.");
      const llm = llmFromEnv(process.env);
      if (!llm) return err("No AI key is set (OPENAI_API_KEY or GROQ_API_KEY).", 503);

      const { data: run, error: runError } = await db.from("sandbox_briefing_runs").select("month, news").eq("id", body.runId).single();
      if (runError || !run) return err("That run was not found.", 404);

      const { data: existing } = await db.from("sandbox_client_briefings").select("status").eq("month", run.month).eq("user_id", body.userId).maybeSingle();
      if (existing && (existing.status === "approved" || existing.status === "sent")) return NextResponse.json({ ok: true, skipped: true });

      const sim = await loadSim(db, body.simId, body.userId);
      if (!sim) return err("That simulation was not found.", 404);
      const { data: who } = await db.auth.admin.getUserById(body.userId);
      const email = who?.user?.email?.trim().toLowerCase();
      if (!email) return err("That client has no email address.");

      const local = await fetchLocalNews(sim.profile, sim.state, fetch as unknown as FetchLike, new Date(), MAX_NEWS_AGE_DAYS);
      const seen = new Set<string>();
      const news = [...local, ...((run.news ?? []) as NewsItem[])].filter((n) => (seen.has(n.url) ? false : (seen.add(n.url), true)));

      const result = await generateClientBriefing({
        month: run.month,
        profile: sim.profile,
        businessName: sim.inputs.businessName,
        state: sim.state,
        inputs: sim.inputs,
        ctx: sim.ctx,
        news,
        llm,
      });
      if (!result.ok || !result.briefing) return NextResponse.json({ ok: false, error: result.error ?? "Could not draft this briefing." });

      const { error: saveError } = await db.from("sandbox_client_briefings").upsert(
        {
          month: run.month,
          user_id: body.userId,
          sim_id: body.simId,
          email,
          title: profileTitle(sim.profile, sim.inputs.businessName),
          area: sim.profile.area,
          state: sim.state,
          status: "draft",
          content: result.briefing,
          growth: result.growth,
          sources: result.sources,
          created_at: new Date().toISOString(),
          approved_at: null,
          approved_by: null,
        },
        { onConflict: "month,user_id" },
      );
      if (saveError) throw saveError;
      return NextResponse.json({ ok: true });
    }

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
      const { data: row, error: rowError } = await db.from("sandbox_client_briefings").select("id, status, content").eq("id", body.id).single();
      if (rowError || !row) return err("Briefing not found.", 404);
      if (row.status === "sent") return err("This briefing has already been sent.");

      if (body.status === "approved" || body.status === "rejected") {
        const { error } = await db
          .from("sandbox_client_briefings")
          .update(
            body.status === "approved"
              ? { status: "approved", approved_at: new Date().toISOString(), approved_by: admin.id }
              : { status: "rejected", approved_at: null, approved_by: null },
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
        const { error } = await db.from("sandbox_client_briefings").update({ content, status: "draft", approved_at: null, approved_by: null }).eq("id", row.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      return err("Unknown review action.");
    }

    // Approve every draft for the month in one go.
    if (body.action === "approve-all") {
      if (!isMonth(body.month)) return err("Invalid month.");
      const { data, error } = await db
        .from("sandbox_client_briefings")
        .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: admin.id })
        .eq("month", body.month)
        .eq("status", "draft")
        .select("id");
      if (error) throw error;
      return NextResponse.json({ ok: true, approved: data?.length ?? 0 });
    }

    // Email: send a test to the admin, or send a batch of approved briefings.
    if (body.action === "send") {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) return err("RESEND_API_KEY is not set.", 503);
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
      const secret = emailSecret(process.env);
      if (!secret) return err("No signing secret is available for unsubscribe links.", 503);
      const from = process.env.BRIEFING_FROM || "Arch Consult <no-reply@archbrandingconsult.online>";
      const replyTo = process.env.BRIEFING_REPLY_TO || undefined;

      const buildFor = (row: Row, month: string, to: string): OutMessage => {
        const mail = renderBriefingEmail({
          briefing: row.content,
          monthLabel: monthLabel(month),
          nicheLabel: row.title,
          state: [row.area, row.state].filter(Boolean).join(", "),
          siteUrl,
          unsubscribeUrl: unsubscribeUrl(siteUrl, to, secret),
          personal: row.growth,
        });
        return {
          to,
          ...mail,
          headers: { "List-Unsubscribe": `<${oneClickUrl(siteUrl, to, secret)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        };
      };
      const fields = "id, month, email, title, area, state, content, growth";

      if (body.test === true) {
        if (!isUuid(body.id)) return err("Missing briefing.");
        if (!admin.email) return err("Your admin account has no email address.");
        const { data: row } = await db.from("sandbox_client_briefings").select(fields).eq("id", body.id).single();
        if (!row) return err("Briefing not found.", 404);
        const msg = buildFor(row as unknown as Row, row.month, admin.email);
        const res = await sendBatch({ apiKey, from, replyTo, messages: [{ ...msg, subject: `[TEST] ${msg.subject}` }] });
        return res.ok ? NextResponse.json({ ok: true, sentTo: admin.email }) : err(res.error ?? "Could not send the test.", 502);
      }

      if (!isMonth(body.month)) return err("Invalid month.");
      const month = body.month;
      const optouts = await loadOptouts(db);
      const store = clientStore(db, month);
      const result = await dispatchApproved({
        store,
        mailer: (messages) => sendBatch({ apiKey, from, replyTo, messages }),
        limit: 40,
        build: async (r) => {
          if (optouts.has(r.email.toLowerCase())) return null;
          const { data: row } = await db.from("sandbox_client_briefings").select(fields).eq("id", r.id).single();
          return row ? buildFor(row as unknown as Row, month, r.email) : null;
        },
      });
      if (result.error) return NextResponse.json({ ok: false, error: result.error, remaining: result.remaining });
      return NextResponse.json({ ok: true, ...result });
    }

    // How many approved briefings are waiting to go out.
    if (body.action === "preview") {
      if (!isMonth(body.month)) return err("Invalid month.");
      const waiting = await clientStore(db, body.month).waiting();
      return NextResponse.json({ ok: true, waiting });
    }

    return err("Unknown action.");
  } catch (e) {
    console.error("[sandbox-briefings] Unexpected error:", e);
    return err("Something went wrong. Please try again.", 500);
  }
}

function clientStore(db: Db, month: string): DispatchStore {
  return {
    async claim(limit) {
      const pick = await db.from("sandbox_client_briefings").select("id").eq("month", month).eq("status", "approved").order("created_at").limit(limit);
      if (pick.error) throw pick.error;
      const ids = (pick.data ?? []).map((r) => r.id);
      if (ids.length === 0) return [];
      // The status check makes this safe if two requests overlap: each row is claimed only once.
      const taken = await db
        .from("sandbox_client_briefings")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .in("id", ids)
        .eq("status", "approved")
        .select("id, email");
      if (taken.error) throw taken.error;
      return (taken.data ?? []).map((r) => ({ id: String(r.id), email: String(r.email) }));
    },
    async revert(ids) {
      if (ids.length) await db.from("sandbox_client_briefings").update({ status: "approved", sent_at: null }).in("id", ids);
    },
    async drop(ids) {
      if (ids.length) await db.from("sandbox_client_briefings").update({ status: "rejected", sent_at: null }).in("id", ids);
    },
    async waiting() {
      const { count, error } = await db.from("sandbox_client_briefings").select("id", { count: "exact", head: true }).eq("month", month).eq("status", "approved");
      if (error) throw error;
      return count ?? 0;
    },
  };
}
