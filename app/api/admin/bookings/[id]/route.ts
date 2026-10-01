import { NextResponse } from "next/server";
import { getStaffOrNull } from "@/lib/admin";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Admins AND consultants may call this. The database's own rules are what
// actually decide which bookings a consultant can touch (only their
// assigned clients') — this route just checks "are you staff at all".
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const staff = await getStaffOrNull();
  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!UUID.test(params.id)) {
    return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const notes =
    typeof body.admin_notes === "string"
      ? body.admin_notes.slice(0, 2000)
      : null;

  const { data, error } = await staff.supabase
    .from("bookings")
    .update({ status: body.status, admin_notes: notes })
    .eq("id", params.id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Booking not updated" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
