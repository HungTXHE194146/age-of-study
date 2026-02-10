"use client";

import GameHeader from "@/components/GameHeader";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <GameHeader />
      <main className="pb-20 md:pb-0">{children}</main>
    </div>
  );
}
