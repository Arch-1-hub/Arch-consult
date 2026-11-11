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
      .from("sandbox_client_briefings")
      .select("id, month, email, title, area, state, status, content, growth, sources, created_at, approved_at")
      .eq("month", month)
      .order("created_at"),
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
            Collect this month&apos;s news, let the AI write a briefing for each client from their own simulation and the news in their area. Skim, trim, then approve. Nothing is
            sent to customers until you approve it.
          </p>
        </header>
        {setupProblem ? (
          <p role="alert" className="border border-red-400 p-4 text-sm text-red-400">
            The briefing tables are not set up yet. Run supabase/012, 013 and 014 (014_sandbox_client_briefings.sql) in the Supabase SQL Editor, then refresh.
          </p>
        ) : (
          <BriefingsAdmin month={month} briefings={briefings.data ?? []} lastRun={runs.data?.[0] ?? null} />
        )}
      </div>
    </section>
  );
}
