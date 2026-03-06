"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  NotebookCard,
  NotebookCardHeader,
  NotebookCardTitle,
  NotebookCardContent,
  NotebookButton,
  NotebookBadge,
} from "@/components/ui/notebook-card";

interface ClassData {
  id: number;
  name: string;
  grade: number;
  school_year: string;
  class_code: string;
  student_count: number;
  subjects: Array<{ name: string }>;
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
              subjects: c.subjects,
            })),
            subject_classes: result.data.subject_classes.map((c) => ({
              ...c,
              type: "subject" as const,
              subjects: c.subjects,
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
  const allClasses = useMemo(
    () => [
      ...(teacherData?.homeroom_classes || []),
      ...(teacherData?.subject_classes || []),
    ],
    [teacherData],
  );

  // Filter and sort classes – memoized to avoid re-running on unrelated state changes
  const filteredAndSortedClasses = useMemo(
    () =>
      allClasses
        .filter((classData) => {
          // Search filter
          const matchesSearch =
            searchTerm === "" ||
            classData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            classData.class_code
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            classData.subjects?.some((s) =>
              s.name?.toLowerCase().includes(searchTerm.toLowerCase()),
            );

          // Type filter
          const matchesType =
            filterType === "all" || classData.type === filterType;

          // Grade filter
          const matchesGrade =
            filterGrade === 0 || classData.grade === filterGrade;

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
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime();
              break;
          }

          return sortOrder === "asc" ? comparison : -comparison;
        }),
    [allClasses, searchTerm, filterType, filterGrade, sortBy, sortOrder],
  );

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedClasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClasses = filteredAndSortedClasses.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <Loading message="Đang tải lớp học..." size="lg" fullScreen />;
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
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 p-6 bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2rem] border-b-2 border-dashed border-gray-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-900 rounded-lg flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] rotate-[-3deg]">
              <GraduationCap className="w-8 h-8 text-blue-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight font-handwritten">
                Lớp học của tôi
              </h1>
              <p className="text-xl font-bold text-gray-600 font-handwritten mt-1">
                Giáo viên: {teacherData.full_name || teacherData.username}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <NotebookCard className="bg-green-50">
            <NotebookCardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <NotebookBadge variant="success">Chủ nhiệm</NotebookBadge>
                <Users className="w-8 h-8 text-green-900" />
              </div>
              <p className="text-3xl sm:text-4xl font-black text-green-900">
                {teacherData.homeroom_classes.length}
              </p>
              <p className="text-lg font-bold text-gray-600">Lớp học</p>
            </NotebookCardContent>
          </NotebookCard>

          <NotebookCard className="bg-blue-50">
            <NotebookCardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <NotebookBadge variant="default">Bộ môn</NotebookBadge>
                <BookOpen className="w-8 h-8 text-blue-900" />
              </div>
              <p className="text-3xl sm:text-4xl font-black text-blue-900">
                {teacherData.subject_classes.length}
              </p>
              <p className="text-lg font-bold text-gray-600">Lớp học</p>
            </NotebookCardContent>
          </NotebookCard>

          <NotebookCard className="bg-purple-50">
            <NotebookCardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <NotebookBadge variant="warning">Học sinh</NotebookBadge>
                <Users2 className="w-8 h-8 text-purple-900" />
              </div>
              <p className="text-3xl sm:text-4xl font-black text-purple-900">
                {teacherData.homeroom_classes.reduce(
                  (sum, c) => sum + c.student_count,
                  0,
                ) +
                  teacherData.subject_classes.reduce(
                    (sum, c) => sum + c.student_count,
                    0,
                  )}
              </p>
              <p className="text-lg font-bold text-gray-600">Tổng số</p>
            </NotebookCardContent>
          </NotebookCard>
        </div>

        {/* Search and Filter Controls */}
        <NotebookCard className="mb-8 border-gray-400 bg-yellow-50/50">
          <NotebookCardContent className="pt-6 border-b-0 pb-6 bg-transparent">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Tìm kiếm lớp học..."
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
                  setFilterType(
                    e.target.value as "all" | "homeroom" | "subject",
                  );
                  setCurrentPage(1);
                }}
                className="px-4 py-3 border-2 border-black rounded-md focus:ring-0 focus:border-blue-600 text-lg font-bold bg-white/80"
              >
                <option value="all">Tất cả loại</option>
                <option value="homeroom">Lớp chủ nhiệm</option>
                <option value="subject">Lớp bộ môn</option>
              </select>

              <select
                value={filterGrade}
                onChange={(e) => {
                  setFilterGrade(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-4 py-3 border-2 border-black rounded-md focus:ring-0 focus:border-blue-600 text-lg font-bold bg-white/80"
              >
                <option value={0}>Tất cả khối</option>
                <option value={1}>Khối 1</option>
                <option value={2}>Khối 2</option>
                <option value={3}>Khối 3</option>
                <option value={4}>Khối 4</option>
                <option value={5}>Khối 5</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 border-t-2 border-dashed border-gray-400 pt-6 bg-transparent pb-0">
              <div className="text-lg font-bold text-gray-700 bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2rem]">
                Tìm thấy {filteredAndSortedClasses.length} lớp.
              </div>
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <span className="font-bold">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as "name" | "grade" | "students" | "date",
                    )
                  }
                  className="px-3 py-1 border-2 border-black rounded-md focus:ring-0 text-base font-bold bg-white"
                >
                  <option value="name">Tên</option>
                  <option value="grade">Khối</option>
                  <option value="students">Sĩ số</option>
                  <option value="date">Ngày</option>
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

        {/* Classes Grid instead of Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-8">
          {filteredAndSortedClasses.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 font-bold border-4 border-dashed border-gray-400 bg-white/50 rounded-2xl text-xl">
              Không tìm thấy lớp học nào.
            </div>
          ) : (
            currentClasses.map((classData) => (
              <NotebookCard
                key={classData.id}
                className="group hover:scale-[1.02] transition-transform"
              >
                <NotebookCardHeader className="bg-blue-50/80">
                  <div className="flex justify-between items-start">
                    <div>
                      <NotebookCardTitle className="text-2xl sm:text-3xl mb-1">
                        {classData.name}
                      </NotebookCardTitle>
                      <div className="text-lg text-gray-600 font-bold">
                        Năm: {classData.school_year}
                      </div>
                    </div>
                    {classData.type === "homeroom" ? (
                      <NotebookBadge
                        variant="success"
                        className="text-sm border-2"
                      >
                        Chủ nhiệm
                      </NotebookBadge>
                    ) : (
                      <NotebookBadge
                        variant="default"
                        className="text-sm border-2"
                      >
                        Bộ môn
                      </NotebookBadge>
                    )}
                  </div>
                </NotebookCardHeader>
                <NotebookCardContent className="py-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 p-3 rounded-lg border-2 border-gray-300">
                      <span className="block text-sm text-gray-500 font-bold uppercase">
                        Sĩ số
                      </span>
                      <span className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        <Users className="w-5 h-5" /> {classData.student_count}
                      </span>
                    </div>
                    <div className="bg-white/60 p-3 rounded-lg border-2 border-gray-300">
                      <span className="block text-sm text-gray-500 font-bold uppercase">
                        Khối
                      </span>
                      <span className="text-2xl font-black text-gray-800">
                        {classData.grade}
                      </span>
                    </div>
                    <div className="bg-white/60 p-3 rounded-lg border-2 border-gray-300">
                      <span className="block text-sm text-gray-500 font-bold uppercase">
                        Mã lớp
                      </span>
                      <span className="text-xl font-bold text-gray-800 tracking-wider">
                        {classData.class_code}
                      </span>
                    </div>
                    <div className="bg-white/60 p-3 rounded-lg border-2 border-gray-300">
                      <span className="block text-sm text-gray-500 font-bold uppercase">
                        Môn học
                      </span>
                      <span
                        className="text-xl font-bold text-gray-800 truncate block"
                        title={classData.subjects
                          ?.map((s) => s.name)
                          .join(", ")}
                      >
                        {classData.subjects?.map((s) => s.name).join(", ") ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                </NotebookCardContent>
                <div className="p-6 pt-0 flex gap-3 flex-col sm:flex-row border-t-2 border-dashed border-gray-300 mt-4 h-auto items-end">
                  <Link
                    href={`/teacher/classes/${classData.id}`}
                    className="flex-1 w-full mt-4"
                  >
                    <NotebookButton className="w-full bg-blue-100 text-blue-900 border-blue-900 hover:bg-blue-200 text-lg">
                      <Eye className="w-5 h-5 mr-2" />
                      Xem lớp
                    </NotebookButton>
                  </Link>
                  {classData.type === "homeroom" && (
                    <Link
                      href={`/teacher/classes/${classData.id}`}
                      className="flex-1 w-full mt-4 sm:mt-4"
                    >
                      <NotebookButton className="w-full bg-green-100 text-green-900 border-green-900 hover:bg-green-200 text-lg">
                        <Users2 className="w-5 h-5 mr-2" />
                        Học sinh
                      </NotebookButton>
                    </Link>
                  )}
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
