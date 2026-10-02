import { NextResponse } from "next/server";
import { getStaffOrNull } from "@/lib/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ["planning", "in_progress", "review", "completed", "on_hold"];

// Create a project with POST id="new", or update an existing one with PUT.
// Either way, the database's own rules decide which client a consultant
// may touch — this route only checks "are you staff at all".

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const staff = await getStaffOrNull();
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Invalid project id" }, { status: 400 });

  const b = await req.json().catch(() => null);
  const bad = (error: string) => NextResponse.json({ error }, { status: 400 });
  if (!b) return bad("Missing data");

  const title = typeof b.title === "string" ? b.title.trim().slice(0, 120) : "";
  if (!title) return bad("Title is required");
  if (!STATUSES.includes(b.status)) return bad("Invalid status");
  const progress = Number(b.progress_percent);
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
    return bad("Progress must be a whole number from 0 to 100");
  }
  const summary = typeof b.summary === "string" ? b.summary.slice(0, 1000) : "";
  if (!Array.isArray(b.milestones)) return bad("Invalid milestones");
  const milestones = b.milestones
    .filter((m: any) => m && typeof m.title === "string" && m.title.trim())
    .map((m: any) => ({ title: String(m.title).trim().slice(0, 150), done: !!m.done }))
    .slice(0, 30);

  const { data, error } = await staff.supabase
    .from("projects")
    .update({ title, status: b.status, progress_percent: progress, summary, milestones, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "Not found or not allowed" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const staff = await getStaffOrNull();
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const b = await req.json().catch(() => null);
  const bad = (error: string) => NextResponse.json({ error }, { status: 400 });
  if (!b || typeof b.clientId !== "string" || !UUID.test(b.clientId)) return bad("Choose a client");

  const title = typeof b.title === "string" ? b.title.trim().slice(0, 120) : "";
  if (!title) return bad("Title is required");

  const { data, error } = await staff.supabase
    .from("projects")
    .insert({
      client_id: b.clientId,
      title,
      status: "planning",
      progress_percent: 0,
      summary: "",
      milestones: [],
      created_by: staff.user.id,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Could not create project. If you're a consultant, check this client is assigned to you." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, id: data.id });
}
