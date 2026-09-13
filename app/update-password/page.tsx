import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";

export const metadata: Metadata = {
  title: "Set a New Password",
  description: "Set a new password for your Arch Consult account.",
};

export default function UpdatePasswordPage() {
  return (
    <>
      <PageHero eyebrow="Reset Password" title="Set a new password." />
      <section className="py-16 lg:py-24">
        <div className="container-arch max-w-md">
          <UpdatePasswordForm />
        </div>
      </section>
    </>
  );
}
