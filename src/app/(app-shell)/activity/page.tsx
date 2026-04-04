import { getAppDataSource } from "@/lib/app-config";
import { ActivityScreen } from "@/components/activity/activity-screen";
import { getActivitySnapshot } from "@/lib/repositories/requests";

type ActivityPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  const resolved = await searchParams;
  const tab = Array.isArray(resolved.tab) ? resolved.tab[0] : resolved.tab;
  const highlight = Array.isArray(resolved.highlight) ? resolved.highlight[0] : resolved.highlight;
  const flash = Array.isArray(resolved.flash) ? resolved.flash[0] : resolved.flash;
  const stateSnapshot =
    getAppDataSource() === "supabase" ? await getActivitySnapshot() : undefined;

  return (
    <ActivityScreen
      flash={
        flash as
          | "created"
          | "requested"
          | "accepted"
          | "confirmed"
          | "rejected"
          | "withdrawn"
          | "deleted"
          | undefined
      }
      highlight={highlight}
      initialTab={tab === "listings" ? "listings" : "requests"}
      stateSnapshot={stateSnapshot}
    />
  );
}
