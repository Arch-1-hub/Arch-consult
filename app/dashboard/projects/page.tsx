import { Briefcase } from "lucide-react";
import ComingSoonSection from "@/components/dashboard/ComingSoonSection";

export default function DashboardProjectsPage() {
  return (
    <ComingSoonSection
      icon={Briefcase}
      title="Projects aren't set up yet"
      description="Once Arch Consult starts an engagement with you, active projects — with status, progress, files and notes — will show up here. This is coming in a later build stage."
    />
  );
}
