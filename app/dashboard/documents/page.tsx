import { FolderOpen } from "lucide-react";
import ComingSoonSection from "@/components/dashboard/ComingSoonSection";

export default function DashboardDocumentsPage() {
  return (
    <ComingSoonSection
      icon={FolderOpen}
      title="Document uploads aren't set up yet"
      description="Secure file upload and download for business plans, brand guidelines and other documents is coming in a later build stage."
    />
  );
}
