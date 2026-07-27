import { isAdminSession } from "@/lib/admin-session";
import { AdminLoginGate } from "@/components/admin/admin-login-gate";
import { AdminView } from "@/components/admin/admin-view";
import { getAdminDashboardStats, getAllParticipantsForAdmin, getCampaignsForAdminSwitch } from "@/lib/data";

export default async function AdminPage() {
  const authed = await isAdminSession();
  if (!authed) {
    return <AdminLoginGate />;
  }

  const [stats, participants, campaigns] = await Promise.all([
    getAdminDashboardStats(),
    getAllParticipantsForAdmin(),
    getCampaignsForAdminSwitch(),
  ]);

  return <AdminView stats={stats} participants={participants} campaigns={campaigns} />;
}
