import type { Metadata } from "next";
import { Mail, MapPin } from "lucide-react";
import PageHero from "@/components/shared/PageHero";
import ContactForm from "@/components/contact/ContactForm";
import Button from "@/components/ui/Button";
import { site } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Arch Consult, or book a consultation directly.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Tell us what you're working on."
        description="Reach out directly, or book a consultation if you already know you want to talk strategy."
      />

      <section className="py-16 lg:py-24">
        <div className="container-arch grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 text-gold" strokeWidth={1.5} />
                <div>
                  <p className="text-sm text-paper-white">Email</p>
                  <a
                    href={`mailto:${site.email}`}
                    className="text-sm text-ash hover:text-gold"
                  >
                    {site.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 text-gold" strokeWidth={1.5} />
                <div>
                  <p className="text-sm text-paper-white">Location</p>
                  <p className="text-sm text-ash">{site.location}</p>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-ink-line pt-8">
              <p className="text-sm leading-relaxed text-ash">
                Already know you want to talk strategy directly?
              </p>
              <div className="mt-4">
                <Button href="/book-consultation" showArrow>
                  Book a Consultation
                </Button>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
