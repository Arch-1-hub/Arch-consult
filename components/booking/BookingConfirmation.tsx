import { CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default function BookingConfirmation({
  details,
}: {
  details: Record<string, string>;
}) {
  const formattedDate = details.preferredDate
    ? new Date(details.preferredDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start gap-3 border border-ink-line bg-ink-soft p-8">
        <CheckCircle2 className="text-gold" size={28} strokeWidth={1.5} />
        <h2 className="font-display text-xl text-paper-white">
          Consultation requested
        </h2>
        <p className="text-sm leading-relaxed text-ash">
          Thanks, {details.name?.split(" ")[0] || "there"} — your request has
          been received. Arch Consult will confirm the exact timing by
          email at {details.email}.
        </p>
      </div>

      <div className="border-t border-ink-line pt-6">
        <p className="eyebrow">Request Summary</p>
        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <Row label="Type" value={details.consultationType} />
          <Row label="Preferred date" value={formattedDate} />
          <Row label="Preferred time" value={details.preferredTime} />
          {details.businessName && <Row label="Business" value={details.businessName} />}
        </dl>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button href="/" showArrow>
          Back to Home
        </Button>
        <Button href="/ai-consultant" variant="outline-dark">
          Talk to the AI Consultant Meanwhile
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between border-b border-ink-line pb-2">
      <dt className="text-ash">{label}</dt>
      <dd className="text-paper-white">{value}</dd>
    </div>
  );
}
