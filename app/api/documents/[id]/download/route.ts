import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!UUID.test(params.id)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  const { data: doc, error } = await supabase
    .from("documents")
    .select("file_path, file_name")
    .eq("id", params.id)
    .single();
  if (error || !doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 60, { download: doc.file_name });
  if (signError || !signed) {
    return NextResponse.json({ error: "Could not create download link." }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
