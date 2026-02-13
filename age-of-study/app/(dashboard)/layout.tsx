'use client';

import GameHeader from "@/components/GameHeader";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { checkRoutePermission } from "@/lib/routeMiddleware";
import Loading from "@/components/ui/loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Check route permissions using centralized middleware
      const currentPath = window.location.pathname;
      const redirectPath = checkRoutePermission({
        user,
        currentPath,
        isAuthenticated
      });

      if (redirectPath) {
        router.push(redirectPath);
        return;
      }

      // Auto-redirect based on user role when accessing dashboard
      if (user.role === "teacher") {
        router.push("/teacher/dashboard");
      }
    } else if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return <Loading message="Đang tải dashboard..." size="lg" fullScreen />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <GameHeader />
      <main className="pb-20 md:pb-8">{children}</main>
    </div>
  );
}
