import { requireAdmin } from "@/lib/admin";
import BookingRow from "@/components/admin/BookingRow";

export const dynamic = "force-dynamic";

export default async function AdminBookings() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="text-ash">Could not load bookings: {error.message}</p>
    );
  }
  if (!data || data.length === 0) {
    return <p className="text-ash">No bookings yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {data.map((b) => (
        <BookingRow key={b.id} b={b} />
      ))}
    </ul>
  );
}
