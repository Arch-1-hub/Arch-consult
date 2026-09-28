import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const { supabase } = await requireAdmin();

  const count = async (
    table: string,
    filter?: { column: string; value: string }
  ) => {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = q.eq(filter.column, filter.value);
    const { count } = await q;
    return count ?? 0;
  };

  const [users, bookings, pending, reports, paid] = await Promise.all([
    count("profiles"),
    count("bookings"),
    count("bookings", { column: "status", value: "pending" }),
    count("reports"),
    count("payments", { column: "status", value: "successful" }),
  ]);

  // Total confirmed revenue (successful NGN payments only).
  const { data: paidRows } = await supabase
    .from("payments")
    .select("amount")
    .eq("status", "successful")
    .eq("currency", "NGN");
  const revenue = (paidRows ?? []).reduce((s, r) => s + Number(r.amount), 0);

  const cards = [
    { label: "Registered users", value: String(users) },
    { label: "Total bookings", value: String(bookings) },
    { label: "Pending bookings", value: String(pending) },
    { label: "Saved reports", value: String(reports) },
    { label: "Successful payments", value: String(paid) },
    {
      label: "Confirmed revenue",
      value: new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }).format(revenue),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-ink-line bg-ink-soft p-5"
        >
          <p className="text-sm text-ash">{c.label}</p>
          <p className="mt-2 font-display text-3xl text-paper-white">
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}
