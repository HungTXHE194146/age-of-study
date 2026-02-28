"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import UserAvatar from "./UserAvatar";

interface ClassInfo {
  id: number;
  name: string;
  grade: number;
}

interface User {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  grade: number | null;
  is_blocked: boolean;
  daily_limit_minutes: number;
}

interface UserEditModalProps {
  user: User;
  /** Current class ID resolved from class_students */
  classId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserEditModal({
  user,
  classId,
  onClose,
  onSuccess,
}: UserEditModalProps) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    role: user.role,
    is_blocked: user.is_blocked,
    daily_limit_minutes: user.daily_limit_minutes,
  });
  const [selectedClassId, setSelectedClassId] = useState<number | null>(classId ?? null);
  const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("classes")
        .select("id, name, grade")
        .neq("status", "archived")
        .order("grade", { ascending: true })
        .order("name", { ascending: true });
      setAvailableClasses(data || []);
    };
    fetchClasses();
  }, []);

  const classesByGrade = availableClasses.reduce<Record<number, ClassInfo[]>>(
    (acc, cls) => {
      if (!acc[cls.grade]) acc[cls.grade] = [];
      acc[cls.grade].push(cls);
      return acc;
    },
    {}
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      // Derive grade from new class selection
      const newClass = availableClasses.find((c) => c.id === selectedClassId);

      // Update profile
      const profileUpdate: Record<string, unknown> = {
        full_name: formData.full_name,
        role: formData.role,
        is_blocked: formData.is_blocked,
        daily_limit_minutes: formData.daily_limit_minutes,
      };
      if (formData.role === "student" && newClass) {
        profileUpdate.grade = newClass.grade;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", user.id);
      if (updateError) throw updateError;

      // Handle class change for students
      if (formData.role === "student" && selectedClassId !== (classId ?? null)) {
        // Mark old class membership as transferred
        if (classId) {
          await supabase
            .from("class_students")
            .update({ status: "transferred", left_at: new Date().toISOString() })
            .eq("student_id", user.id)
            .eq("class_id", classId)
            .eq("status", "active");
        }
        // Insert new membership
        if (selectedClassId) {
          await supabase.from("class_students").insert({
            student_id: user.id,
            class_id: selectedClassId,
            status: "active",
          });
        }
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Error updating user:", err);
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra khi cập nhật người dùng"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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
              <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</p>
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
              onChange={(e) => {
                setFormData({ ...formData, role: e.target.value });
                if (e.target.value !== "student") setSelectedClassId(null);
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors bg-white"
            >
              <option value="student">Học sinh</option>
              <option value="teacher">Giáo viên</option>
              <option value="system_admin">Quản trị viên</option>
            </select>
          </div>

          {/* Class assignment — students only */}
          {formData.role === "student" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lớp học
              </label>
              <select
                value={selectedClassId ?? ""}
                onChange={(e) =>
                  setSelectedClassId(e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors bg-white"
              >
                <option value="">— Chưa xếp lớp —</option>
                {Object.entries(classesByGrade)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([grade, classes]) => (
                    <optgroup key={grade} label={`Khối ${grade}`}>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Khối sẽ tự động cập nhật theo lớp được chọn
              </p>
            </div>
          )}

          {/* Daily Limit — students only */}
          {formData.role === "student" && (
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
              <p className="text-xs text-gray-500 mt-1">Tối đa 1440 phút (24 giờ)</p>
            </div>
          )}

          {/* Blocked status toggle */}
          <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-gray-700">Chặn tài khoản</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Tài khoản bị chặn sẽ không thể đăng nhập
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, is_blocked: !formData.is_blocked })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                formData.is_blocked ? "bg-red-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_blocked ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
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
