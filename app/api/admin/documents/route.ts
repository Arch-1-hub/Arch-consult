import { NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/admin";
import { ALLOWED_TYPES, MAX_FILE_BYTES, sanitizeFileName } from "@/lib/documents";

export async function POST(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const ownerId = form?.get("ownerId");
  if (typeof ownerId !== "string" || !ownerId) {
    return NextResponse.json({ error: "Choose a client to send this to." }, { status: 400 });
  }
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
  const path = `${ownerId}/${crypto.randomUUID()}-${cleanName}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await admin.supabase.storage.from("documents").upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  const { error: dbError } = await admin.supabase.from("documents").insert({
    owner_id: ownerId,
    uploaded_by: admin.user.id,
    uploaded_by_role: "admin",
    file_path: path,
    file_name: cleanName,
    file_type: file.type,
    file_size: file.size,
    note,
  });
  if (dbError) {
    await admin.supabase.storage.from("documents").remove([path]);
    return NextResponse.json({ error: "Could not save the document record." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
