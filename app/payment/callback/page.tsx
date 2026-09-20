import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import PageHero from "@/components/shared/PageHero";
import Button from "@/components/ui/Button";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParams = {
  reference?: string;
  trxref?: string;
};

async function verifyAndRecord(reference: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return { ok: false, reason: "Payments aren't fully configured in this environment." };
  }

  const admin = createAdminClient();

  const { data: pending } = await admin
    .from("payments")
    .select("id, amount, currency, tx_ref, status")
    .eq("tx_ref", reference)
    .single();

  if (!pending) {
    return { ok: false, reason: "We couldn't find a matching payment record." };
  }

  if (pending.status === "successful") {
    // Already verified in an earlier visit to this page — don't
    // re-verify, just confirm.
    return { ok: true, alreadyVerified: true };
  }

  // The one step that actually matters: ask Paystack directly whether
  // this transaction really succeeded. Never trust the redirect's own
  // query params for that — they're just for routing the user back here.
  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );
  const verifyData = await verifyRes.json();

  const txn = verifyData?.data;
  // Paystack returns amount in kobo; our stored amount is in whole NGN.
  const isGenuinelySuccessful =
    verifyRes.ok &&
    verifyData.status === true &&
    txn?.status === "success" &&
    txn?.reference === reference &&
    txn?.currency === pending.currency &&
    Number(txn?.amount) >= Math.round(Number(pending.amount) * 100);

  if (!isGenuinelySuccessful) {
    await admin.from("payments").update({ status: "failed" }).eq("tx_ref", reference);
    return { ok: false, reason: "Payment could not be verified as successful." };
  }

  await admin
    .from("payments")
    .update({
      status: "successful",
      provider_reference: String(txn.reference),
      verified_at: new Date().toISOString(),
    })
    .eq("tx_ref", reference);

  return { ok: true, alreadyVerified: false };
}

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const reference = searchParams.reference || searchParams.trxref;

  if (!reference) {
    return (
      <>
        <PageHero eyebrow="Payment" title="Something's missing" />
        <Result
          icon={AlertCircle}
          heading="Incomplete payment reference"
          body="We didn't receive enough information to verify this payment. If you completed a payment, contact archbusinessline@gmail.com with your confirmation email from Paystack."
        />
      </>
    );
  }

  const result = await verifyAndRecord(reference);

  if (!result.ok) {
    return (
      <>
        <PageHero eyebrow="Payment" title="Payment not confirmed" />
        <Result
          icon={XCircle}
          heading="We couldn't confirm this payment"
          body={`${result.reason} If you believe this is wrong and money left your account, contact archbusinessline@gmail.com with your Paystack confirmation and reference ${reference}.`}
        />
      </>
    );
  }

  return (
    <>
      <PageHero eyebrow="Payment" title="Payment successful" />
      <Result
        icon={CheckCircle2}
        heading="Thank you — your payment is confirmed"
        body="A record of this payment is saved to your account if you were logged in when you paid. Arch Consult will be in touch to get started."
        success
      />
    </>
  );
}

function Result({
  icon: Icon,
  heading,
  body,
  success = false,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  heading: string;
  body: string;
  success?: boolean;
}) {
  return (
    <section className="py-16 lg:py-24">
      <div className="container-arch max-w-lg">
        <div className="flex flex-col items-start gap-4 border border-ink-line bg-ink-soft p-8">
          <Icon size={28} className={success ? "text-gold" : "text-ash"} strokeWidth={1.5} />
          <h2 className="font-display text-xl text-paper-white">{heading}</h2>
          <p className="text-sm leading-relaxed text-ash">{body}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/" showArrow>
            Back to Home
          </Button>
          {success && (
            <Button href="/dashboard" variant="outline-dark">
              View in Dashboard
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
