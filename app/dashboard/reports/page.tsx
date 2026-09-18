import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ReportCard from "@/components/dashboard/ReportCard";

export const dynamic = "force-dynamic";

export default async function DashboardReportsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: reports } = await supabase
    .from("reports")
    .select("id, type, title, data, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (!reports || reports.length === 0) {
    return (
      <p className="text-sm text-ash">
        No saved reports yet. Run the{" "}
        <Link href="/health-check" className="text-gold hover:text-gold-light">
          Health Check
        </Link>
        ,{" "}
        <Link href="/launch-wizard" className="text-gold hover:text-gold-light">
          Launch Wizard
        </Link>
        , or{" "}
        <Link href="/ai-consultant" className="text-gold hover:text-gold-light">
          AI Consultant
        </Link>{" "}
        and tap "Save to my account" on the result.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
