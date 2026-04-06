import { EntryFlow } from "@/components/entry/entry-flow";

export const dynamic = "force-dynamic";

async function waitForLandingShell(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default async function EntryPage() {
  await waitForLandingShell(320);

  return <EntryFlow />;
}
