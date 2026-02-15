"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { CreateClassInput } from "@/types/class";
import type { Subject } from "@/types/teacher";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  role: string;
}

interface CreateClassModalProps {
  teachers: Profile[];
  subjects: Subject[];
  onClose: () => void;
  onSuccess: (input: CreateClassInput) => Promise<boolean>;
}

export default function CreateClassModal({
  teachers,
  subjects,
  onClose,
  onSuccess,
}: CreateClassModalProps) {
  const currentYear = new Date().getFullYear();
  const defaultSchoolYear = `${currentYear}-${currentYear + 1}`;

  const [formData, setFormData] = useState<{
    name: string;
    grade: number;
    school_year: string;
    homeroom_teacher_id?: string;
    subject_ids: number[];
  }>({
    name: "",
    grade: 1,
    school_year: defaultSchoolYear,
    homeroom_teacher_id: undefined,
    subject_ids: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setSubmissionError(null);
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên lớp");
      setLoading(false);
      return;
    }

    if (!formData.school_year.trim()) {
      setError("Vui lòng nhập năm học");
      setLoading(false);
      return;
    }

    // If homeroom teacher is selected, they must have at least one subject
    if (formData.homeroom_teacher_id && formData.subject_ids.length === 0) {
      setError("GVCN phải dạy ít nhất 1 môn học");
      setLoading(false);
      return;
    }

    try {
      const input: CreateClassInput = {
        name: formData.name.trim(),
        grade: formData.grade,
        school_year: formData.school_year.trim(),
      };

      // Only add teacher and subjects if GVCN is selected
      if (formData.homeroom_teacher_id) {
        input.homeroom_teacher_id = formData.homeroom_teacher_id;
        input.subject_ids = formData.subject_ids;
      }

      const success = await onSuccess(input);
      if (success) {
        // Modal will be closed by parent component
        // Do nothing here
      } else {
        // Handle failure - keep modal open and show error
        setSubmissionError('Tạo lớp thất bại. Vui lòng thử lại.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Error creating class:", err);
      setError(err.message || "Có lỗi xảy ra khi tạo lớp");
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: number) => {
    setFormData((prev) => {
      const isSelected = prev.subject_ids.includes(subjectId);
      return {
        ...prev,
        subject_ids: isSelected
          ? prev.subject_ids.filter((id) => id !== subjectId)
          : [...prev.subject_ids, subjectId],
      };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
            Tạo lớp học mới
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Đóng"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {submissionError && (
              <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg text-sm">
                {submissionError}
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
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ví dụ: Lớp 4A"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Tên lớp sẽ hiển thị cho học sinh và giáo viên
              </p>
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khối lớp <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.grade}
                onChange={(e) =>
                  setFormData({ ...formData, grade: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
                disabled={loading}
              >
                <option value="1">Khối 1</option>
                <option value="2">Khối 2</option>
                <option value="3">Khối 3</option>
                <option value="4">Khối 4</option>
                <option value="5">Khối 5</option>
              </select>
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
                  setFormData({ ...formData, school_year: e.target.value })
                }
                placeholder="2025-2026"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            {/* Homeroom Teacher (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giáo viên chủ nhiệm (GVCN){" "}
                <span className="text-gray-400 font-normal">(Tùy chọn)</span>
              </label>
              <select
                value={formData.homeroom_teacher_id || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    homeroom_teacher_id: e.target.value || undefined,
                    // Clear subjects when changing teacher
                    subject_ids:
                      e.target.value === formData.homeroom_teacher_id
                        ? formData.subject_ids
                        : [],
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">-- Chọn sau --</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name || teacher.username || `Giáo viên (${teacher.id.slice(0, 8)})`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                GVCN sẽ quản lý lớp và dạy các môn học
              </p>
            </div>

            {/* Subjects for Homeroom Teacher */}
            {formData.homeroom_teacher_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Môn học <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {subjects.map((subject) => {
                    const isSelected = formData.subject_ids.includes(subject.id);
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => handleSubjectToggle(subject.id)}
                        className={`
                          px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium
                          ${
                            isSelected
                              ? "bg-teal-50 border-teal-500 text-teal-700"
                              : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                          }
                        `}
                        disabled={loading}
                      >
                        {subject.name}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Chọn các môn học mà GVCN sẽ dạy (có thể chọn nhiều môn)
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                💡 Lưu ý:
              </h4>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Mã lớp sẽ tự động sinh ra (8 ký tự)</li>
                <li>Học sinh dùng mã lớp để tham gia</li>
                <li>Bạn có thể phân công GVCN sau nếu chưa chọn</li>
                <li>
                  Giáo viên bộ môn (GVBM) có thể thêm sau khi tạo lớp
                </li>
              </ul>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 sm:px-6 py-4 flex justify-end gap-3 flex-shrink-0">
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
            {loading ? "Đang tạo..." : "Tạo lớp"}
          </button>
        </div>
      </div>
    </div>
  );
}
