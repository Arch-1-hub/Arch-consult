import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardBookingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, consultation_type, preferred_date, preferred_time, status, business_name, goals")
    .eq("user_id", user!.id)
    .order("preferred_date", { ascending: false });

  const upcoming = bookings?.filter((b) => b.preferred_date >= today) ?? [];
  const past = bookings?.filter((b) => b.preferred_date < today) ?? [];

  return (
    <div className="flex flex-col gap-12">
      <div>
        <p className="eyebrow">Upcoming Consultations</p>
        {upcoming.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3">
            {upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-ash">
            No upcoming consultations.{" "}
            <Link href="/book-consultation" className="text-gold hover:text-gold-light">
              Book one
            </Link>
            .
          </p>
        )}
      </div>

      <div>
        <p className="eyebrow">Past Consultations</p>
        {past.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3">
            {past.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-ash">No past consultations yet.</p>
        )}
      </div>
    </div>
  );
}

function BookingRow({
  booking,
}: {
  booking: {
    id: string;
    consultation_type: string;
    preferred_date: string;
    preferred_time: string;
    status: string;
    business_name: string | null;
    goals: string | null;
  };
}) {
  return (
    <div className="border border-ink-line p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-paper-white">{booking.consultation_type}</p>
        <span className="border border-ink-line px-2 py-0.5 text-[11px] capitalize text-ash">
          {booking.status}
        </span>
      </div>
      <p className="mt-2 text-xs text-ash">
        {new Date(booking.preferred_date + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}{" "}
        · {booking.preferred_time}
      </p>
      {booking.business_name && (
        <p className="mt-1 text-xs text-ash">Business: {booking.business_name}</p>
      )}
      {booking.goals && <p className="mt-2 text-xs leading-relaxed text-ash">{booking.goals}</p>}
    </div>
  );
}
