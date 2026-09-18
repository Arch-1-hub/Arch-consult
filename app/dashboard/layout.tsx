import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/dashboard/DashboardNav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!supabaseConfigured) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container-arch max-w-md text-sm leading-relaxed text-ash">
          Accounts aren&apos;t configured yet in this environment, so the
          dashboard isn&apos;t available. See the README for setup steps.
        </div>
      </section>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <section className="border-b border-ink-line py-12 lg:py-16">
      <div className="container-arch">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 className="mt-3 font-display text-3xl text-paper-white sm:text-4xl">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
            </h1>
          </div>
          <a href="/account" className="text-sm text-ash hover:text-gold">
            Profile settings →
          </a>
        </div>

        <div className="mt-10">
          <DashboardNav />
          <div className="pt-10">{children}</div>
        </div>
      </div>
    </section>
  );
}
