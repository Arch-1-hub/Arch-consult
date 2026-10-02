import { requireAdmin } from "@/lib/admin";
import ProjectsManager from "@/components/admin/ProjectsManager";

export const dynamic = "force-dynamic";

export default async function AdminProjects() {
  const { supabase } = await requireAdmin();

  const [{ data: projects, error }, { data: clients }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, client_id, title, status, progress_percent, summary, milestones")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").eq("role", "client").order("full_name"),
  ]);

  if (error) {
    return (
      <p className="text-ash">
        Could not load projects: {error.message}. Make sure 010_projects.sql
        has been run in Supabase.
      </p>
    );
  }

  return <ProjectsManager initial={(projects ?? []) as any} clients={clients ?? []} />;
}
