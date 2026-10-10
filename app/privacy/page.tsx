import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Arch Branding Consult",
  description: "How Arch Branding Consult collects, uses and protects your personal data.",
};

const UPDATED = "October 10, 2026";
const EMAIL = "hello@archbrandingconsult.online";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm opacity-70">Last updated: {UPDATED}</p>

      <div className="mt-8 space-y-8 leading-relaxed [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
        <section>
          <p>
            Arch Branding Consult (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates in Nigeria and provides
            branding and business consultancy services through this website. This policy explains what personal
            data we collect, why we collect it, and your rights under the Nigeria Data Protection Act 2023 (NDPA).
          </p>
        </section>

        <section>
          <h2>1. Data we collect</h2>
          <ul>
            <li>Account details: your name, email address and password (stored in encrypted form).</li>
            <li>Booking and project details: the services you book, session information, messages you send to your consultant, and project progress.</li>
            <li>Files you upload to share with us, such as documents and brand materials.</li>
            <li>Payment information: payments are handled by Paystack. We receive confirmation and transaction references, but we do not see or store your full card details.</li>
            <li>Technical data: basic information such as browser type and IP address, collected through our hosting and security systems.</li>
          </ul>
        </section>

        <section>
          <h2>2. How we use your data</h2>
          <ul>
            <li>To create and manage your account and deliver the services you book.</li>
            <li>To process payments and keep records of transactions.</li>
            <li>To send account emails, such as password resets, confirmations and booking updates.</li>
            <li>To communicate with you about your projects and respond to your questions.</li>
            <li>To keep the website secure and to meet our legal obligations.</li>
          </ul>
          <p className="mt-3">Our legal bases are your consent, the performance of our contract with you, and our legitimate interests in running a secure service.</p>
        </section>

        <section>
          <h2>3. Who we share data with</h2>
          <p>We do not sell your personal data. We share it only with service providers that help us run the website:</p>
          <ul>
            <li>Supabase, for database, login and file storage.</li>
            <li>Paystack, for payment processing.</li>
            <li>Resend, for sending emails.</li>
            <li>Vercel, for website hosting.</li>
          </ul>
          <p className="mt-3">
            Your assigned consultant and our administrators can see the information needed to serve you, such as your
            bookings, shared documents and messages. Some of these providers store data outside Nigeria. Where that
            happens, we rely on providers that apply appropriate safeguards. We may also disclose data where the law
            requires it.
          </p>
        </section>

        <section>
          <h2>4. How long we keep data</h2>
          <p>
            We keep your data for as long as your account is active and for as long as needed to meet legal, tax and
            accounting requirements. You can ask us to delete your account and data at any time, subject to those
            requirements.
          </p>
        </section>

        <section>
          <h2>5. Your rights</h2>
          <p>Under the NDPA you may:</p>
          <ul>
            <li>Ask for a copy of the personal data we hold about you.</li>
            <li>Ask us to correct data that is wrong or incomplete.</li>
            <li>Ask us to delete your data, or restrict how we use it.</li>
            <li>Object to our processing, or withdraw your consent at any time.</li>
            <li>Ask for your data in a portable format.</li>
            <li>Complain to the Nigeria Data Protection Commission if you believe your rights have been breached.</li>
          </ul>
          <p className="mt-3">To use any of these rights, email us at {EMAIL}.</p>
        </section>

        <section>
          <h2>6. Security</h2>
          <p>
            We use access controls, encrypted connections (HTTPS) and trusted providers to protect your data. No
            online service is completely secure, so we cannot guarantee absolute security, but we act quickly if we
            discover a problem.
          </p>
        </section>

        <section>
          <h2>7. Cookies</h2>
          <p>
            We use only the cookies needed to keep you signed in and to make the website work. We do not use
            advertising cookies.
          </p>
        </section>

        <section>
          <h2>8. Children</h2>
          <p>Our services are for adults. We do not knowingly collect data from anyone under 18.</p>
        </section>

        <section>
          <h2>9. Changes to this policy</h2>
          <p>
            We may update this policy from time to time. The date at the top shows when it was last changed. If we
            make important changes, we will tell you by email or on the website.
          </p>
        </section>

        <section>
          <h2>10. Contact us</h2>
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
