import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-session";
import { adminSwitchCampaignSchema } from "@/lib/validators";
import { setActiveCampaignForAdmin } from "@/lib/data";
import { COPY } from "@/lib/constants";

export async function POST(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ ok: false, message: COPY.errors.validation }, { status: 401 });
  }

  const parsed = adminSwitchCampaignSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: COPY.errors.validation }, { status: 400 });
  }

  try {
    const campaign = await setActiveCampaignForAdmin(parsed.data.campaignId);
    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : COPY.errors.generic;
    console.error("[api/admin/switch-campaign] gagal ganti campaign aktif", error);
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
