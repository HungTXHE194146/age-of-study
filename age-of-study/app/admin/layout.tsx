'use client';

import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/components/ui/loading";

export default function AdminLayout({
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
    // Redirect if not authenticated or not system_admin
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user && user.role !== "system_admin") {
        // Redirect non-admin users to their appropriate dashboard
        if (user.role === "teacher") {
          router.push("/teacher/dashboard");
        } else {
          router.push("/learn");
        }
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return <Loading message="Đang xác thực quyền Admin..." size="lg" fullScreen />;
  }

  if (!isAuthenticated || !user || user.role !== "system_admin") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
