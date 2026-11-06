import { requireAdmin } from "@/lib/admin";
import BriefingsAdmin from "@/components/sandbox/BriefingsAdmin";
import { isMonth, currentMonthLagos } from "@/lib/sandbox/briefing/plan";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sandbox briefings", robots: { index: false, follow: false } };

export default async function SandboxBriefingsPage({ searchParams }: { searchParams: { month?: string } }) {
  await requireAdmin();
  const month = isMonth(searchParams.month) ? searchParams.month : currentMonthLagos(new Date());
  const db = createAdminClient();

  const [briefings, runs] = await Promise.all([
    db
      .from("sandbox_briefings")
      .select("id, month, niche, state, status, content, sources, generated_at, approved_at")
      .eq("month", month)
      .order("niche")
      .order("state"),
    db
      .from("sandbox_briefing_runs")
      .select("id, created_at, feed_status, items_collected, briefings_drafted, briefings_failed")
      .eq("month", month)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const setupProblem = briefings.error || runs.error;

  return (
    <section className="py-10">
      <div className="container-arch flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="eyebrow">Business Sandbox</p>
          <h1 className="font-display text-3xl text-paper-white">Monthly briefings</h1>
          <p className="text-sm text-ash">
            Collect this month&apos;s news, let the AI draft a briefing for each business type, then read, trim and approve. Nothing is
            sent to customers until you approve it.
          </p>
        </header>
        {setupProblem ? (
          <p role="alert" className="border border-red-400 p-4 text-sm text-red-400">
            The briefing tables are not set up yet. Run supabase/012_sandbox_briefings.sql in the Supabase SQL Editor, then refresh.
          </p>
        ) : (
          <BriefingsAdmin month={month} briefings={briefings.data ?? []} lastRun={runs.data?.[0] ?? null} />
        )}
      </div>
    </section>
  );
}
