import { NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/admin";

export async function PUT(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const b = await req.json().catch(() => null);
  if (!b || typeof b.clientId !== "string") {
    return NextResponse.json({ error: "Missing client" }, { status: 400 });
  }

  if (!b.consultantId) {
    const { error } = await admin.supabase
      .from("client_assignments")
      .delete()
      .eq("client_id", b.clientId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (typeof b.consultantId !== "string") {
    return NextResponse.json({ error: "Invalid consultant" }, { status: 400 });
  }

  const { error } = await admin.supabase.from("client_assignments").upsert({
    client_id: b.clientId,
    consultant_id: b.consultantId,
    assigned_by: admin.user.id,
    assigned_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
