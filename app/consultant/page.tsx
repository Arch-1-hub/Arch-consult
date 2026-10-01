import { requireStaff } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function ConsultantOverview() {
  const { supabase, user, isAdmin } = await requireStaff();

  const { count: clientCount } = await supabase
    .from("client_assignments")
    .select("*", { count: "exact", head: true })
    .eq("consultant_id", user.id);

  const { count: bookingCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true });
  const { count: pendingCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  const { count: docCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true });

  const cards = [
    { label: "Assigned clients", value: clientCount ?? 0 },
    { label: "Their bookings", value: bookingCount ?? 0 },
    { label: "Pending bookings", value: pendingCount ?? 0 },
    { label: "Shared documents", value: docCount ?? 0 },
  ];

  return (
    <div>
      {isAdmin && (
        <p className="mb-4 rounded-md border border-gold/40 p-3 text-xs text-gold">
          You're an admin viewing the consultant screen. These numbers only
          cover clients formally assigned to your own account in Team.
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-ink-line bg-ink-soft p-5">
            <p className="text-sm text-ash">{c.label}</p>
            <p className="mt-2 font-display text-3xl text-paper-white">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
