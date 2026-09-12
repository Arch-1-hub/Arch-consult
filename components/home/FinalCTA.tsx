import Button from "@/components/ui/Button";

export default function FinalCTA() {
  return (
    <section className="py-24 lg:py-32">
      <div className="container-arch flex flex-col items-start gap-8 lg:items-center lg:text-center">
        <h2 className="max-w-2xl font-display text-3xl leading-tight text-paper-white sm:text-4xl lg:text-5xl">
          Your business already has potential. Give it a structure.
        </h2>
        <p className="max-w-md text-[15px] leading-relaxed text-ash">
          Start with a free diagnostic, talk to the AI consultant, or book
          time with our team directly.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/launch-wizard" size="lg">
            Start Your Business
          </Button>
          <Button href="/book-consultation" variant="outline-dark" size="lg">
            Book a Consultation
          </Button>
        </div>
      </div>
    </section>
  );
}
