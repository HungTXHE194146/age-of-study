"use client";

import { X } from "lucide-react";
import UserAvatar from "./UserAvatar";

interface User {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  total_xp: number;
  current_streak: number;
  weekly_xp: number;
  daily_limit_minutes: number;
  freeze_count: number;
}

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
}

export default function UserDetailModal({
  user,
  onClose,
}: UserDetailModalProps) {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "system_admin":
        return "Quản trị viên";
      case "teacher":
        return "Giáo viên";
      case "student":
        return "Học sinh";
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "system_admin":
        return "bg-red-100 text-red-700 border-red-200";
      case "teacher":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "student":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Chi tiết người dùng
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Profile Section */}
          <div className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-200">
            <UserAvatar
              avatarUrl={user.avatar_url}
              name={user.full_name}
              username={user.username}
              size="lg"
            />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {user.full_name || "Chưa đặt tên"}
              </h3>
              <p className="text-gray-600 mb-3">
                @{user.username || `user_${user.id.slice(0, 8)}`}
              </p>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border-2 ${getRoleBadgeColor(
                  user.role,
                )}`}
              >
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>

          {/* Account Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-3">
                Thông tin tài khoản
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">ID</p>
                  <p className="font-mono text-sm text-gray-900">{user.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ngày tham gia</p>
                  <p className="text-sm text-gray-900">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-3">
                Thiết lập
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">
                    Giới hạn thời gian/ngày
                  </p>
                  <p className="text-sm text-gray-900">
                    {user.daily_limit_minutes} phút
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Freeze còn lại</p>
                  <p className="text-sm text-gray-900">
                    {user.freeze_count} lần
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gamification Stats */}
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-3">
              Thống kê học tập
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-100">
                <p className="text-xs text-blue-600 font-semibold mb-1">
                  Tổng XP
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {user.total_xp.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-100">
                <p className="text-xs text-green-600 font-semibold mb-1">
                  XP tuần này
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {user.weekly_xp.toLocaleString()}
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-100">
                <p className="text-xs text-orange-600 font-semibold mb-1">
                  Chuỗi ngày
                </p>
                <p className="text-2xl font-bold text-orange-700">
                  🔥 {user.current_streak}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
