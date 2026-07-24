import { redirect } from "next/navigation";
import { IdentityForm } from "@/components/identity/identity-form";
import { KangCageur } from "@/components/ui/kang-cageur";
import { Card } from "@/components/ui/card";
import { COPY } from "@/lib/constants";
import { getParticipantIdFromSession } from "@/lib/session";
import { getParticipantById } from "@/lib/data";

export default async function IdentityPage() {
  const participantId = await getParticipantIdFromSession();
  if (participantId) {
    const participant = await getParticipantById(participantId);
    if (participant) redirect("/hub");
  }

  return (
    <div className="flex flex-col gap-6 pb-6 pt-2">
      <div className="flex flex-col items-center gap-3 text-center">
        <KangCageur pose="clipboard" size={128} />
        <h1 className="font-display text-[26px] font-extrabold text-navy-900">{COPY.identity.title}</h1>
        <p className="text-base font-bold text-teal-600">{COPY.identity.subtitle}</p>
        <p className="text-sm text-gray-600">{COPY.identity.intro}</p>
      </div>

      <Card className="p-5">
        <IdentityForm />
      </Card>

      <p className="text-center text-xs text-gray-500">{COPY.privacyNotice}</p>
    </div>
  );
}
