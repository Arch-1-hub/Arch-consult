import type { Metadata } from "next";
import { Suspense } from "react";
import PageHero from "@/components/shared/PageHero";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your Arch Consult client account.",
};

export default function LoginPage() {
  return (
    <>
      <PageHero eyebrow="Welcome Back" title="Log in to your account." />
      <section className="py-16 lg:py-24">
        <div className="container-arch max-w-md">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
