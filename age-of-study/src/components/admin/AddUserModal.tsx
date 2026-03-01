"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface ClassInfo {
  id: number;
  name: string;
  grade: number;
}

interface AddUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserModal({ onClose, onSuccess }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "student" as "student" | "teacher" | "system_admin",
    daily_limit_minutes: 30,
  });
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
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

  // Group classes by grade for the optgroup display
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
      const fakeEmail = `${formData.username}@ageofstudy.local`;

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

      const userId = authData.user.id;

      // Resolve grade from selected class
      const selectedClass = availableClasses.find((c) => c.id === selectedClassId);

      // Update profile: role + settings + grade (derived from class)
      const profileUpdate: Record<string, unknown> = {
        role: formData.role,
        daily_limit_minutes:
          formData.role === "student" ? formData.daily_limit_minutes : 60,
      };
      if (formData.role === "student" && selectedClass) {
        profileUpdate.grade = selectedClass.grade;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", userId);
      if (profileError) throw profileError;

      // Enroll student in class
      if (formData.role === "student" && selectedClassId) {
        const { error: csError } = await supabase
          .from("class_students")
          .insert({
            student_id: userId,
            class_id: selectedClassId,
            status: "active",
          });
        if (csError) throw csError;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Error creating user:", err);
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra khi tạo người dùng"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
            Thêm người dùng mới
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1"
        >
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
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors text-sm sm:text-base"
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
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors text-sm sm:text-base"
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
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors text-sm sm:text-base"
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
              onChange={(e) => {
                setFormData({ ...formData, role: e.target.value as typeof formData.role });
                setSelectedClassId(null);
              }}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors bg-white text-sm sm:text-base"
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
                Xếp vào lớp
              </label>
              <select
                value={selectedClassId ?? ""}
                onChange={(e) =>
                  setSelectedClassId(e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors bg-white text-sm sm:text-base"
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
                Khối sẽ tự động xác định theo lớp được chọn
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
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors text-sm sm:text-base"
                min="0"
                max="1440"
              />
              <p className="text-xs text-gray-500 mt-1">Mặc định: 30 phút/ngày</p>
            </div>
          )}

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
