import { requireAdmin } from "@/lib/admin";
import TeamAssignments from "@/components/admin/TeamAssignments";

export const dynamic = "force-dynamic";

export default async function AdminTeam() {
  const { supabase } = await requireAdmin();

  const [{ data: clients }, { data: consultants }, { data: assignments }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").eq("role", "client").order("full_name"),
    supabase.from("profiles").select("id, full_name, role").eq("role", "consultant").order("full_name"),
    supabase.from("client_assignments").select("client_id, consultant_id"),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-paper-white">Team</h1>
      <p className="mt-1 text-sm text-ash">
        Assign each client to one consultant. That consultant then sees only
        this client's bookings, documents, and (soon) messages.
      </p>
      <div className="mt-6">
        <TeamAssignments
          clients={clients ?? []}
          consultants={consultants ?? []}
          assignments={assignments ?? []}
        />
      </div>
    </div>
  );
}
