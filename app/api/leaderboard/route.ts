import { NextResponse } from "next/server";

export async function GET() { return NextResponse.json({ campaignCode: "CR-C01", entries: [] }); }

export async function POST(request: Request) {
  const { passcode } = await request.json();
  if (!process.env.LEADERBOARD_PASSCODE || passcode !== process.env.LEADERBOARD_PASSCODE) return NextResponse.json({ error: "Passcode belum cocok. Cek deui, ya." }, { status: 401 });
  // Query must select public leaderboard fields only: name, score, completed count, and completion time; never NIP.
  return NextResponse.json({ entries: [] });
}
