"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getTeacherClasses } from "@/lib/classService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loading, { LoadingInline } from "@/components/ui/loading";
import {
  GraduationCap,
  Users,
  BookOpen,
  Plus,
  Eye,
  Calendar,
  UserPlus,
  Users2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

interface ClassData {
  id: number;
  name: string;
  grade: number;
  school_year: string;
  class_code: string;
  student_count: number;
  subject?: { name: string };
  created_at: string;
  type: "homeroom" | "subject";
}

export default function TeacherClassesPage() {
  const { user } = useAuthStore();
  const [teacherData, setTeacherData] = useState<{
    full_name: string | null;
    username: string | null;
    homeroom_classes: Array<ClassData>;
    subject_classes: Array<ClassData>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "homeroom" | "subject">(
    "all",
  );
  const [filterGrade, setFilterGrade] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"name" | "grade" | "students" | "date">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchTeacherClasses() {
      if (!user?.id) return;

      try {
        setLoading(true);
        const result = await getTeacherClasses(user.id);

        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          // Transform the data to match our interface
          const transformedData = {
            full_name: result.data.full_name,
            username: result.data.username,
            homeroom_classes: result.data.homeroom_classes.map((c) => ({
              ...c,
              type: "homeroom" as const,
              subject: c.subject,
            })),
            subject_classes: result.data.subject_classes.map((c) => ({
              ...c,
              type: "subject" as const,
              subject: c.subject,
            })),
          };
          setTeacherData(transformedData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }

    fetchTeacherClasses();
  }, [user?.id]);

  // Combine all classes
  const allClasses = [
    ...(teacherData?.homeroom_classes || []),
    ...(teacherData?.subject_classes || []),
  ];

  // Filter and sort classes
  const filteredAndSortedClasses = allClasses
    .filter((classData) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        classData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classData.class_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classData.subject?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = filterType === "all" || classData.type === filterType;

      // Grade filter
      const matchesGrade = filterGrade === 0 || classData.grade === filterGrade;

      return matchesSearch && matchesType && matchesGrade;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "grade":
          comparison = a.grade - b.grade;
          break;
        case "students":
          comparison = a.student_count - b.student_count;
          break;
        case "date":
        default:
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedClasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClasses = filteredAndSortedClasses.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <Loading
        message="Đang tải lớp học..."
        size="lg"
        fullScreen
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-red-800 dark:text-red-400 font-semibold mb-2">
              Lỗi tải dữ liệu
            </h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
              variant="outline"
            >
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!teacherData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Chưa có lớp học nào
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Hiện tại bạn chưa được phân công dạy lớp nào. Vui lòng liên hệ
              quản trị viên để được phân công.
            </p>
            <Link href="/teacher/dashboard">
              <Button variant="outline">Quay về bảng điều khiển</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasClasses =
    teacherData.homeroom_classes.length > 0 ||
    teacherData.subject_classes.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Lớp học của tôi
              </h1>
              <p className="text-gray-600">
                {teacherData.full_name} • {teacherData.username}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lớp chủ nhiệm</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teacherData.homeroom_classes.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lớp bộ môn</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teacherData.subject_classes.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng học sinh</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teacherData.homeroom_classes.reduce(
                      (sum, c) => sum + c.student_count,
                      0,
                    ) +
                      teacherData.subject_classes.reduce(
                        (sum, c) => sum + c.student_count,
                        0,
                      )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users2 className="w-6 h-6 text-purple-600" />
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
                placeholder="Tìm kiếm lớp học..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as "all" | "homeroom" | "subject");
                setCurrentPage(1);
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả loại</option>
              <option value="homeroom">Lớp chủ nhiệm</option>
              <option value="subject">Lớp bộ môn</option>
            </select>

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
              <span>Hiển thị {filteredAndSortedClasses.length} lớp học</span>
              {searchTerm && (
                <span className="text-blue-600 font-medium">
                  Tìm thấy {filteredAndSortedClasses.length} kết quả cho &quot;
                  {searchTerm}&quot;
                </span>
              )}
              {(filterType !== "all" || filterGrade !== 0) && (
                <span className="text-green-600 font-medium">
                  Đã lọc theo {filterType !== "all" ? filterType : ""}{" "}
                  {filterGrade !== 0 ? `khối ${filterGrade}` : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "name" | "grade" | "students" | "date",
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="name">Tên lớp</option>
                <option value="grade">Khối</option>
                <option value="students">Số học sinh</option>
                <option value="date">Ngày tạo</option>
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

        {/* Classes Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên lớp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khối
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Học sinh
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Môn học
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã lớp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4">
                      <LoadingInline message="Đang tải danh sách lớp học..." />
                    </td>
                  </tr>
                ) : filteredAndSortedClasses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Không tìm thấy lớp học nào phù hợp với tiêu chí tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  currentClasses.map((classData) => (
                    <tr key={classData.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {classData.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {classData.school_year}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          Khối {classData.grade}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          {classData.student_count} học sinh
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {classData.subject?.name || "Chưa xác định"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-800"
                        >
                          {classData.class_code}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            classData.type === "homeroom"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {classData.type === "homeroom"
                            ? "Chủ nhiệm"
                            : "Bộ môn"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(classData.created_at).toLocaleDateString(
                            "vi-VN",
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex items-center">
                        <Link href={`/teacher/classes/${classData.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Xem chi tiết
                          </Button>
                        </Link>
                        {classData.type === "homeroom" && (
                          <>
                            <Link
                              href={`/teacher/classes/${classData.id}/students`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                              >
                                <Users2 className="w-4 h-4" />
                                Quản lý học sinh
                              </Button>
                            </Link>
                          </>
                        )}
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
              {Math.min(endIndex, filteredAndSortedClasses.length)} của{" "}
              {filteredAndSortedClasses.length} lớp học
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

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng số lớp học</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allClasses.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lớp chủ nhiệm</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teacherData.homeroom_classes.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lớp bộ môn</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teacherData.subject_classes.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
