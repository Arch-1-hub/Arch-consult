import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import BookingForm from "@/components/booking/BookingForm";
import BookingPrefill from "@/components/booking/BookingPrefill";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadSim } from "@/lib/sandbox/briefing/server";
import { growthFacts } from "@/lib/sandbox/briefing/growth";
import { buildBookingNotes, UUID_RE } from "@/lib/sandbox/booking-summary";
import { profileTitle } from "@/lib/sandbox/profile";

export const metadata: Metadata = {
  title: "Book a Consultation",
  description: "Book a consultation with Arch Consult - select a consultation type, date and time.",
};

export const dynamic = "force-dynamic";

async function simulationPrefill(simId: string | undefined) {
  if (!simId || !UUID_RE.test(simId)) return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const sim = await loadSim(createAdminClient(), simId, user.id);
    if (!sim) return null;
    const businessName = sim.inputs.businessName?.trim() || "";
    const title = profileTitle(sim.profile, businessName);
    return {
      email: user.email ?? "",
      businessName,
      goals: buildBookingNotes({
        simId,
        title,
        description: sim.profile.description,
        area: sim.profile.area,
        state: sim.state,
        facts: growthFacts(sim.inputs, sim.ctx),
      }),
    };
  } catch {
    return null;
  }
}

export default async function BookConsultationPage({ searchParams }: { searchParams: { sim?: string } }) {
  const prefill = await simulationPrefill(searchParams.sim);
  return (
    <>
      <PageHero
        eyebrow="Book a Consultation"
        title="Let's talk about your business."
        description="Choose what you'd like to cover and a preferred time - Arch Consult will confirm the exact details by email."
      />
      <section className="py-16 lg:py-24">
        <div className="container-arch max-w-2xl">
          {prefill ? <BookingPrefill {...prefill} /> : null}
          <BookingForm />
        </div>
      </section>
    </>
  );
}
