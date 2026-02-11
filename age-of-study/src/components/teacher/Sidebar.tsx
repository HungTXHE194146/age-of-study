'use client';

import { navigationItems, mockTeacher } from "@/constants/teacherMockData";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  Settings,
  Users,
  BookOpen,
  Brain,
  Trophy,
} from "lucide-react";
import Link from "next/link";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "LayoutDashboard":
        return LayoutDashboard;
      case "FileText":
        return FileText;
      case "GraduationCap":
        return GraduationCap;
      case "Settings":
        return Settings;
      case "Users":
        return Users;
      case "BookOpen":
        return BookOpen;
      case "Brain":
        return Brain;
      case "Trophy":
        return Trophy;
      default:
        return LayoutDashboard;
    }
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
          const IconComponent = getIconComponent(item.icon.name);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                item.isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <IconComponent className="w-5 h-5" />
              {item.label}
              {item.isActive && (
                <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {mockTeacher.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {mockTeacher.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {mockTeacher.department}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
