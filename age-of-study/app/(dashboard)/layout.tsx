import GameHeader from "@/components/GameHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <GameHeader />
      <main className="pb-20 md:pb-8">{children}</main>
    </div>
  );
}
