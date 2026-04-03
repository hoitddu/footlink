import { BottomNav } from "@/components/app/bottom-nav";
import { MobileShell } from "@/components/app/mobile-shell";
import { createDemoSeed } from "@/lib/demo-state/seed";
import { DemoAppProvider } from "@/lib/demo-state/provider";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // eslint-disable-next-line react-hooks/purity -- capture one request seed so SSR and hydration share identical demo timestamps.
  const initialState = createDemoSeed(Date.now());

  return (
    <DemoAppProvider initialState={initialState}>
      <MobileShell>{children}</MobileShell>
      <BottomNav />
    </DemoAppProvider>
  );
}
