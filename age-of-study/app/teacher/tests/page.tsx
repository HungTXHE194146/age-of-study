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
import {
  NotebookCard,
  NotebookCardHeader,
  NotebookCardTitle,
  NotebookCardContent,
  NotebookButton,
  NotebookBadge,
} from "@/components/ui/notebook-card";

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
  max_xp?: number;
}

export default function TestManagementPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
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
        max_xp: test.max_xp || 0,
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
        (test.subject_id !== null &&
          test.subject_id !== undefined &&
          test.subject_id === filterSubject);

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

  if (isLoading || loading) {
    return <Loading message="Đang tải dữ liệu bài kiểm tra..." fullScreen />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 p-6 bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2rem] border-b-2 border-dashed border-gray-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 border-2 border-blue-900 rounded-lg flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] rotate-[-3deg]">
                <BookOpen className="w-8 h-8 text-blue-900" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight font-handwritten">
                  Quản lý Bài Kiểm Tra
                </h1>
                <p className="text-xl font-bold text-gray-600 font-handwritten mt-1">
                  Danh sách bài kiểm tra đã tạo
                </p>
              </div>
            </div>

            <NotebookButton
              className="bg-emerald-100 text-emerald-900 border-emerald-900 py-3 text-lg"
              onClick={() => router.push("/teacher/tests/create")}
            >
              <Plus className="w-6 h-6 mr-2" />
              Tạo bài mới
            </NotebookButton>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <NotebookCard className="bg-blue-50">
            <NotebookCardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-600 uppercase text-sm">
                  Tổng bài KT
                </span>
                <BookOpen className="w-8 h-8 text-blue-900" />
              </div>
              <p className="text-4xl font-black text-blue-900">
                {tests.length}
              </p>
            </NotebookCardContent>
          </NotebookCard>

          <NotebookCard className="bg-green-50">
            <NotebookCardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-600 uppercase text-sm">
                  Đã xuất bản
                </span>
                <Eye className="w-8 h-8 text-green-900" />
              </div>
              <p className="text-4xl font-black text-green-900">
                {tests.filter((t) => t.status === "published").length}
              </p>
            </NotebookCardContent>
          </NotebookCard>

          <NotebookCard className="bg-yellow-50">
            <NotebookCardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-600 uppercase text-sm">
                  Nháp
                </span>
                <Edit className="w-8 h-8 text-yellow-900" />
              </div>
              <p className="text-4xl font-black text-yellow-900">
                {tests.filter((t) => t.status === "draft").length}
              </p>
            </NotebookCardContent>
          </NotebookCard>

          <NotebookCard className="bg-purple-50">
            <NotebookCardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-600 uppercase text-sm">
                  Tổng câu hỏi
                </span>
                <Tag className="w-8 h-8 text-purple-900" />
              </div>
              <p className="text-4xl font-black text-purple-900">
                {totalQuestions}
              </p>
            </NotebookCardContent>
          </NotebookCard>
        </div>

        {/* Search and Filter Controls */}
        <NotebookCard className="mb-8 border-gray-400 bg-orange-50/50">
          <NotebookCardContent className="pt-6 pb-6 border-b-0 bg-transparent">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài kiểm tra..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 border-2 border-black rounded-md focus:ring-0 focus:border-blue-600 text-lg font-bold bg-white/80"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as "all" | "practice" | "skill");
                  setCurrentPage(1);
                }}
                className="px-4 py-3 border-2 border-black rounded-md focus:ring-0 focus:border-blue-600 text-lg font-bold bg-white/80"
              >
                <option value="all">Tất cả loại bài</option>
                <option value="practice">Luyện tập</option>
                <option value="skill">Kỹ năng</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(
                    e.target.value as "all" | "published" | "draft",
                  );
                  setCurrentPage(1);
                }}
                className="px-4 py-3 border-2 border-black rounded-md focus:ring-0 focus:border-blue-600 text-lg font-bold bg-white/80"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="published">Đã xuất bản</option>
                <option value="draft">Nháp</option>
              </select>

              <select
                value={filterSubject}
                onChange={(e) => {
                  setFilterSubject(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-4 py-3 border-2 border-black rounded-md focus:ring-0 focus:border-blue-600 text-lg font-bold bg-white/80"
              >
                <option value={0}>Tất cả môn</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 border-t-2 border-dashed border-gray-400 pt-6">
              <div className="text-lg font-bold text-gray-700 bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2rem]">
                Tìm thấy {filteredAndSortedTests.length} bài.
              </div>
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <span className="font-bold">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "date" | "title" | "questions")
                  }
                  className="px-3 py-1 border-2 border-black rounded-md focus:ring-0 text-base font-bold bg-white"
                >
                  <option value="date">Ngày tạo</option>
                  <option value="title">Tiêu đề</option>
                  <option value="questions">Số câu</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="border-2 border-black bg-white p-1 rounded-md hover:bg-gray-200"
                >
                  {sortOrder === "asc" ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>
            </div>
          </NotebookCardContent>
        </NotebookCard>

        {/* Tests Grid instead of Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-8">
          {filteredAndSortedTests.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 font-bold border-4 border-dashed border-gray-400 bg-white/50 rounded-2xl text-xl">
              Không tìm thấy bài kiểm tra nào.
            </div>
          ) : (
            currentTests.map((test) => (
              <NotebookCard
                key={test.id}
                className="group hover:-translate-y-1 transition-transform relative"
              >
                {/* Status Tape/Pin */}
                <div className="absolute -top-3 -right-3 rotate-[15deg] z-10">
                  {test.status === "published" ? (
                    <NotebookBadge
                      variant="success"
                      className="shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-xs py-1 px-3 bg-green-200"
                    >
                      Xuất bản
                    </NotebookBadge>
                  ) : (
                    <NotebookBadge
                      variant="warning"
                      className="shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-xs py-1 px-3 bg-yellow-200"
                    >
                      Nháp
                    </NotebookBadge>
                  )}
                </div>

                <NotebookCardHeader className="bg-orange-50/80 pr-16 border-b border-dashed border-gray-300">
                  <div className="space-y-1">
                    <NotebookCardTitle
                      className="text-2xl sm:text-2xl line-clamp-2 leading-tight"
                      title={test.title}
                    >
                      {test.title}
                    </NotebookCardTitle>
                    {test.description && (
                      <p className="text-sm font-bold text-gray-600 line-clamp-1 truncate">
                        {test.description}
                      </p>
                    )}
                  </div>
                </NotebookCardHeader>
                <NotebookCardContent className="py-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/60 p-2 rounded-lg border-2 border-gray-300">
                      <span className="block text-xs text-gray-500 font-bold uppercase mb-1">
                        Môn học
                      </span>
                      <span
                        className="text-lg font-black text-gray-800 truncate block"
                        title={test.subject_name}
                      >
                        {test.subject_name || "N/A"}
                      </span>
                    </div>
                    <div className="bg-white/60 p-2 rounded-lg border-2 border-gray-300">
                      <span className="block text-xs text-gray-500 font-bold uppercase mb-1">
                        Số câu hỏi
                      </span>
                      <span className="text-lg font-black text-gray-800 flex items-center gap-1">
                        <Tag className="w-4 h-4" /> {test.question_count || 0}
                      </span>
                    </div>
                    <div className="bg-white/60 p-2 rounded-lg border-2 border-gray-300">
                      <span className="block text-xs text-gray-500 font-bold uppercase mb-1">
                        Loại bài
                      </span>
                      <span
                        className={`text-sm font-black truncate block ${test.type === "practice" ? "text-blue-700" : "text-purple-700"}`}
                      >
                        {test.type === "practice" ? "Luyện tập" : "Kỹ năng"}
                      </span>
                    </div>
                    <div className="bg-white/60 p-2 rounded-lg border-2 border-gray-300">
                      <span className="block text-xs text-gray-500 font-bold uppercase mb-1">
                        Thời gian
                      </span>
                      <span className="text-lg font-black text-gray-800 flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {test.time_limit || 0} p
                      </span>
                    </div>
                  </div>
                </NotebookCardContent>
                <div className="p-4 bg-gray-50 border-t-2 border-dashed border-gray-300 flex items-center gap-2 flex-wrap">
                  <NotebookButton
                    className="flex-1 bg-white"
                    onClick={() => router.push(`/teacher/tests/${test.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-1" /> Xem
                  </NotebookButton>
                  <NotebookButton
                    className="flex-1 bg-yellow-100 border-yellow-800 text-yellow-900"
                    onClick={() =>
                      router.push(`/teacher/tests/${test.id}/edit`)
                    }
                  >
                    <Edit className="w-4 h-4 mr-1" /> Sửa
                  </NotebookButton>

                  <NotebookButton
                    className={`flex-1 ${test.status === "published" ? "bg-orange-100 border-orange-800 text-orange-900" : "bg-green-100 border-green-800 text-green-900"}`}
                    onClick={() =>
                      handlePublishTest(test.id, test.status === "published")
                    }
                  >
                    {test.status === "published" ? "Hủy XB" : "+ XB"}
                  </NotebookButton>

                  <NotebookButton
                    className="bg-red-100 border-red-800 text-red-900 aspect-square p-2"
                    onClick={() => handleDeleteTest(test.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </NotebookButton>
                </div>
              </NotebookCard>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-8">
            <NotebookButton
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 disabled:opacity-50 disabled:cursor-not-allowed bg-white border-gray-400"
            >
              <ChevronLeft className="w-6 h-6" />
            </NotebookButton>

            <div className="text-xl font-black text-gray-800 bg-white border-2 border-black px-6 py-2 rounded-md shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              {currentPage} / {totalPages}
            </div>

            <NotebookButton
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 disabled:opacity-50 disabled:cursor-not-allowed bg-white border-gray-400"
            >
              <ChevronRight className="w-6 h-6" />
            </NotebookButton>
          </div>
        )}
      </div>
    </div>
  );
}
