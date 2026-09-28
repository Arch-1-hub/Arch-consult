import { requireAdmin } from "@/lib/admin";
import PricingEditor from "@/components/admin/PricingEditor";

export const dynamic = "force-dynamic";

export default async function AdminPricing() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("pricing_packages")
    .select("*")
    .order("sort_order");

  if (error) {
    return (
      <p className="text-ash">
        Could not load pricing: {error.message}. Make sure 006_pricing.sql has
        been run in Supabase.
      </p>
    );
  }
  if (!data || data.length === 0) {
    return (
      <p className="text-ash">
        No packages found. Run 006_pricing.sql in Supabase to add them.
      </p>
    );
  }

  return <PricingEditor initial={data} />;
}
