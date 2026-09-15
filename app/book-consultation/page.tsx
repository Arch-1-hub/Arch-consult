import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import BookingForm from "@/components/booking/BookingForm";

export const metadata: Metadata = {
  title: "Book a Consultation",
  description: "Book a consultation with Arch Consult — select a consultation type, date and time.",
};

export default function BookConsultationPage() {
  return (
    <>
      <PageHero
        eyebrow="Book a Consultation"
        title="Let's talk about your business."
        description="Choose what you'd like to cover and a preferred time — Arch Consult will confirm the exact details by email."
      />
      <section className="py-16 lg:py-24">
        <div className="container-arch max-w-2xl">
          <BookingForm />
        </div>
      </section>
    </>
  );
}
