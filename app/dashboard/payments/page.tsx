import { CreditCard } from "lucide-react";
import ComingSoonSection from "@/components/dashboard/ComingSoonSection";

export default function DashboardPaymentsPage() {
  return (
    <ComingSoonSection
      icon={CreditCard}
      title="Payments aren't set up yet"
      description="Invoices, payment status and receipts will appear here once Flutterwave payment processing is connected in a later build stage."
    />
  );
}
