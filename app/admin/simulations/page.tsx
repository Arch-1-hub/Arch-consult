import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { listSimulations, SimRow } from "@/lib/sandbox/admin-simulations";
import { naira } from "@/lib/sandbox/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Simulations", robots: { index: false, follow: false } };

const date = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });

export default async function SimulationsPage() {
  await requireAdmin();
  let rows: SimRow[] = [];
  let problem = "";
  try {
    rows = await listSimulations(createAdminClient());
  } catch (e) {
    problem = e instanceof Error ? e.message : "Could not load simulations.";
  }
  const booked = rows.filter((r) => r.booked).length;

  return (
    <section className="py-10">
      <div className="container-arch flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="eyebrow">Business Sandbox</p>
          <h1 className="font-display text-3xl text-paper-white">Simulations</h1>
          <p className="text-sm text-ash">
            Every simulation run on the Sandbox, newest first. {rows.length} shown, {booked} from clients who have also booked. &quot;Booked&quot; means the same email appears in your
            bookings. Open a row for the full picture before you reach out.
          </p>
        </header>

        {problem ? <p className="border border-red-400 p-4 text-sm text-paper-white">{problem}</p> : null}

        <div className="overflow-x-auto border border-ink-line">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-ink-soft text-xs uppercase tracking-wide2 text-ash">
              <tr>
                <th className="p-3">Client</th>
                <th className="p-3">Business</th>
                <th className="p-3">State</th>
                <th className="p-3">Break-even</th>
                <th className="p-3">Lowest cash</th>
                <th className="p-3">Date</th>
                <th className="p-3">Booked</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-ink-line text-paper-white">
                  <td className="p-3">{r.email || "-"}</td>
                  <td className="p-3">
                    <Link href={`/admin/simulations/${r.id}`} className="text-gold hover:underline">
                      {r.businessName}
                    </Link>
                    {r.wasFree ? <span className="ml-2 text-xs text-ash">free</span> : null}
                  </td>
                  <td className="p-3">{r.state || "-"}</td>
                  <td className="p-3">{r.facts ? (r.facts.breakEvenMonth ? `Month ${r.facts.breakEvenMonth}` : "Not reached") : "-"}</td>
                  <td className="p-3">{r.facts ? naira(r.facts.lowestCash) : "-"}</td>
                  <td className="p-3 text-ash">{date(r.createdAt)}</td>
                  <td className="p-3">{r.booked ? <span className="text-gold">Yes</span> : <span className="text-ash">No</span>}</td>
                </tr>
              ))}
              {!rows.length && !problem ? (
                <tr>
                  <td className="p-6 text-ash" colSpan={7}>
                    No simulations yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
