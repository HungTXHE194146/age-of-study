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
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

// Navigation items definition
const navigationItems = [
  {
    id: "dashboard",
    label: "Bảng điều khiển",
    href: "/teacher/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "classes",
    label: "Lớp học",
    href: "/teacher/classes",
    icon: GraduationCap,
  },
  {
    id: "my-tests",
    label: "Bài kiểm tra",
    href: "/teacher/tests",
    icon: FileText,
  },
  {
    id: "skill-tree",
    label: "Cây kỹ năng",
    href: "/teacher/skill-tree",
    icon: Brain,
  },
  {
    id: "leaderboard",
    label: "Bảng xếp hạng",
    href: "/teacher/leaderboard",
    icon: Trophy,
  },
  {
    id: "settings",
    label: "Cài đặt",
    href: "/teacher/settings",
    icon: Settings,
  },
];

export function Sidebar({ className, isOpen = true, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${className || ""}
        `}
      >
        {/* Branding */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
                <Image
                  src="/logo.svg"
                  alt="Age of Study Logo"
                  width={48}
                  height={48}
                  className="w-full h-full"
                  priority
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                  Age of Study
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Bảng điều khiển giáo viên
                </p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Đóng menu"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <IconComponent className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-3 mb-3">
            {/* User Avatar */}
            <UserAvatar
              avatarUrl={user?.avatar_url}
              name={user?.full_name}
              username={user?.username}
              size="md"
            />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.full_name || user?.username || "Giáo viên"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Giáo viên
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all border-2 border-transparent hover:border-red-200 dark:hover:border-red-800 text-sm font-medium"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </>
  );
}
