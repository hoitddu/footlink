import { getAppDataSource } from "@/lib/app-config";
import { MatchDetailScreen } from "@/components/match/match-detail-screen";
import { getMatchDetailSnapshot } from "@/lib/repositories/matches";

type MatchPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MatchDetailPage({
  params,
  searchParams,
}: MatchPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const normalized = Object.fromEntries(
    Object.entries(resolvedSearchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  // eslint-disable-next-line react-hooks/purity -- capture one request timestamp so SSR and hydration use the same reference time.
  const referenceNow = Date.now();
  const stateSnapshot =
    getAppDataSource() === "supabase"
      ? await getMatchDetailSnapshot(resolvedParams.id)
      : undefined;

  return (
    <MatchDetailScreen
      matchId={resolvedParams.id}
      referenceNow={referenceNow}
      searchParams={normalized}
      stateSnapshot={stateSnapshot}
    />
  );
}
