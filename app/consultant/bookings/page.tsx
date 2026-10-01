import { requireStaff } from "@/lib/admin";
import BookingRow from "@/components/admin/BookingRow";

export const dynamic = "force-dynamic";

// Reuses the same BookingRow component the admin bookings page uses — the
// database itself only ever returns bookings for this consultant's assigned
// clients, so no extra filtering is needed here.
export default async function ConsultantBookings() {
  const { supabase } = await requireStaff();

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return <p className="text-ash">Could not load bookings: {error.message}</p>;
  if (!data || data.length === 0) {
    return <p className="text-ash">No bookings from your assigned clients yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {data.map((b) => (
        <BookingRow key={b.id} b={b} />
      ))}
    </ul>
  );
}
