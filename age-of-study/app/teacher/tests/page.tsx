"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Tag,
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import Loading, { LoadingInline } from "@/components/ui/loading";
import { TestService } from "@/lib/testService";
import { subjectService } from "@/lib/subjectService";
import { Subject } from "@/types/teacher";

interface Test {
  id: string;
  title: string;
  description: string;
  type: "practice" | "skill";
  time_limit: number;
  created_at: string;
  status: "published" | "draft";
  question_count?: number;
  subject_id?: number;
  subject_name?: string;
}

export default function TestManagementPage() {
  const { user, checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "practice" | "skill">(
    "all",
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "published" | "draft"
  >("all");
  const [filterSubject, setFilterSubject] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"date" | "title" | "questions">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user?.id) {
      fetchTests(user.id);
      fetchSubjects();
    }
  }, [user]);

  const fetchTests = async (teacherId: string) => {
    setLoading(true);
    try {
      const testService = new TestService();
      const teacherTests =
        await testService.getTestsWithQuestionCounts(teacherId);
      const totalQuestionCount =
        await testService.getTeacherTotalQuestionCount(teacherId);

      // Map Supabase test data to our interface
      const mappedTests: Test[] = teacherTests.map((test) => ({
        id: test.id,
        title: test.title,
        description: test.description || "",
        type: test.type as "practice" | "skill",
        time_limit: test.settings.time_limit || 0,
        created_at: test.created_at,
        status: test.is_published ? "published" : "draft",
        question_count: test.question_count || 0,
        subject_id: test.subject_id ?? undefined,
        subject_name: test.subject_name,
      }));

      setTests(mappedTests);
      setTotalQuestions(totalQuestionCount);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const subjectsData = await subjectService.getSubjects();
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài kiểm tra này?")) {
      try {
        const testService = new TestService();
        await testService.deleteTest(testId);
        setTests(tests.filter((test) => test.id !== testId));
      } catch (error) {
        console.error("Error deleting test:", error);
        alert("Có lỗi xảy ra khi xóa bài kiểm tra");
      }
    }
  };

  const handlePublishTest = async (testId: string, currentStatus: boolean) => {
    try {
      const testService = new TestService();
      await testService.updateTest(testId, {
        is_published: !currentStatus,
      });

      // Cập nhật trạng thái trong danh sách
      setTests(
        tests.map((test) =>
          test.id === testId
            ? { ...test, status: !currentStatus ? "published" : "draft" }
            : test,
        ),
      );
    } catch (error) {
      console.error("Error updating test:", error);
      alert("Cập nhật bài kiểm tra thất bại. Vui lòng thử lại.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "practice":
        return "bg-blue-100 text-blue-800";
      case "skill":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter and sort tests
  const filteredAndSortedTests = tests
    .filter((test) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = filterType === "all" || test.type === filterType;

      // Status filter
      const matchesStatus =
        filterStatus === "all" || test.status === filterStatus;

      // Subject filter
      const matchesSubject =
        filterSubject === 0 ||
        (test.subject_id !== null && test.subject_id !== undefined && test.subject_id === filterSubject);

      return matchesSearch && matchesType && matchesStatus && matchesSubject;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "questions":
          comparison = (a.question_count || 0) - (b.question_count || 0);
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
  const totalPages = Math.ceil(filteredAndSortedTests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTests = filteredAndSortedTests.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return <Loading message="Đang tải dữ liệu giáo viên..." fullScreen />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Quản lý bài kiểm tra
        </h1>
        <p className="text-lg text-gray-600">
          Danh sách các bài kiểm tra đã tạo và đang quản lý
        </p>
      </div>

      {/* Create New Test Button */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center gap-2"
            onClick={() => router.push("/teacher/dashboard")}
          >
            ← Quay lại trang chính
          </button>
          <span className="text-sm text-gray-600">
            Tổng số bài kiểm tra: {tests.length}
          </span>
          <span className="text-sm text-gray-600">
            Đã xuất bản: {tests.filter((t) => t.status === "published").length}
          </span>
          <span className="text-sm text-gray-600">
            Nháp: {tests.filter((t) => t.status === "draft").length}
          </span>
        </div>
        <button
          className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
          onClick={() => router.push("/teacher/tests/create")}
        >
          <Plus className="w-5 h-5" />
          Tạo bài kiểm tra mới
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm bài kiểm tra..."
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
              setFilterType(e.target.value as "all" | "practice" | "skill");
              setCurrentPage(1);
            }}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả loại</option>
            <option value="practice">Luyện tập</option>
            <option value="skill">Kỹ năng</option>
          </select>

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as "all" | "published" | "draft");
              setCurrentPage(1);
            }}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Nháp</option>
          </select>

          {/* Filter by Subject */}
          <select
            value={filterSubject}
            onChange={(e) => {
              setFilterSubject(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={0}>Tất cả môn học</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Hiển thị {filteredAndSortedTests.length} bài kiểm tra</span>
            {searchTerm && (
              <span className="text-blue-600 font-medium">
                Tìm thấy {filteredAndSortedTests.length} kết quả cho &quot;
                {searchTerm}&quot;
              </span>
            )}
            {(filterType !== "all" ||
              filterStatus !== "all" ||
              filterSubject !== 0) && (
              <span className="text-green-600 font-medium">
                Đã lọc theo {filterType !== "all" ? filterType : ""}{" "}
                {filterStatus !== "all" ? filterStatus : ""}{" "}
                {filterSubject !== 0
                  ? subjects.find((s) => s.id === Number(filterSubject))?.name
                  : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "date" | "title" | "questions")
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="date">Ngày tạo</option>
              <option value="title">Tiêu đề</option>
              <option value="questions">Số câu hỏi</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
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

      {/* Tests Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Môn học
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số câu hỏi
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
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
                  <td colSpan={6} className="px-6 py-4">
                    <LoadingInline message="Đang tải danh sách bài kiểm tra..." />
                  </td>
                </tr>
              ) : filteredAndSortedTests.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Không tìm thấy bài kiểm tra nào phù hợp với tiêu chí tìm
                    kiếm.
                  </td>
                </tr>
              ) : (
                currentTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {test.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {test.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.subject_name || "Chưa xác định"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4 text-gray-400" />
                        {test.question_count || 0} câu
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(test.type)}`}
                      >
                        {test.type === "practice" ? "Luyện tập" : "Kỹ năng"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {test.time_limit || 0} phút
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(test.status)}`}
                      >
                        {test.status === "published" ? "Đã xuất bản" : "Nháp"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(test.created_at).toLocaleDateString("vi-VN")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex items-center">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => router.push(`/teacher/tests/${test.id}`)}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() =>
                          router.push(`/teacher/tests/${test.id}/edit`)
                        }
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          test.status === "published"
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        }`}
                        onClick={() =>
                          handlePublishTest(
                            test.id,
                            test.status === "published",
                          )
                        }
                      >
                        {test.status === "published"
                          ? "Hủy xuất bản"
                          : "Xuất bản"}
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteTest(test.id)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
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
            {Math.min(endIndex, filteredAndSortedTests.length)} của{" "}
            {filteredAndSortedTests.length} bài kiểm tra
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
              <p className="text-sm text-gray-600">Tổng số câu hỏi</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalQuestions}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Tag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Bài kiểm tra đang hoạt động
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {tests.filter((t) => t.status === "published").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Học sinh tham gia</p>
              <p className="text-2xl font-bold text-gray-900">245</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
