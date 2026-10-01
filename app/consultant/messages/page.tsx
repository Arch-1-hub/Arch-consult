import Link from "next/link";
import { requireStaff } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function ConsultantMessagesIndex() {
  const { supabase, user } = await requireStaff();

  const { data: assignments } = await supabase
    .from("client_assignments")
    .select("client_id, profiles:client_id(full_name)")
    .eq("consultant_id", user.id);

  const clients = (assignments ?? []) as any[];

  if (clients.length === 0) {
    return <p className="text-ash">No clients assigned to you yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {clients.map((a) => (
        <li key={a.client_id}>
          <Link
            href={`/consultant/messages/${a.client_id}`}
            className="block rounded-xl border border-ink-line bg-ink-soft p-4 text-paper-white hover:border-gold"
          >
            {a.profiles?.full_name || "Unnamed client"}
          </Link>
        </li>
      ))}
    </ul>
  );
}
