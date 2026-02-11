'use client';

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect authenticated users based on role
      if (user.role === "system_admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "teacher") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/learn");
      }
    }
  }, [isAuthenticated, user, router]);

  // Different background colors for login vs register - matching Stitch design
  const isLoginPage = pathname === "/login";
  const isStaffPage = pathname?.startsWith("/staff");
  const bgColor = isLoginPage
    ? "bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-50"
    : "bg-gradient-to-br from-green-100 via-green-50 to-teal-50";

  return (
    <div
      className={`min-h-screen ${isStaffPage ? "" : bgColor} flex items-center justify-center ${isStaffPage ? "" : "p-4"} relative overflow-hidden`}
    >
      {/* Decorative background elements - only for student pages */}
      {!isStaffPage && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Top left - pencil/pen icon area */}
          <div className="absolute top-10 left-10 text-6xl opacity-20 rotate-45">
            ✏️
          </div>

          {/* Top right - book icon */}
          <div className="absolute top-20 right-20 text-5xl opacity-20">📖</div>

          {/* Bottom left - star */}
          <div className="absolute bottom-20 left-16 text-7xl opacity-30">
            ⭐
          </div>

          {/* Bottom right - decorative icon */}
          <div className="absolute bottom-16 right-24 text-6xl opacity-20">
            {isLoginPage ? "🎓" : "🚀"}
          </div>

          {/* Floating dots pattern */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          ></div>
        </div>
      )}

      {/* Main content - full width for staff, centered for students */}
      <div
        className={`relative z-10 ${isStaffPage ? "w-full" : "w-full max-w-md"}`}
      >
        {children}
      </div>
    </div>
  );
}
