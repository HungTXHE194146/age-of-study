"use client";

import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/admin/UserAvatar";
import { useAuthStore } from "@/store/useAuthStore";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  Settings,
  BookOpen,
  Brain,
  Trophy,
  LogOut,
} from "lucide-react";
import Link from "next/link";

interface SidebarProps {
  className?: string;
}

// Navigation items definition
const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/teacher/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "my-tests",
    label: "My Tests",
    href: "/teacher/tests",
    icon: FileText,
  },
  {
    id: "leaderboard",
    label: "Bảng Xếp Hạng",
    href: "/teacher/leaderboard",
    icon: Trophy,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/teacher/settings",
    icon: Settings,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const handleLogout = () => {
    // Clear auth cookies and redirect
    document.cookie =
      "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie =
      "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.href = "/login";
  };

  return (
    <div
      className={`w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen fixed left-0 top-0 z-50 ${className || ""}`}
    >
      {/* Branding */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              ageOfStudy
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Teacher Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <IconComponent className="w-5 h-5" />
              {item.label}
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <UserAvatar
            avatarUrl={user?.avatar_url}
            name={user?.full_name}
            username={user?.username}
            size="md"
          />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.full_name || user?.username || "Teacher"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.role === "teacher" ? "Giáo viên" : user?.role}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
