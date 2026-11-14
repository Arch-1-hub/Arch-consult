import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSimulation } from "@/lib/sandbox/admin-simulations";
import { UUID_RE } from "@/lib/sandbox/booking-summary";
import { naira } from "@/lib/sandbox/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Simulation", robots: { index: false, follow: false } };

function Row({ k, v }: { k: string; v: string }) {
  if (!v) return null;
  return (
    <div className="flex flex-col gap-1 border-t border-ink-line py-3 sm:flex-row sm:gap-6">
      <dt className="w-44 shrink-0 text-xs uppercase tracking-wide2 text-ash">{k}</dt>
      <dd className="text-sm text-paper-white">{v}</dd>
    </div>
  );
}

export default async function SimulationDetail({ params }: { params: { id: string } }) {
  await requireAdmin();
  if (!UUID_RE.test(params.id)) notFound();
  const sim = await getSimulation(createAdminClient(), params.id);
  if (!sim) notFound();
  const f = sim.facts;
  const p = sim.profile;

  return (
    <section className="py-10">
      <div className="container-arch flex max-w-3xl flex-col gap-6">
        <Link href="/admin/simulations" className="text-sm text-gold hover:underline">
          Back to all simulations
        </Link>
        <header className="flex flex-col gap-2">
          <p className="eyebrow">Simulation</p>
          <h1 className="font-display text-3xl text-paper-white">{sim.businessName}</h1>
          <p className="text-sm text-ash">
            {sim.email || "Unknown client"} - {sim.booked ? "has booked a consultation" : "has not booked yet"}
          </p>
        </header>

        <dl>
          <Row k="State" v={sim.state} />
          <Row k="Area" v={sim.area} />
          <Row k="Starting capital" v={naira(sim.inputs.startingCapital)} />
          <Row k="Months simulated" v={String(sim.inputs.months)} />
          {f ? (
            <>
              <Row k="Break-even" v={f.breakEvenMonth ? `Month ${f.breakEvenMonth}` : `Not reached in ${f.months} months`} />
              <Row k="Lowest cash" v={`${naira(f.lowestCash)} in month ${f.lowestCashMonth}`} />
              <Row k="Cash runs out" v={f.cashOutMonth ? `Month ${f.cashOutMonth}` : "Not within the simulation"} />
              <Row k="Total net profit" v={naira(f.totalNetProfit)} />
              <Row k="Levers" v={f.levers.map((l) => `${l.label}: ${naira(l.gain)}`).join("; ")} />
            </>
          ) : null}
          {p ? (
            <>
              <Row k="What it does" v={p.description} />
              <Row k="Customers" v={p.customers} />
              <Row k="Suppliers" v={p.suppliers} />
              <Row k="Goal" v={p.goal} />
            </>
          ) : null}
        </dl>
      </div>
    </section>
  );
}
