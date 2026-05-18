import { Navigation } from "@/components/Navigation";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Ambient glow */}
      <div className="page-glow" />
      {/* Top stripe USA/CAN/MEX */}
      <div className="top-stripe" />
      <Navigation />
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
