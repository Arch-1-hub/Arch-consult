import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_TYPES, MAX_FILE_BYTES, sanitizeFileName } from "@/lib/documents";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "That file type isn't supported. Use PDF, PNG, JPG, or ZIP." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File is too large. Maximum size is 15 MB." }, { status: 400 });
  }

  const note = typeof form?.get("note") === "string" ? String(form.get("note")).slice(0, 300) : null;
  const cleanName = sanitizeFileName(file.name || "file");
  const path = `${user.id}/${crypto.randomUUID()}-${cleanName}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from("documents").upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  const { error: dbError } = await supabase.from("documents").insert({
    owner_id: user.id,
    uploaded_by: user.id,
    uploaded_by_role: "client",
    file_path: path,
    file_name: cleanName,
    file_type: file.type,
    file_size: file.size,
    note,
  });
  if (dbError) {
    await supabase.storage.from("documents").remove([path]);
    return NextResponse.json({ error: "Could not save the document record." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
