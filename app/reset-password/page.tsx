import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Request a password reset link for your Arch Consult account.",
};

export default function ResetPasswordPage() {
  return (
    <>
      <PageHero
        eyebrow="Reset Password"
        title="We'll send you a reset link."
        description="Enter the email associated with your account."
      />
      <section className="py-16 lg:py-24">
        <div className="container-arch max-w-md">
          <ResetPasswordForm />
        </div>
      </section>
    </>
  );
}
