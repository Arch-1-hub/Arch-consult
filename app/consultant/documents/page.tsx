import { requireStaff } from "@/lib/admin";
import AdminDocumentsClient from "@/components/admin/AdminDocumentsClient";

export const dynamic = "force-dynamic";

export default async function ConsultantDocuments() {
  const { supabase, user } = await requireStaff();

  const [{ data: assignments }, { data: docs, error }] = await Promise.all([
    supabase.from("client_assignments").select("client_id").eq("consultant_id", user.id),
    supabase
      .from("documents")
      .select("id, owner_id, file_name, file_size, note, uploaded_by_role, created_at")
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    return <p className="text-ash">Could not load documents: {error.message}</p>;
  }

  const clientIds = (assignments ?? []).map((a) => a.client_id);
  const { data: clients } = clientIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", clientIds)
    : { data: [] };

  return <AdminDocumentsClient initial={docs ?? []} clients={clients ?? []} />;
}
