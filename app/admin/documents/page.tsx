import { requireAdmin } from "@/lib/admin";
import AdminDocumentsClient from "@/components/admin/AdminDocumentsClient";

export const dynamic = "force-dynamic";

export default async function AdminDocuments() {
  const { supabase } = await requireAdmin();

  const [{ data: docs, error }, { data: clients }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, owner_id, file_name, file_size, note, uploaded_by_role, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  if (error) {
    return (
      <p className="text-ash">
        Could not load documents: {error.message}. Make sure 007_documents.sql
        has been run in Supabase.
      </p>
    );
  }

  return <AdminDocumentsClient initial={docs ?? []} clients={clients ?? []} />;
}
