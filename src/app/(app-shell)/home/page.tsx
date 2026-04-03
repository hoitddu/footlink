import { FeedScreen } from "@/components/feed/feed-screen";
import { parseFeedContext } from "@/lib/context";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolved = await searchParams;
  const normalized = Object.fromEntries(
    Object.entries(resolved).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
  // eslint-disable-next-line react-hooks/purity -- capture one request timestamp so SSR and hydration use the same reference time.
  const referenceNow = Date.now();
  const context = parseFeedContext(normalized);

  return <FeedScreen initialContext={context} initialReferenceNow={referenceNow} />;
}
