import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Arch Branding Consult",
  description: "The terms that apply when you use Arch Branding Consult and book our services.",
};

const UPDATED = "October 10, 2026";
const EMAIL = "hello@archbrandingconsult.online";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Terms of Service</h1>
      <p className="mt-2 text-sm opacity-70">Last updated: {UPDATED}</p>

      <div className="mt-8 space-y-8 leading-relaxed [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
        <section>
          <p>
            These terms apply when you use the Arch Branding Consult website and book our services. By creating an
            account, making a booking or paying, you agree to them. If you do not agree, please do not use the site.
          </p>
        </section>

        <section>
          <h2>1. Our services</h2>
          <p>
            We provide branding and business consultancy services, including consultations, projects, document
            exchange and messaging with your assigned consultant. The details and price of each service are shown on
            the website at the time you book.
          </p>
        </section>

        <section>
          <h2>2. Your account</h2>
          <ul>
            <li>You must give accurate information and be at least 18 years old.</li>
            <li>You are responsible for keeping your password safe and for all activity on your account.</li>
            <li>Tell us straight away if you think someone else has accessed your account.</li>
          </ul>
        </section>

        <section>
          <h2>3. Bookings and payments</h2>
          <ul>
            <li>Prices are shown in Nigerian Naira unless stated otherwise.</li>
            <li>Payment is made online through Paystack and is required to confirm a booking.</li>
            <li>We may change our prices at any time. A change does not affect a booking that is already paid for.</li>
          </ul>
        </section>

        <section>
          <h2>4. No refunds</h2>
          <p>
            All payments are final and non-refundable. This applies to cancelled bookings, missed sessions and
            services you decide not to use. If a payment error occurs, such as being charged twice for the same
            booking, contact us at {EMAIL} and we will correct it.
          </p>
        </section>

        <section>
          <h2>5. Your responsibilities</h2>
          <ul>
            <li>Give us the information and materials we need to do the work, on time.</li>
            <li>Only upload content that you own or have the right to share.</li>
            <li>Do not misuse the website, attempt to break its security, or use it for anything unlawful.</li>
          </ul>
        </section>

        <section>
          <h2>6. Intellectual property</h2>
          <p>
            You keep ownership of the materials you give us. Once a project is fully paid for, you own the final
            deliverables made specifically for you. We keep ownership of our website, tools, templates and general
            know-how, and we may reuse general methods that do not include your confidential information.
          </p>
        </section>

        <section>
          <h2>7. Confidentiality and privacy</h2>
          <p>
            We treat the business information you share with us as confidential and use it only to deliver your
            services. See our <a className="underline" href="/privacy">Privacy Policy</a> for how we handle personal
            data.
          </p>
        </section>

        <section>
          <h2>8. No guarantee of results</h2>
          <p>
            Our advice and work are provided in good faith and with professional care, but business outcomes depend on
            many factors outside our control. We do not guarantee any particular result, such as sales, growth or
            funding. Our advice is not legal, tax or financial advice.
          </p>
        </section>

        <section>
          <h2>9. Limit of liability</h2>
          <p>
            To the fullest extent the law allows, we are not liable for indirect or consequential losses, such as lost
            profit or lost opportunity. Our total liability for any claim is limited to the amount you paid us for the
            service the claim relates to. Nothing in these terms limits liability that cannot be limited by law.
          </p>
        </section>

        <section>
          <h2>10. Availability</h2>
          <p>
            We aim to keep the website available, but we do not promise it will always be uninterrupted or free of
            errors. We may suspend or end an account that breaks these terms.
          </p>
        </section>

        <section>
          <h2>11. Changes to these terms</h2>
          <p>
            We may update these terms from time to time. The date at the top shows the latest version. Continuing to
            use the site after a change means you accept the new terms.
          </p>
        </section>

        <section>
          <h2>12. Governing law</h2>
          <p>These terms are governed by the laws of the Federal Republic of Nigeria, and Nigerian courts have jurisdiction over any dispute.</p>
        </section>

        <section>
          <h2>13. Contact us</h2>
          <p>
            Arch Branding Consult, Nigeria
            <br />
            Email: <a className="underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
        </section>
      </div>
    </main>
  );
}
