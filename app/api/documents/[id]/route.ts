import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!UUID.test(params.id)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", params.id)
    .single();

  const { error, data } = await supabase
    .from("documents")
    .delete()
    .eq("id", params.id)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Not found or not allowed." }, { status: 404 });
  }
  if (doc?.file_path) {
    await supabase.storage.from("documents").remove([doc.file_path]);
  }
  return NextResponse.json({ ok: true });
}
