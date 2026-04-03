import { MatchDetailScreen } from "@/components/match/match-detail-screen";

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

  return (
    <MatchDetailScreen
      matchId={resolvedParams.id}
      referenceNow={referenceNow}
      searchParams={normalized}
    />
  );
}
