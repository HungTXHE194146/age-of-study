"use client";

import { Sidebar } from "@/components/teacher/Sidebar";
import { useState, useEffect, useRef } from "react";
import { Menu } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useBlockedCheck } from "@/hooks/useBlockedCheck";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const hasCheckedAuth = useRef(false);
  const hasRedirected = useRef(false);

  // Periodic check for blocked users
  useBlockedCheck();

  // Check authentication only once on mount
  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      checkAuth();
    }
  }, [checkAuth]);

  // Handle redirects
  useEffect(() => {
    // Avoid multiple redirects
    if (hasRedirected.current) return;

    if (!isLoading) {
      if (!isAuthenticated) {
        hasRedirected.current = true;
        router.replace("/staff/login");
        return;
      }

      if (!user) {
        // User object not loaded despite being authenticated - re-check auth
        return;
      }

      if (user.role !== "teacher") {
        hasRedirected.current = true;
        // Redirect non-teacher users
        if (user.role === "system_admin") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/student");
        }
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "teacher") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex notebook-paper-bg">
      {/* Sidebar - Acts as the binder spine/left edge */}
      <div className="lg:w-64 z-40 relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 z-10 notebook-content-wrapper">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b-2 border-dashed border-gray-300 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border-2 border-transparent hover:border-black"
            aria-label="Mở menu"
          >
            <Menu className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 font-handwritten tracking-wide">
            Sổ Tay Giáo Viên
          </h1>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
