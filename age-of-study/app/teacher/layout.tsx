"use client";

import { Sidebar } from "@/components/teacher/Sidebar";
import { useState, useEffect, useRef } from "react";
import { Menu, WifiOff } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useBlockedCheck } from "@/hooks/useBlockedCheck";
import { AnimatePresence, motion } from "framer-motion";


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
  const [isOffline, setIsOffline] = useState(false);

  // Connection listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Initial check
    if (typeof window !== "undefined") {
      setIsOffline(!window.navigator.onLine);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);


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

      if (user) {
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


        <main className="flex-1 overflow-auto relative">
          {/* Offline Notification */}
          <AnimatePresence>
            {isOffline && (
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 20, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-red-600 border-2 border-black text-white px-6 py-3 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-3 font-bold"
              >
                <WifiOff className="w-6 h-6 animate-pulse" />
                <span>Mất kết nối internet. Dữ liệu đang được lưu cục bộ.</span>
              </motion.div>
            )}
          </AnimatePresence>
          {children}
        </main>

      </div>
    </div>
  );
}
