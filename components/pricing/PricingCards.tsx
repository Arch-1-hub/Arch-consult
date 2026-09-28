import { Check } from "lucide-react";
import Button from "@/components/ui/Button";
import PackageCheckoutButton from "./PackageCheckoutButton";
import { createClient } from "@/lib/supabase/server";
import { pricingPackages as fallbackPackages } from "@/lib/constants";

type CardPackage = {
  slug: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  amountNGN?: number;
  isPlaceholder: boolean;
};

// Prices come from the database (editable in /admin/pricing). If the
// database can't be reached, fall back to the static list in constants.ts
// so the pricing page never breaks.
async function getPackages(): Promise<CardPackage[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("pricing_packages")
      .select("*")
      .order("sort_order");
    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        slug: row.slug,
        name: row.name,
        price: row.price,
        cadence: row.cadence,
        description: row.description ?? "",
        features: Array.isArray(row.features) ? (row.features as string[]) : [],
        highlighted: row.highlighted,
        amountNGN: row.amount_ngn ? Number(row.amount_ngn) : undefined,
        isPlaceholder: !!row.is_placeholder,
      }));
    }
  } catch {
    // fall through to fallback
  }
  return fallbackPackages.map((p) => ({
    ...p,
    isPlaceholder: p.price === "Placeholder",
  }));
}

export default async function PricingCards() {
  const packages = await getPackages();
  const showPlaceholderNote = packages.some((p) => p.isPlaceholder);

  return (
    <section className="border-b border-ink-line py-16 lg:py-24">
      <div className="container-arch">
        {showPlaceholderNote && (
          <div className="mb-10 border border-gold/30 bg-ink-soft p-5 text-sm leading-relaxed text-ash">
            <span className="text-gold">Note:</span> pricing shown is a
            placeholder to illustrate package structure and has not been
            finalized. Book a consultation for a confirmed quote.
          </div>
        )}

        <div className="grid gap-px overflow-hidden bg-ink-line sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => (
            <div
              key={pkg.slug}
              className={`flex flex-col bg-ink p-7 ${
                pkg.highlighted ? "ring-1 ring-inset ring-gold" : ""
              }`}
            >
              {pkg.highlighted && (
                <span className="mb-3 w-fit bg-gold px-2 py-0.5 text-[11px] font-medium text-ink">
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-xl text-paper-white">
                {pkg.name}
              </h3>
              <p className="mt-1 text-xs text-ash">{pkg.description}</p>

              <div className="mt-5">
                <span className="font-display text-2xl text-gold">
                  {pkg.price}
                </span>
                <span className="ml-1 text-xs text-ash">{pkg.cadence}</span>
              </div>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-ash">
                    <Check size={14} className="mt-0.5 shrink-0 text-gold" strokeWidth={2} />
                    {feature}
                  </li>
                ))}
              </ul>

              {pkg.amountNGN ? (
                <PackageCheckoutButton
                  itemName={`${pkg.name} Package`}
                  amount={pkg.amountNGN}
                  highlighted={pkg.highlighted}
                />
              ) : (
                <Button
                  href="/book-consultation"
                  variant={pkg.highlighted ? "primary" : "outline-dark"}
                  className="mt-8 w-full"
                >
                  {pkg.slug === "custom-enterprise" ? "Request a Quote" : "Get Started"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
