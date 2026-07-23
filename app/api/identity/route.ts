import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const fullName = String(body.fullName ?? "").trim().replace(/\s+/g, " ");
  const nip = String(body.nip ?? "");
  if (fullName.length < 3 || !/[a-z]/i.test(fullName) || !/^\d+$/.test(nip)) return NextResponse.json({ error: "Data belum sesuai. Cek deui nama dan NIP-nya, ya." }, { status: 400 });
  const normalizedName = fullName.toLowerCase();
  // Replace this response with a service-role Supabase upsert. The browser never writes participant data directly.
  return NextResponse.json({ participant: { fullName, normalizedName, uniqueKey: nip === "00000" ? `00000:${normalizedName}` : nip } });
}
