import { TopNav } from "@/components/top-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-8">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-[1280px] px-6 py-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          EasyStartUp — Start your business up. Every day. Eventually without you.
        </p>
      </footer>
    </div>
  );
}
