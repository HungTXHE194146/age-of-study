'use client';

import GameHeader from "@/components/GameHeader";
import FloatingChatbot from "@/components/student/FloatingChatbot";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Check route permissions using centralized middleware
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

      // Auto-redirect based on user role when accessing dashboard
      if (user.role === "teacher" && (currentPath === "/" || currentPath === "/dashboard")) {
        router.push("/teacher/dashboard");
      }
    } else if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  if (isLoading) {
    return <Loading message="Đang tải dashboard..." size="lg" fullScreen />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Check if current page is a test page (hide chatbot during tests)
  const isTestPage = pathname?.includes('/learn/tests/');
  const showChatbot = user.role === 'student' && !isTestPage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <GameHeader />
      <main className="pb-20 md:pb-8">{children}</main>
      
      {/* Floating Chatbot - only for students, not during tests */}
      {showChatbot && <FloatingChatbot />}
    </div>
  );
}
