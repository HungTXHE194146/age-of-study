"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface EditClassInput {
  name: string;
  grade: number;
  school_year: string;
}

interface EditClassModalProps {
  classId: number;
  initialName: string;
  initialGrade: number;
  initialSchoolYear: string;
  onClose: () => void;
  onSuccess: (classId: number, updates: EditClassInput) => Promise<boolean>;
}

export default function EditClassModal({
  classId,
  initialName,
  initialGrade,
  initialSchoolYear,
  onClose,
  onSuccess,
}: EditClassModalProps) {
  const [formData, setFormData] = useState<EditClassInput>({
    name: initialName,
    grade: initialGrade,
    school_year: initialSchoolYear,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên lớp");
      return;
    }
    if (!formData.school_year.trim()) {
      setError("Vui lòng nhập năm học");
      return;
    }

    setLoading(true);
    try {
      const success = await onSuccess(classId, {
        name: formData.name.trim(),
        grade: formData.grade,
        school_year: formData.school_year.trim(),
      });
      if (!success) {
        setError("Cập nhật thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Có lỗi xảy ra";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa lớp học</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Class Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên lớp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ví dụ: Lớp 5A"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          {/* Grade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khối lớp <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.grade}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  grade: parseInt(e.target.value),
                }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={loading}
              required
            >
              <option value="1">Khối 1</option>
              <option value="2">Khối 2</option>
              <option value="3">Khối 3</option>
              <option value="4">Khối 4</option>
              <option value="5">Khối 5</option>
            </select>
            {formData.grade !== initialGrade && (
              <p className="text-xs text-amber-600 mt-1">
                Đang thay đổi từ Khối {initialGrade} sang Khối {formData.grade}
              </p>
            )}
          </div>

          {/* School Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Năm học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.school_year}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  school_year: e.target.value,
                }))
              }
              placeholder="2025-2026"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
