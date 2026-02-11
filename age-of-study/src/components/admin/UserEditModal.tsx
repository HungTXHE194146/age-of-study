"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import UserAvatar from "./UserAvatar";

interface User {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  daily_limit_minutes: number;
}

interface UserEditModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserEditModal({
  user,
  onClose,
  onSuccess,
}: UserEditModalProps) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    role: user.role,
    daily_limit_minutes: user.daily_limit_minutes,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          role: formData.role,
          daily_limit_minutes: formData.daily_limit_minutes,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error updating user:", err);
      setError(err.message || "Có lỗi xảy ra khi cập nhật người dùng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Chỉnh sửa người dùng
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* User Info Display */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
            <UserAvatar
              avatarUrl={user.avatar_url}
              name={user.full_name}
              username={user.username}
              size="md"
            />
            <div>
              <p className="font-semibold text-gray-900">{user.username}</p>
              <p className="text-sm text-gray-500">
                ID: {user.id.slice(0, 8)}...
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Họ và tên
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors"
              placeholder="Nhập họ và tên"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Vai trò
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors bg-white"
            >
              <option value="student">Học sinh</option>
              <option value="teacher">Giáo viên</option>
              <option value="system_admin">Quản trị viên</option>
            </select>
          </div>

          {/* Daily Limit */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Giới hạn thời gian/ngày (phút)
            </label>
            <input
              type="number"
              value={formData.daily_limit_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  daily_limit_minutes: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors"
              min="0"
              max="1440"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tối đa 1440 phút (24 giờ)
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
