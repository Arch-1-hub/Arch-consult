import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DocumentsClient from "@/components/dashboard/DocumentsClient";

export const dynamic = "force-dynamic";

export default async function DashboardDocumentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/dashboard/documents");

  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, file_size, note, uploaded_by_role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-ash">Could not load documents: {error.message}</p>;
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-paper-white">Documents</h1>
      <p className="mt-1 text-sm text-ash">
        Send files to Arch Consult, and download anything shared with you.
      </p>
      <div className="mt-6">
        <DocumentsClient initial={data ?? []} />
      </div>
    </div>
  );
}
