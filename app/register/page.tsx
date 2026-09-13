import type { Metadata } from "next";
import PageHero from "@/components/shared/PageHero";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create an Account",
  description: "Create an Arch Consult client account.",
};

export default function RegisterPage() {
  return (
    <>
      <PageHero eyebrow="Get Started" title="Create your Arch Consult account." />
      <section className="py-16 lg:py-24">
        <div className="container-arch max-w-md">
          <RegisterForm />
        </div>
      </section>
    </>
  );
}
