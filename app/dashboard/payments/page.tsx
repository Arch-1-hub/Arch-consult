import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  successful: "text-gold border-gold/40",
  pending: "text-ash border-ink-line",
  failed: "text-red-300 border-red-900/50",
};

export default async function DashboardPaymentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, item_name, amount, currency, status, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (!payments || payments.length === 0) {
    return (
      <p className="text-sm text-ash">
        No payments yet.{" "}
        <Link href="/pricing" className="text-gold hover:text-gold-light">
          View pricing
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex flex-wrap items-center justify-between gap-2 border border-ink-line p-5"
        >
          <div>
            <p className="text-sm text-paper-white">{payment.item_name}</p>
            <p className="mt-1 text-xs text-ash">
              {new Date(payment.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-display text-lg text-paper-white">
              {payment.currency} {Number(payment.amount).toLocaleString()}
            </span>
            <span
              className={`border px-2 py-0.5 text-[11px] capitalize ${
                statusStyles[payment.status] || "text-ash border-ink-line"
              }`}
            >
              {payment.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
