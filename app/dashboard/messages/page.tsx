import { MessageSquare } from "lucide-react";
import ComingSoonSection from "@/components/dashboard/ComingSoonSection";

export default function DashboardMessagesPage() {
  return (
    <ComingSoonSection
      icon={MessageSquare}
      title="Messaging isn't set up yet"
      description={`Direct messaging with Arch Consult is coming in a later build stage. In the meantime, reach out at ${"archbusinessline@gmail.com"} or through the contact form.`}
    />
  );
}
