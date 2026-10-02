import { requireStaff } from "@/lib/admin";
import ProjectsManager from "@/components/admin/ProjectsManager";

export const dynamic = "force-dynamic";

export default async function ConsultantProjects() {
  const { supabase, user } = await requireStaff();

  const [{ data: assignments }, { data: projects, error }] = await Promise.all([
    supabase.from("client_assignments").select("client_id").eq("consultant_id", user.id),
    supabase
      .from("projects")
      .select("id, client_id, title, status, progress_percent, summary, milestones")
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    return <p className="text-ash">Could not load projects: {error.message}</p>;
  }

  const clientIds = (assignments ?? []).map((a) => a.client_id);
  const { data: clients } = clientIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", clientIds)
    : { data: [] };

  return <ProjectsManager initial={(projects ?? []) as any} clients={clients ?? []} />;
}
