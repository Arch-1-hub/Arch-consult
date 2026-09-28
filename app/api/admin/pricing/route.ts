import { NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/admin";

export async function PUT(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const b = await req.json().catch(() => null);
  const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

  if (!b || typeof b.slug !== "string") return bad("Missing package");
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const price = typeof b.price === "string" ? b.price.trim() : "";
  const cadence = typeof b.cadence === "string" ? b.cadence.trim() : "";
  if (!name || name.length > 80) return bad("Name is required (max 80 characters)");
  if (!price || price.length > 40) return bad("Price label is required (max 40 characters)");
  if (!cadence || cadence.length > 40) return bad("Cadence is required (max 40 characters)");

  const description = typeof b.description === "string" ? b.description.slice(0, 500) : "";
  if (!Array.isArray(b.features)) return bad("Invalid features");
  const features = b.features
    .map((f: unknown) => String(f).trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, 20);

  let amount: number | null = null;
  if (b.amount_ngn !== null && b.amount_ngn !== undefined) {
    amount = Number(b.amount_ngn);
    if (!Number.isInteger(amount) || amount < 1 || amount > 100_000_000) {
      return bad("Charge amount must be a whole number of naira, or empty");
    }
  }

  const { data, error } = await admin.supabase
    .from("pricing_packages")
    .update({
      name,
      price,
      cadence,
      description,
      features,
      highlighted: !!b.highlighted,
      is_placeholder: !!b.is_placeholder,
      amount_ngn: amount,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", b.slug)
    .select("slug");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Package not found or not allowed" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
