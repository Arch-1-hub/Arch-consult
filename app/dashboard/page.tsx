import Link from "next/link";
import { CalendarCheck, FileText, Briefcase, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  const { data: upcomingBookings } = await supabase
    .from("bookings")
    .select("id, consultation_type, preferred_date, preferred_time")
    .eq("user_id", user!.id)
    .gte("preferred_date", today)
    .order("preferred_date", { ascending: true })
    .limit(3);

  const { data: recentReports } = await supabase
    .from("reports")
    .select("id, type, title, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const { count: paymentsCount } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .eq("status", "successful");

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-px overflow-hidden bg-ink-line sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={CalendarCheck}
          label="Upcoming Consultations"
          value={upcomingBookings?.length ?? 0}
        />
        <SummaryCard icon={FileText} label="Saved Reports" value={recentReports?.length ?? 0} />
        <SummaryCard icon={Briefcase} label="Active Projects" value="—" note="Coming soon" />
        <SummaryCard icon={CreditCard} label="Successful Payments" value={paymentsCount ?? 0} />
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <p className="eyebrow">Upcoming Consultations</p>
            <Link href="/dashboard/bookings" className="text-xs text-ash hover:text-gold">
              View all →
            </Link>
          </div>
          {upcomingBookings && upcomingBookings.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-3">
              {upcomingBookings.map((booking) => (
                <li key={booking.id} className="border border-ink-line p-4">
                  <p className="text-sm text-paper-white">{booking.consultation_type}</p>
                  <p className="mt-1 text-xs text-ash">
                    {new Date(booking.preferred_date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {booking.preferred_time}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ash">
              No upcoming consultations.{" "}
              <Link href="/book-consultation" className="text-gold hover:text-gold-light">
                Book one
              </Link>
              .
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="eyebrow">Recent Reports</p>
            <Link href="/dashboard/reports" className="text-xs text-ash hover:text-gold">
              View all →
            </Link>
          </div>
          {recentReports && recentReports.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-3">
              {recentReports.map((report) => (
                <li key={report.id} className="border border-ink-line p-4">
                  <p className="text-sm text-paper-white">{report.title}</p>
                  <p className="mt-1 text-xs text-ash">
                    {new Date(report.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ash">
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
              and save the result.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="bg-ink p-6">
      <Icon size={18} className="text-gold" strokeWidth={1.5} />
      <p className="mt-4 font-display text-2xl text-paper-white">{value}</p>
      <p className="mt-1 text-xs text-ash">{label}</p>
      {note && <p className="mt-1 text-[10px] uppercase tracking-wide text-ash/60">{note}</p>}
    </div>
  );
}
