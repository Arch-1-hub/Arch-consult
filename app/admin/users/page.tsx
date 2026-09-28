import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, business_name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-ash">Could not load users: {error.message}</p>;
  }
  if (!data || data.length === 0) {
    return <p className="text-ash">No users yet.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-ink-line">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-ink-soft text-ash">
            <tr>
              <th className="p-3 font-normal">Name</th>
              <th className="p-3 font-normal">Business</th>
              <th className="p-3 font-normal">Role</th>
              <th className="p-3 font-normal">Joined</th>
            </tr>
          </thead>
          <tbody>
            {data.map((u) => (
              <tr key={u.id} className="border-t border-ink-line text-paper-white">
                <td className="p-3">{u.full_name || "—"}</td>
                <td className="p-3">{u.business_name || "—"}</td>
                <td className={`p-3 ${u.role === "admin" ? "text-gold" : "text-ash"}`}>
                  {u.role}
                </td>
                <td className="p-3">
                  {new Date(u.created_at).toLocaleDateString("en-NG")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-ash">
        Roles are changed manually in Supabase (Table Editor → profiles). That
        is deliberate: no button on the website can create an admin.
      </p>
    </>
  );
}
