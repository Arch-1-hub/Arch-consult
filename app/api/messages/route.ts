import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Sends a message into a client's thread. Uses the signed-in user's own
// session (not an admin/service client), so the database's own rules decide
// whether this particular person may post into this particular thread —
// nothing here second-guesses that.
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const b = await req.json().catch(() => null);
  if (!b || typeof b.clientId !== "string" || !UUID.test(b.clientId)) {
    return NextResponse.json({ error: "Invalid thread." }, { status: 400 });
  }
  const body = typeof b.body === "string" ? b.body.trim() : "";
  if (!body) return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  if (body.length > 4000) {
    return NextResponse.json({ error: "Message is too long (4000 characters max)." }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const sender_role = profile?.role;
  if (sender_role !== "client" && sender_role !== "consultant" && sender_role !== "admin") {
    return NextResponse.json({ error: "Account not recognized." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ client_id: b.clientId, sender_id: user.id, sender_role, body })
    .select("id, sender_id, sender_role, body, created_at")
    .single();

  if (error) {
    // Most likely cause: this person isn't actually allowed to post into
    // this thread (not the client, not their assigned consultant).
    return NextResponse.json(
      { error: "You don't have permission to send a message in this thread." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true, message: data });
}
