import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageHero from "@/components/shared/PageHero";
import ProfileForm from "@/components/auth/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: "Your Account",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!supabaseConfigured) {
    return (
      <>
        <PageHero eyebrow="Your Account" title="Accounts aren't configured yet." />
        <section className="py-16 lg:py-24">
          <div className="container-arch max-w-md text-sm leading-relaxed text-ash">
            Supabase credentials haven&apos;t been added to this environment
            yet, so accounts can&apos;t be created or accessed. See the
            README for setup steps.
          </div>
        </section>
      </>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/account");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, business_name")
    .eq("id", user.id)
    .single();

  return (
    <>
      <PageHero eyebrow="Your Account" title="Manage your profile." />
      <section className="py-16 lg:py-24">
        <div className="container-arch max-w-md">
          <ProfileForm
            email={user.email || ""}
            fullName={profile?.full_name || ""}
            businessName={profile?.business_name || ""}
          />

          <form action={signOutAction} className="mt-10 border-t border-ink-line pt-8">
            <button type="submit" className="text-sm text-ash hover:text-gold">
              Log out
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
