"use client";

import GameHeader from "@/components/GameHeader";
import FloatingChatbot from "@/components/student/FloatingChatbot";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { checkRoutePermission } from "@/lib/routeMiddleware";
import { useBlockedCheck } from "@/hooks/useBlockedCheck";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Periodic check for blocked users
  useBlockedCheck();

  // Run checkAuth only once on mount
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run once

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Force password change if flagged (e.g. after teacher magic login)
      if (user.must_change_password && pathname !== "/student/change-password") {
        router.push("/student/change-password");
        return;
      }

      // Check route permissions using centralized middleware
      const currentPath = pathname || "/";
      const redirectPath = checkRoutePermission({
        user,
        currentPath,
        isAuthenticated,
      });

      if (redirectPath) {
        router.push(redirectPath);
        return;
      }

      // Auto-redirect based on user role when accessing dashboard
      if (
        user.role === "teacher" &&
        (currentPath === "/" || currentPath === "/dashboard")
      ) {
        router.push("/teacher/dashboard");
      }
    } else if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

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

  // Check if current page is a test page (hide chatbot during tests)
  const isTestPage = pathname?.includes("/student/tests/");
  const showChatbot = user.role === "student" && !isTestPage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <GameHeader />
      <main className="pb-20 md:pb-8">{children}</main>

      {/* Floating Chatbot - only for students, not during tests */}
      {showChatbot && <FloatingChatbot />}
    </div>
  );
}
