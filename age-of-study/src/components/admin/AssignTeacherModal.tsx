"use client";

import { useState, useEffect } from "react";
import { X, UserPlus } from "lucide-react";
import type { AssignTeacherInput } from "@/types/class";
import type { Subject } from "@/types/teacher";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
}

interface AssignTeacherModalProps {
  classId: number;
  className: string;
  teachers: Profile[];
  subjects: Subject[];
  onClose: () => void;
  onSuccess: (input: AssignTeacherInput) => Promise<boolean>;
}

export default function AssignTeacherModal({
  classId,
  className,
  teachers,
  subjects,
  onClose,
  onSuccess,
}: AssignTeacherModalProps) {
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [isHomeroom, setIsHomeroom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!teacherId || !subjectId) {
      setError("Vui lòng chọn giáo viên và môn học");
      return;
    }

    setSubmitting(true);

    try {
      const success = await onSuccess({
        class_id: classId,
        teacher_id: teacherId,
        subject_id: Number(subjectId),
        is_homeroom: isHomeroom,
      });

      if (success) {
        onClose();
      }
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Phân công giáo viên
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Lớp: {className}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Teacher Select */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Giáo viên *
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            >
              <option value="">-- Chọn giáo viên --</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name || teacher.username}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Select */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Môn học *
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            >
              <option value="">-- Chọn môn học --</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Homeroom Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isHomeroom"
              checked={isHomeroom}
              onChange={(e) => setIsHomeroom(e.target.checked)}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <label htmlFor="isHomeroom" className="text-sm text-gray-700">
              Giáo viên chủ nhiệm
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-4 h-4" />
              {submitting ? "Đang xử lý..." : "Phân công"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
