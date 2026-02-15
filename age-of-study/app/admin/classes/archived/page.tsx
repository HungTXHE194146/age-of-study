"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  ArrowLeft,
  RefreshCw,
  Search,
  AlertCircle,
} from "lucide-react";
import {
  getArchivedClasses,
  restoreClass,
} from "@/lib/classService";
import type { ClassWithCount } from "@/types/class";
import { useRouter } from "next/navigation";

export default function ArchivedClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassWithCount[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterClasses();
  }, [searchTerm, classes]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getArchivedClasses();
      if (result.error) {
        console.error("Error loading archived classes:", result.error);
      } else {
        setClasses(result.data || []);
        setFilteredClasses(result.data || []);
      }
    } catch (error) {
      console.error("Failed to load archived classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterClasses = () => {
    if (!searchTerm) {
      setFilteredClasses(classes);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = classes.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.class_code.toLowerCase().includes(term) ||
        c.homeroom_teacher_name?.toLowerCase().includes(term)
    );
    setFilteredClasses(filtered);
  };

  const handleRestore = async (classId: number, className: string) => {
    if (!confirm(`Bạn có chắc muốn khôi phục lớp "${className}"?`)) {
      return;
    }

    setRestoring(true);
    try {
      const result = await restoreClass(classId);
      if (result.error) {
        alert(`Lỗi khôi phục lớp: ${result.error}`);
        return;
      }
      await loadData();
    } catch (error: any) {
      alert(`Có lỗi xảy ra: ${error.message || 'Không thể khôi phục lớp'}`);
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/admin/classes")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Lớp học đã lưu trữ 📦
        </h1>
        <p className="text-gray-600">
          Quản lý các lớp học đã được lưu trữ
        </p>
      </div>

      {/* Search & Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <BookOpen className="w-4 h-4 text-gray-600" />
          <span className="text-gray-600">
            Tổng số lớp đã lưu trữ:{" "}
            <span className="font-semibold text-gray-900">
              {classes.length}
            </span>
          </span>
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? "Không tìm thấy lớp nào" : "Chưa có lớp lưu trữ"}
          </h3>
          <p className="text-gray-600">
            {searchTerm
              ? "Thử tìm kiếm với từ khóa khác"
              : "Các lớp đã lưu trữ sẽ hiển thị ở đây"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Class Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {cls.name}
                  </h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                    Khối {cls.grade}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold bg-gray-100 px-2 py-1 rounded">
                      {cls.class_code}
                    </span>
                  </div>
                  <div>Năm học: {cls.school_year}</div>
                </div>
              </div>

              {/* Info */}
              <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                {cls.homeroom_teacher_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">GVCN:</span>
                    <span className="font-medium text-gray-900">
                      {cls.homeroom_teacher_name}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Học sinh:</span>
                  <span className="font-medium text-gray-900">
                    {cls.student_count}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Lưu trữ:</span>
                  <span className="text-gray-500">
                    {new Date(cls.updated_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleRestore(cls.id, cls.name)}
                  disabled={restoring}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${restoring ? 'animate-spin' : ''}`} />
                  <span>{restoring ? 'Đang khôi phục...' : 'Khôi phục lớp'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
