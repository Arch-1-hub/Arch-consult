import { requireStaff } from "@/lib/admin";
import ConsultantNav from "@/components/consultant/ConsultantNav";

export const metadata = { title: "Consultant", robots: { index: false, follow: false } };

export default async function ConsultantLayout({ children }: { children: React.ReactNode }) {
  await requireStaff();
  return (
    <div className="mx-auto max-w-content px-6 py-12">
      <p className="text-xs uppercase tracking-wide2 text-gold">Consultant</p>
      <h1 className="mt-2 font-display text-3xl text-paper-white">Your clients</h1>
      <ConsultantNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
