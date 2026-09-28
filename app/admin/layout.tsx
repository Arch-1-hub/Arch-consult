import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-content px-6 py-12">
      <p className="text-xs uppercase tracking-wide2 text-gold">Admin</p>
      <h1 className="mt-2 font-display text-3xl text-paper-white">
        Arch Consult control room
      </h1>
      <AdminNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
