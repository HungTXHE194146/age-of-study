'use client';

import GameHeader from "@/components/GameHeader";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { checkRoutePermission } from "@/lib/routeMiddleware";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname(); // Use Next.js hook instead of window.location

  // Run checkAuth only once on mount
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run once

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Use pathname from hook (reactive)
      const currentPath = pathname || '/';
      
      const redirectPath = checkRoutePermission({
        user,
        currentPath,
        isAuthenticated
      });

      if (redirectPath) {
        router.push(redirectPath);
        return;
      }

      // Auto-redirect teachers ONLY when accessing root dashboard path
      if (user.role === "teacher" && currentPath === "/") {
        router.push("/teacher/dashboard");
      }
    } else if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, user, router, pathname]); // Add pathname to deps

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Đang tải dashboard...</p>
        </div>
      </div>
    );
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
