"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getClassDetail } from "@/lib/classService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loading, { LoadingInline } from "@/components/ui/loading";
import {
  GraduationCap,
  Users,
  Search,
  Eye,
  Edit3,
  Plus,
  AlertCircle,
  UserPlus,
  UserMinus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface StudentData {
  student_id: string;
  joined_at: string;
  profile: {
    full_name: string | null;
    username: string | null;
    total_xp: number;
    grade: number | null;
  };
}

export default function ClassStudentsPage() {
  const { classId } = useParams();
  const { user } = useAuthStore();
  const [classData, setClassData] = useState<{
    id: number;
    name: string;
    grade: number;
    school_year: string;
    class_code: string;
    status: string;
    created_at: string;
    updated_at: string;
    homeroom_teacher: {
      id: string;
      full_name: string | null;
      subjects: Array<{ id: number; name: string }>;
    } | null;
    subject_teachers: Array<{
      teacher: { id: string; full_name: string | null };
      subject: { id: number; name: string };
    }>;
    students: Array<StudentData>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"name" | "xp" | "grade" | "joined">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchData() {
      if (!classId || !user?.id) return;

      try {
        setLoading(true);

        // Fetch class detail
        const classResult = await getClassDetail(Number(classId));
        if (classResult.error) {
          setError(classResult.error);
          return;
        }

        setClassData(classResult.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [classId, user?.id]);

  if (loading) {
    return (
      <Loading message="Đang tải danh sách học sinh..." size="lg" fullScreen />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h2 className="text-red-800 dark:text-red-400 font-semibold">
                Lỗi tải dữ liệu
              </h2>
            </div>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Thử lại
              </Button>
              <Link href="/teacher/classes">
                <Button variant="outline">Quay về danh sách lớp</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Không tìm thấy lớp học
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Lớp học này không tồn tại hoặc bạn không có quyền truy cập.
            </p>
            <Link href="/teacher/classes">
              <Button variant="outline">Quay về danh sách lớp</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter and sort students
  const filteredAndSortedStudents = classData.students
    .filter((student) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        student.profile.full_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        student.profile.username
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        student.profile.total_xp.toString().includes(searchTerm);

      // Grade filter
      const matchesGrade =
        filterGrade === 0 || student.profile.grade === filterGrade;

      return matchesSearch && matchesGrade;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = (
            a.profile.full_name ||
            a.profile.username ||
            ""
          ).localeCompare(b.profile.full_name || b.profile.username || "");
          break;
        case "xp":
          comparison = a.profile.total_xp - b.profile.total_xp;
          break;
        case "grade":
          comparison = (a.profile.grade || 0) - (b.profile.grade || 0);
          break;
        case "joined":
          comparison =
            new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
          break;
        default:
          return 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredAndSortedStudents.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/teacher/classes/${classId}`}>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                Quay lại lớp
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Quản lý học sinh - {classData.name}
              </h1>
              <p className="text-gray-600">
                Khối {classData.grade} • {classData.school_year} •{" "}
                {classData.students.length} học sinh
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tổng số học sinh
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {classData.students.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Trung bình XP
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {Math.round(
                      classData.students.reduce(
                        (acc, s) => acc + s.profile.total_xp,
                        0,
                      ) / classData.students.length,
                    ) || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Khối cao nhất
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {Math.max(
                      ...classData.students.map((s) => s.profile.grade || 0),
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Mới nhất
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {classData.students.length > 0
                      ? new Date(
                          Math.max(
                            ...classData.students.map((s) =>
                              new Date(s.joined_at).getTime(),
                            ),
                          ),
                        ).toLocaleDateString("vi-VN")
                      : "N/A"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm học sinh..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter by Grade */}
            <select
              value={filterGrade}
              onChange={(e) => {
                setFilterGrade(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>Tất cả khối</option>
              <option value={1}>Khối 1</option>
              <option value={2}>Khối 2</option>
              <option value={3}>Khối 3</option>
              <option value={4}>Khối 4</option>
              <option value={5}>Khối 5</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Hiển thị {filteredAndSortedStudents.length} học sinh</span>
              {searchTerm && (
                <span className="text-blue-600 font-medium">
                  Tìm thấy {filteredAndSortedStudents.length} kết quả cho &quot;
                  {searchTerm}&quot;
                </span>
              )}
              {filterGrade !== 0 && (
                <span className="text-green-600 font-medium">
                  Đã lọc theo khối {filterGrade}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "name" | "xp" | "grade" | "joined",
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="name">Tên học sinh</option>
                <option value="xp">Điểm XP</option>
                <option value="grade">Khối</option>
                <option value="joined">Ngày tham gia</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                {sortOrder === "asc" ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Học sinh
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khối
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    XP
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tham gia
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4">
                      <LoadingInline message="Đang tải danh sách học sinh..." />
                    </td>
                  </tr>
                ) : filteredAndSortedStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Không tìm thấy học sinh nào phù hợp với tiêu chí tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  currentStudents.map((student) => (
                    <tr key={student.student_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {student.profile.full_name?.charAt(0) ||
                              student.profile.username?.charAt(0) ||
                              "?"}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.profile.full_name ||
                                student.profile.username ||
                                "Học sinh"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.profile.full_name
                                ? student.profile.username
                                : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.profile.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          Khối {student.profile.grade}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          {student.profile.total_xp} XP
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(student.joined_at).toLocaleDateString(
                            "vi-VN",
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex items-center">
                        <Link
                          href={`/learn/tests?studentId=${student.student_id}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Xem
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Edit3 className="w-4 h-4" />
                          Sửa
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Hiển thị {startIndex + 1} -{" "}
              {Math.min(endIndex, filteredAndSortedStudents.length)} của{" "}
              {filteredAndSortedStudents.length} học sinh
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-lg ${
                      page === currentPage
                        ? "bg-blue-500 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Hành động nhanh
              </h3>
              <p className="text-gray-600">Quản lý học sinh trong lớp học</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Thêm học sinh
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <UserMinus className="w-4 h-4" />
                Xóa học sinh
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
