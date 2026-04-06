import { NotificationsScreen } from "@/components/notifications/notifications-screen";
import { getAppDataSource } from "@/lib/app-config";
import { getNotificationsSnapshot } from "@/lib/repositories/requests";

export default async function NotificationsPage() {
  const stateSnapshot =
    getAppDataSource() === "supabase" ? await getNotificationsSnapshot() : undefined;

  return <NotificationsScreen stateSnapshot={stateSnapshot} />;
}
