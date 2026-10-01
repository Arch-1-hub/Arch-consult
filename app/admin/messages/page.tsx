import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminMessagesIndex() {
  const { supabase } = await requireAdmin();

  const { data: clients } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "client")
    .order("full_name");

  if (!clients || clients.length === 0) {
    return <p className="text-ash">No clients yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {clients.map((c) => (
        <li key={c.id}>
          <Link
            href={`/admin/messages/${c.id}`}
            className="block rounded-xl border border-ink-line bg-ink-soft p-4 text-paper-white hover:border-gold"
          >
            {c.full_name || "Unnamed client"}
          </Link>
        </li>
      ))}
    </ul>
  );
}
