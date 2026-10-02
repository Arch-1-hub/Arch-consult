import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProjectsView from "@/components/dashboard/ProjectsView";

export const dynamic = "force-dynamic";

export default async function DashboardProjectsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/dashboard/projects");

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, status, progress_percent, summary, milestones")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-ash">Could not load projects: {error.message}</p>;
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-paper-white">Projects</h1>
      <p className="mt-1 text-sm text-ash">Where things stand on your Arch Consult engagement.</p>
      <div className="mt-6">
        <ProjectsView projects={(data ?? []) as any} />
      </div>
    </div>
  );
}
