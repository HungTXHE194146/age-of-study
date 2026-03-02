"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getClassDetail } from "@/lib/classService";
import { getTeacherClasses } from "@/lib/classService";
import { TestService } from "@/lib/testService";
import { Test } from "@/types/test";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Eye,
  UserPlus,
  ArrowLeft,
  Edit3,
  Plus,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Loading from "@/components/ui/loading";
import { AddStudentModal, AddStudentFromExcelModal, EditStudentModal } from "@/components/student-management-modals";
import { NotebookCard, NotebookCardHeader, NotebookCardTitle, NotebookCardContent, NotebookButton, NotebookBadge } from "@/components/ui/notebook-card";
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";

export default function ClassDetailPage() {
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
    students: Array<{
      student_id: string;
      joined_at: string;
      profile: {
        full_name: string | null;
        username: string | null;
        total_xp: number;
        grade: number | null;
        latest_activity?: {
          id: string;
          activity_type: string;
          description: string;
          created_at: string;
        } | null;
        latest_progress?: {
          node_id: string;
          status: string;
          score: string;
          last_accessed_at: string;
          completed_at: string;
          nodes: { title: string };
        } | null;
      };
    }>;
  } | null>(null);
  const [teacherData, setTeacherData] = useState<{
    full_name: string | null;
    username: string | null;
    homeroom_classes: Array<{ id: number }>;
    subject_classes: Array<{ id: number }>;
  } | null>(null);
  const [classTests, setClassTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"name" | "xp" | "grade" | "joined">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

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

        // Fetch teacher data to check if they're homeroom teacher
        const teacherResult = await getTeacherClasses(user.id);
        if (teacherResult.error) {
          setError(teacherResult.error);
          return;
        }

        // Fetch class tests
        const testService = new TestService();
        const tests = await testService.getTestsByClass(Number(classId));
        setClassTests(tests);

        setClassData(classResult.data);
        setTeacherData(teacherResult.data);
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
      <Loading message="Đang tải thông tin lớp học..." size="lg" fullScreen />
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

  // Check if current teacher is homeroom teacher
  const isHomeroomTeacher = teacherData?.homeroom_classes?.some(
    (c) => c.id === Number(classId),
  );

  // Sorting and filtering logic for students
  const filteredAndSortedStudents = classData.students
    .filter((student) => {
      const matchesSearch =
        student.profile.full_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        student.profile.username
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
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

  const reloadData = async () => {
    try {
      const classResult = await getClassDetail(Number(classId));
      if (!classResult.error) {
        setClassData(classResult.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 p-6 bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2rem] border-b-2 border-dashed border-gray-300">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/teacher/classes">
              <NotebookButton className="bg-gray-100 text-gray-800 border-gray-800 text-base py-1 px-4">
                <ArrowLeft className="w-5 h-5 mr-1" />
                Về lớp
              </NotebookButton>
            </Link>
            <div className="flex-1 ml-4">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight font-handwritten">
                {classData.name}
              </h1>
              <p className="text-xl font-bold text-gray-600 font-handwritten mt-1">
                Khối {classData.grade} • Năm {classData.school_year}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
            <NotebookCard className="bg-blue-50">
              <NotebookCardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-600 uppercase text-sm">Mã lớp</span>
                  <GraduationCap className="w-6 h-6 text-blue-900" />
                </div>
                <div className="text-2xl font-black text-blue-900 mt-2">
                  {classData.class_code}
                </div>
              </NotebookCardContent>
            </NotebookCard>

            <NotebookCard className="bg-green-50">
              <NotebookCardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-600 uppercase text-sm">Học sinh</span>
                  <Users className="w-6 h-6 text-green-900" />
                </div>
                <div className="text-4xl font-black text-green-900">
                  {classData.students.length}
                </div>
              </NotebookCardContent>
            </NotebookCard>

            <NotebookCard className="bg-purple-50">
              <NotebookCardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-600 uppercase text-sm">Môn học</span>
                  <BookOpen className="w-6 h-6 text-purple-900" />
                </div>
                <div className="text-2xl font-black text-purple-900 mt-2 truncate max-w-[150px]" title={classData.homeroom_teacher?.subjects?.[0]?.name || "Chưa xác định"}>
                  {classData.homeroom_teacher?.subjects?.[0]?.name || "Chưa xác định"}
                </div>
              </NotebookCardContent>
            </NotebookCard>

            <NotebookCard className="bg-yellow-50">
              <NotebookCardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-600 uppercase text-sm">Tạo lúc</span>
                  <Calendar className="w-6 h-6 text-yellow-900" />
                </div>
                <div className="text-2xl font-black text-yellow-900 mt-2">
                  {new Date(classData.created_at).toLocaleDateString("vi-VN")}
                </div>
              </NotebookCardContent>
            </NotebookCard>
          </div>
        </div>

        {/* Actions Section Notebook Style */}
        {isHomeroomTeacher && (
          <NotebookCard className="mb-8 bg-blue-50/50">
            <NotebookCardContent className="pt-6">
              <h2 className="text-2xl font-black font-handwritten mb-4">
                Hành động quản lý
              </h2>
              <div className="flex flex-wrap gap-3">
                <Link href={`/teacher/classes/${classId}/attendance`}>
                  <NotebookButton className="flex items-center gap-2 bg-blue-100 border-blue-800 text-blue-900 font-bold hover:bg-blue-200">
                    <Calendar className="w-5 h-5" />
                    Điểm danh
                  </NotebookButton>
                </Link>
                <Link href={`/teacher/classes/${classId}/qr-codes`}>
                  <NotebookButton className="flex items-center gap-2 bg-purple-100 border-purple-800 text-purple-900 font-bold hover:bg-purple-200">
                    <Users className="w-5 h-5" />
                    Quản lý QR
                  </NotebookButton>
                </Link>
                <Link href={`/teacher/classes/${classId}/reports`}>
                  <NotebookButton className="flex items-center gap-2 bg-yellow-100 border-yellow-800 text-yellow-900 font-bold hover:bg-yellow-200">
                    <Eye className="w-5 h-5" />
                    Báo cáo
                  </NotebookButton>
                </Link>
                <Link href={`/teacher/tests/create?classId=${classId}`}>
                  <NotebookButton className="flex items-center gap-2 border-gray-800 font-bold">
                    <Plus className="w-5 h-5" />
                    Tạo bài kiểm tra
                  </NotebookButton>
                </Link>
              </div>
            </NotebookCardContent>
          </NotebookCard>
        )}

        {/* Teacher Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Homeroom Teacher */}
          <NotebookCard className="bg-[#fffdf8]">
            <NotebookCardContent className="pt-6 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-yellow-200/50 -translate-y-2 border border-yellow-300"></div>
              <h2 className="text-2xl font-black font-handwritten mb-4 flex items-center gap-2 border-b-2 border-dashed border-gray-300 pb-2">
                <GraduationCap className="w-6 h-6 text-blue-700" />
                Giáo viên chủ nhiệm
              </h2>
              {classData.homeroom_teacher ? (
                <div className="flex items-center gap-4 mt-4">
                  <div className="w-20 h-20 bg-blue-100 border-2 border-black rounded-lg flex items-center justify-center text-3xl font-black text-blue-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)] -rotate-3">
                    {classData.homeroom_teacher.full_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 truncate" title={classData.homeroom_teacher.full_name || ""}>
                      {classData.homeroom_teacher.full_name}
                    </h3>
                    <p className="text-lg font-bold text-gray-600 mt-1">
                      Môn:{" "}
                      {classData.homeroom_teacher.subjects
                        ?.map((s) => s.name)
                        .join(", ") || "Chưa xác định"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 font-bold border-2 border-dashed border-gray-300 rounded-lg mt-4 bg-gray-50">
                  Chưa có giáo viên chủ nhiệm
                </div>
              )}
            </NotebookCardContent>
          </NotebookCard>

          {/* Subject Teachers */}
          <NotebookCard className="bg-[#fffdf8]">
            <NotebookCardContent className="pt-6 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-yellow-200/50 -translate-y-2 border border-yellow-300"></div>
              <h2 className="text-2xl font-black font-handwritten mb-4 flex items-center gap-2 border-b-2 border-dashed border-gray-300 pb-2">
                <BookOpen className="w-6 h-6 text-purple-700" />
                Giáo viên bộ môn
              </h2>
              {classData.subject_teachers.length > 0 ? (
                <div className="space-y-4 mt-4 overflow-y-auto max-h-[160px] pr-2 custom-scrollbar">
                  {classData.subject_teachers.map((teacher, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 bg-white border-2 border-gray-300 rounded-lg shadow-sm hover:border-purple-300 transition-colors"
                    >
                      <div className="w-12 h-12 bg-purple-100 border-2 border-black rounded-full flex items-center justify-center text-xl font-black text-purple-900 flex-shrink-0">
                        {teacher.teacher.full_name?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-bold text-gray-900 truncate" title={teacher.teacher.full_name || ""}>
                          {teacher.teacher.full_name}
                        </h4>
                        <p className="text-sm font-bold text-gray-600">
                          Môn: {teacher.subject.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 font-bold border-2 border-dashed border-gray-300 rounded-lg mt-4 bg-gray-50">
                  Chưa có giáo viên bộ môn
                </div>
              )}
            </NotebookCardContent>
          </NotebookCard>
        </div>

        {/* Integrated Class Tests List */}
        <div className="mt-12 mb-6 flex justify-between items-end border-b-2 border-dashed border-gray-400 pb-4">
          <div>
            <h2 className="text-3xl font-black font-handwritten text-gray-900 flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-indigo-700" />
              Bài kiểm tra của lớp ({classTests.length})
            </h2>
            <p className="text-gray-600 font-bold mt-1">Quản lý các bài kiểm tra được giao cho lớp này</p>
          </div>
          {isHomeroomTeacher && (
            <div className="hidden sm:flex gap-3">
              <Link href={`/teacher/tests/create?classId=${classId}`}>
                <NotebookButton className="bg-indigo-100 text-indigo-900 border-indigo-900 py-2">
                  <Plus className="w-5 h-5 mr-2" />
                  Tạo bài mới
                </NotebookButton>
              </Link>
            </div>
          )}
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {classTests.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 font-bold border-4 border-dashed border-gray-400 bg-white/50 rounded-2xl text-xl">
              Chưa có bài kiểm tra nào được giao cho lớp này.
            </div>
          ) : (
            classTests.map((test) => (
              <NotebookCard key={test.id} className="group hover:-translate-y-1 transition-transform bg-white">
                <NotebookCardHeader className="bg-indigo-50 border-indigo-200">
                  <div className="flex justify-between items-start">
                    <NotebookCardTitle className="text-xl text-indigo-900 truncate" title={test.title}>{test.title}</NotebookCardTitle>
                    {test.is_published ? (
                      <NotebookBadge variant="success">Đã xuất bản</NotebookBadge>
                    ) : (
                      <NotebookBadge variant="warning">Bản nháp</NotebookBadge>
                    )}
                  </div>
                </NotebookCardHeader>
                <NotebookCardContent className="pt-4 py-4">
                  <p className="text-gray-600 text-sm line-clamp-2 min-h-[40px] font-medium">{test.description || "Không có mô tả"}</p>
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                      <span>Loại:</span>
                      <span className="uppercase text-indigo-700">{test.type === 'practice' ? 'Luyện tập' : 'Thi thật'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                      <span>Thời gian:</span>
                      <span>{test.settings?.time_limit ? `${test.settings.time_limit} phút` : "Không giới hạn"}</span>
                    </div>
                  </div>
                </NotebookCardContent>
                <div className="p-4 pt-0 flex gap-2 border-t-2 border-dashed border-gray-200 mt-2">
                  <Link href={`/teacher/tests/${test.id}?classId=${classId}`} className="flex-1">
                    <NotebookButton className="w-full text-sm py-2 bg-indigo-100 border-indigo-800 text-indigo-900 hover:bg-indigo-200">
                      <Eye className="w-4 h-4 mr-1" /> Chi tiết
                    </NotebookButton>
                  </Link>
                </div>
              </NotebookCard>
            ))
          )}
        </div>

        {/* Integrated Student List */}
        <div className="mt-12 mb-6 flex justify-between items-end border-b-2 border-dashed border-gray-400 pb-4">
          <div>
            <h2 className="text-3xl font-black font-handwritten text-gray-900 flex items-center gap-2">
              <Users className="w-8 h-8 text-green-700" />
              Danh sách học sinh ({classData.students.length})
            </h2>
            <p className="text-gray-600 font-bold mt-1">Quản lý học viên trong lớp</p>
          </div>
          {isHomeroomTeacher && (
            <div className="hidden sm:flex gap-3">
              <NotebookButton onClick={() => setIsAddModalOpen(true)} className="bg-emerald-100 text-emerald-900 border-emerald-900 py-2">
                <UserPlus className="w-5 h-5 mr-2" />
                Thêm thủ công
              </NotebookButton>
              <NotebookButton onClick={() => setIsExcelModalOpen(true)} className="bg-blue-100 text-blue-900 border-blue-900 py-2">
                <Users className="w-5 h-5 mr-2" />
                Thêm từ Excel
              </NotebookButton>
            </div>
          )}
        </div>

        {isHomeroomTeacher && (
          <div className="flex sm:hidden gap-3 mb-6">
            <NotebookButton onClick={() => setIsAddModalOpen(true)} className="flex-1 bg-emerald-100 text-emerald-900 border-emerald-900 py-2 text-sm">
              <UserPlus className="w-4 h-4 mr-1" /> Thêm
            </NotebookButton>
            <NotebookButton onClick={() => setIsExcelModalOpen(true)} className="flex-1 bg-blue-100 text-blue-900 border-blue-900 py-2 text-sm">
              <Users className="w-4 h-4 mr-1" /> Excel
            </NotebookButton>
          </div>
        )}

        {/* Search and Filter Controls */}
        <NotebookCard className="mb-8 border-gray-400 bg-gray-50/80">
          <NotebookCardContent className="pt-6 pb-6 bg-transparent border-b-0">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Tìm học sinh theo tên, mã..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 border-2 border-black rounded-md focus:ring-0 focus:border-blue-600 text-lg font-bold bg-white"
                />
              </div>

              <select
                value={filterGrade}
                onChange={(e) => {
                  setFilterGrade(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-4 py-3 border-2 border-black rounded-md focus:ring-0 focus:border-blue-600 text-lg font-bold bg-white"
              >
                <option value={0}>Tất cả khối</option>
                <option value={1}>Khối 1</option>
                <option value={2}>Khối 2</option>
                <option value={3}>Khối 3</option>
                <option value={4}>Khối 4</option>
                <option value={5}>Khối 5</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 border-t-2 border-dashed border-gray-400 pt-6">
              <div className="text-lg font-bold text-gray-700 bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2rem]">
                {filteredAndSortedStudents.length} học sinh trong danh sách.
              </div>
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <span className="font-bold">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "xp" | "grade" | "joined")}
                  className="px-3 py-1 border-2 border-black rounded-md focus:ring-0 text-base font-bold bg-white"
                >
                  <option value="name">Tên</option>
                  <option value="xp">XP</option>
                  <option value="grade">Khối</option>
                  <option value="joined">Ngày</option>
                </select>
                <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="border-2 border-black bg-white p-1 rounded-md hover:bg-gray-200">
                  {sortOrder === "asc" ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>
            </div>
          </NotebookCardContent>
        </NotebookCard>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredAndSortedStudents.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 font-bold border-4 border-dashed border-gray-400 bg-white/50 rounded-2xl text-xl">
              Không có học sinh nào.
            </div>
          ) : (
            currentStudents.map((student) => (
              <NotebookCard key={student.student_id} className="group hover:-translate-y-1 transition-transform bg-white">
                <NotebookCardContent className="pt-6 relative">
                  {/* Decorative Pin/Tape */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-red-200/50 -translate-y-2 rotate-[-2deg] border border-red-300"></div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-blue-100 border-2 border-black rounded-full flex items-center justify-center text-2xl font-black text-blue-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex-shrink-0">
                      {student.profile.full_name?.charAt(0) || student.profile.username?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 truncate" title={student.profile.full_name || student.profile.username || "Học sinh"}>
                        {student.profile.full_name || student.profile.username || "Học sinh"}
                      </h3>
                      <p className="text-sm font-bold text-gray-500 uppercase">
                        {student.profile.full_name ? student.profile.username : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t-2 border-dashed border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-600">Khối</span>
                      <NotebookBadge className="py-0 px-2 text-sm">{student.profile.grade || "N/A"}</NotebookBadge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-600">XP</span>
                      <span className="font-black text-amber-600">{student.profile.total_xp}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-600">Bài mới nhất</span>
                      <span className="font-bold text-blue-600 truncate max-w-[120px] text-right" title={student.profile.latest_progress?.nodes?.title}>
                        {student.profile.latest_progress?.nodes?.title || "Chưa có"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-600">Hoạt động</span>
                      <span className="text-xs font-bold text-gray-500 truncate max-w-[120px] text-right" title={student.profile.latest_activity?.description}>
                        {student.profile.latest_activity?.description || "Chưa có"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Link
                      href={`/teacher/classes/${classId}/students/${student.student_id}`}
                      className="flex-1"
                    >
                      <NotebookButton className="w-full text-base py-1 bg-gray-100 border-gray-800 hover:bg-gray-200">
                        <Eye className="w-4 h-4 mr-1" /> Xem
                      </NotebookButton>
                    </Link>
                    {isHomeroomTeacher && (
                      <NotebookButton
                        onClick={() => { setSelectedStudent(student); setIsEditModalOpen(true); }}
                        className="aspect-square p-2 bg-yellow-100 border-yellow-800 text-yellow-900 hover:bg-yellow-200"
                      >
                        <Edit3 className="w-4 h-4" />
                      </NotebookButton>
                    )}
                  </div>
                </NotebookCardContent>
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

      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        classId={Number(classId)}
        onSuccess={() => {
          reloadData();
          setCurrentPage(1);
        }}
      />
      <AddStudentFromExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        classId={Number(classId)}
        onSuccess={() => {
          reloadData();
          setCurrentPage(1);
        }}
      />
      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedStudent(null); }}
        student={selectedStudent}
        onSuccess={() => {
          reloadData();
        }}
      />
    </div>
  );
}
