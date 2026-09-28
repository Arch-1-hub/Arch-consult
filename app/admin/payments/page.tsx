import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPayments() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, tx_ref, item_type, item_name, amount, currency, status, customer_email, customer_name, created_at, verified_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="text-ash">Could not load payments: {error.message}</p>
    );
  }
  if (!data || data.length === 0) {
    return <p className="text-ash">No payments yet.</p>;
  }

  const statusStyle: Record<string, string> = {
    successful: "text-gold",
    pending: "text-ash",
    failed: "text-red-400",
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-ink-line">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-ink-soft text-ash">
          <tr>
            <th className="p-3 font-normal">Date</th>
            <th className="p-3 font-normal">Item</th>
            <th className="p-3 font-normal">Customer</th>
            <th className="p-3 font-normal">Amount</th>
            <th className="p-3 font-normal">Status</th>
            <th className="p-3 font-normal">Reference</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id} className="border-t border-ink-line text-paper-white">
              <td className="p-3">
                {new Date(p.created_at).toLocaleDateString("en-NG")}
              </td>
              <td className="p-3">
                {p.item_name}
                <span className="block text-xs text-ash">{p.item_type}</span>
              </td>
              <td className="p-3">
                {p.customer_name || "—"}
                <span className="block break-all text-xs text-ash">
                  {p.customer_email}
                </span>
              </td>
              <td className="p-3">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: p.currency || "NGN",
                  maximumFractionDigits: 0,
                }).format(Number(p.amount))}
              </td>
              <td className={`p-3 ${statusStyle[p.status] ?? "text-ash"}`}>
                {p.status}
              </td>
              <td className="p-3 break-all text-xs text-ash">{p.tx_ref}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
