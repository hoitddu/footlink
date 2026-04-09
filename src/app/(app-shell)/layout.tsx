import { BottomNav } from "@/components/app/bottom-nav";
import { ActivitySnapshotPrefetch } from "@/components/app/activity-snapshot-prefetch";
import { MobileShell } from "@/components/app/mobile-shell";
import { PullToRefreshShell } from "@/components/app/pull-to-refresh-shell";
import { getAppDataSource } from "@/lib/app-config";
import { CurrentProfileProvider } from "@/lib/current-profile-context";
import { createDemoSeed } from "@/lib/demo-state/seed";
import { DemoAppProvider } from "@/lib/demo-state/provider";

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (getAppDataSource() !== "demo") {
    return (
      <CurrentProfileProvider>
        <ActivitySnapshotPrefetch />
        <PullToRefreshShell>
          <MobileShell>{children}</MobileShell>
        </PullToRefreshShell>
        <BottomNav />
      </CurrentProfileProvider>
    );
  }

  // eslint-disable-next-line react-hooks/purity -- capture one request seed so SSR and hydration share identical demo timestamps.
  const initialState = createDemoSeed(Date.now());

  return (
    <DemoAppProvider initialState={initialState}>
      <PullToRefreshShell>
        <MobileShell>{children}</MobileShell>
      </PullToRefreshShell>
      <BottomNav />
    </DemoAppProvider>
  );
}
