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

      {/* Sidebar - Notebook Spine */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 bg-indigo-900 border-r-8 border-indigo-950 h-screen flex flex-col shadow-[8px_0_15px_-3px_rgba(0,0,0,0.5)]
          transition-transform duration-300 ease-in-out text-white
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${className || ""}
        `}
      >
        {/* Branding */}
        <div className="p-6 border-b-2 border-dashed border-indigo-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
                <Image
                  src="/school-logo.svg"
                  alt="Age of Study Logo"
                  width={48}
                  height={48}
                  className="w-full h-full bg-gray-100 rounded-lg "
                  priority
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-white truncate font-handwritten tracking-wider">
                  Age of Study
                </h1>
                <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">
                  Sổ Điểm
                </p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-indigo-800 rounded-lg transition-colors border-2 border-transparent hover:border-indigo-400"
              aria-label="Đóng menu"
            >
              <X className="w-5 h-5 text-indigo-300" />
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
                className={`flex items-center gap-3 px-4 py-3 mr-2 rounded-r-xl text-sm font-bold transition-all border-y-2 border-r-2 ${
                  isActive
                    ? "bg-white text-indigo-900 border-indigo-950 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] translate-x-1"
                    : "text-indigo-100 border-transparent hover:bg-indigo-800 hover:border-indigo-700"
                }`}
              >
                <IconComponent className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 shadow-inner"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Settings */}
        <div className="border-t-2 border-dashed border-indigo-700/50 bg-indigo-900 p-4 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            {/* User Avatar */}
            <UserAvatar
              avatarUrl={user?.avatar_url}
              name={user?.full_name}
              username={user?.username}
              size="md"
            />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {user?.full_name || user?.username || "Giáo viên"}
              </p>
              <p className="text-xs text-indigo-300 truncate tracking-wider uppercase">
                Giáo viên
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 mb-4">
            <span className="text-sm font-bold text-indigo-200">
              Tiết kiệm mạng
            </span>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input
                type="checkbox"
                name="toggle"
                id="toggle"
                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                defaultChecked={
                  typeof window !== "undefined"
                    ? localStorage.getItem("low_data_mode_enabled") === "true"
                    : false
                }
                onChange={(e) => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem(
                      "low_data_mode_enabled",
                      e.target.checked ? "true" : "false",
                    );
                    // Optionally dispatch event to tell other components
                    window.dispatchEvent(new Event("lowDataModeChanged"));
                  }
                }}
              />
              <label
                htmlFor="toggle"
                className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"
              ></label>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-500 hover:text-white rounded-lg transition-all border-2 border-transparent hover:border-red-700 hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] text-sm font-bold"
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
