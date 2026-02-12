"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface AddUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserModal({
  onClose,
  onSuccess,
}: AddUserModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "student" as "student" | "teacher" | "system_admin",
    daily_limit_minutes: 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.username || !formData.password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();

      // Create fake email from username
      const fakeEmail = `${formData.username}@ageofstudy.local`;

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            full_name: formData.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Không thể tạo tài khoản");

      // Update profile with role and settings
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role: formData.role,
          daily_limit_minutes: formData.daily_limit_minutes,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error creating user:", err);
      setError(err.message || "Có lỗi xảy ra khi tạo người dùng");
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
            Thêm người dùng mới
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
          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tên đăng nhập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors"
              placeholder="username"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors"
              placeholder="Tối thiểu 6 ký tự"
              required
              minLength={6}
            />
          </div>

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
              placeholder="Nhập họ và tên (tùy chọn)"
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
                setFormData({ ...formData, role: e.target.value as any })
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
            <p className="text-xs text-gray-500 mt-1">Mặc định: 30 phút</p>
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
              {loading ? "Đang tạo..." : "Tạo người dùng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
