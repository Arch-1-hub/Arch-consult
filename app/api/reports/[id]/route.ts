import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  // RLS also enforces this server-side, but checking user_id explicitly
  // here means a mismatched id returns a clear 404 rather than relying
  // solely on the database's silent zero-row deletion.
  const { error } = await supabase.from("reports").delete().eq("id", params.id).eq("user_id", user.id);

  if (error) {
    console.error("[reports] Delete error:", error);
    return NextResponse.json({ error: "Couldn't delete this report." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
