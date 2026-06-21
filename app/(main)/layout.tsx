import { TopNav } from "@/components/top-nav";
import { MobileTabBar } from "@/components/mobile-tab-bar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <TopNav />
      {/* Extra bottom padding on mobile so content clears the fixed tab bar */}
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 pb-24 sm:px-6 md:pb-8">
        {children}
      </main>
      <footer className="mx-auto hidden w-full max-w-[1280px] px-4 py-6 sm:px-6 md:block">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          EasyStartUp — Start your business up. Every day. Eventually without you.
        </p>
      </footer>
      <MobileTabBar />
    </div>
  );
}
