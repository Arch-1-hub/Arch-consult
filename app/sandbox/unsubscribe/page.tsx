import UnsubscribeButton from "@/components/sandbox/UnsubscribeButton";
import { emailSecret, verifyEmailToken } from "@/lib/sandbox/briefing/unsubscribe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

export default function UnsubscribePage({ searchParams }: { searchParams: { e?: string; t?: string } }) {
  const email = (searchParams.e ?? "").trim().toLowerCase();
  const token = searchParams.t ?? "";
  const valid = email.length > 3 && email.length < 255 && verifyEmailToken(email, token, emailSecret(process.env));

  return (
    <section className="py-20">
      <div className="container-arch flex max-w-xl flex-col gap-5">
        <p className="eyebrow">Business Sandbox</p>
        <h1 className="font-display text-3xl text-paper-white">Monthly briefings</h1>
        {valid ? (
          <>
            <p className="text-sm leading-relaxed text-ash">
              Stop sending the monthly business briefing to <strong className="text-paper-white">{email}</strong>? Your Sandbox access
              and everything else on your account stay exactly as they are.
            </p>
            <UnsubscribeButton email={email} token={token} />
          </>
        ) : (
          <p className="text-sm leading-relaxed text-ash">
            This unsubscribe link is not valid or is incomplete. Please use the link in the most recent briefing email, or write to us
            and we will remove you.
          </p>
        )}
      </div>
    </section>
  );
}
