import { redirect } from "next/navigation";
import { KlasemenView } from "@/components/klasemen/klasemen-view";
import { getParticipantIdFromSession } from "@/lib/session";

export default async function KlasemenPage() {
  const participantId = await getParticipantIdFromSession();
  if (!participantId) redirect("/");

  return <KlasemenView />;
}
