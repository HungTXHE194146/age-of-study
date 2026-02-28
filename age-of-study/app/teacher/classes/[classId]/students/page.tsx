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
import { AddStudentModal, AddStudentFromExcelModal } from "@/components/student-management-modals";
import { NotebookCard, NotebookCardHeader, NotebookCardTitle, NotebookCardContent, NotebookButton, NotebookBadge } from "@/components/ui/notebook-card";


interface StudentData {
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

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const fetchClassData = async () => {
    if (!classId || !user?.id) return;

    try {
      setLoading(true);
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
  };

  useEffect(() => {
    fetchClassData();
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
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 p-6 bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2rem] border-b-2 border-dashed border-gray-300">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/teacher/classes`}>
              <NotebookButton
                className="bg-gray-100 text-gray-800 border-gray-800 text-base py-1 px-4"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Về lớp
              </NotebookButton>
            </Link>
            <div className="flex-1 ml-4">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight font-handwritten">
                Học sinh lớp {classData.name}
              </h1>
              <p className="text-xl font-bold text-gray-600 font-handwritten mt-1">
                Khối {classData.grade} • Năm {classData.school_year}
              </p>
            </div>
            {/* Quick Actions at the top */}
            <div className="hidden sm:flex gap-3">
              <NotebookButton onClick={() => setIsAddModalOpen(true)} className="bg-emerald-100 text-emerald-900 border-emerald-900 py-2">
                <UserPlus className="w-5 h-5 mr-2" />
                Thủ công
              </NotebookButton>
              <NotebookButton onClick={() => setIsExcelModalOpen(true)} className="bg-blue-100 text-blue-900 border-blue-900 py-2">
                <Users className="w-5 h-5 mr-2" />
                Từ Excel
              </NotebookButton>
            </div>
          </div>
        </div>

        {/* Mobile Quick Actions */}
        <div className="flex sm:hidden gap-3 mb-6">
          <NotebookButton onClick={() => setIsAddModalOpen(true)} className="flex-1 bg-emerald-100 text-emerald-900 border-emerald-900 py-2 text-sm">
            <UserPlus className="w-4 h-4 mr-1" /> Thêm
          </NotebookButton>
          <NotebookButton onClick={() => setIsExcelModalOpen(true)} className="flex-1 bg-blue-100 text-blue-900 border-blue-900 py-2 text-sm">
            <Users className="w-4 h-4 mr-1" /> Excel
          </NotebookButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           <NotebookCard className="bg-blue-50">
             <NotebookCardContent className="pt-6">
               <div className="flex justify-between items-center mb-2">
                 <span className="font-bold text-gray-600 uppercase text-sm">Sĩ số</span>
                 <Users className="w-6 h-6 text-blue-900" />
               </div>
               <div className="text-4xl font-black text-blue-900">{classData.students.length}</div>
             </NotebookCardContent>
           </NotebookCard>
           
           <NotebookCard className="bg-green-50">
             <NotebookCardContent className="pt-6">
               <div className="flex justify-between items-center mb-2">
                 <span className="font-bold text-gray-600 uppercase text-sm">XP TB</span>
                 <GraduationCap className="w-6 h-6 text-green-900" />
               </div>
               <div className="text-4xl font-black text-green-900">
                  {Math.round(
                    classData.students.reduce((acc, s) => acc + s.profile.total_xp, 0) / (classData.students.length || 1)
                  )}
               </div>
             </NotebookCardContent>
           </NotebookCard>
           
           <NotebookCard className="bg-purple-50">
             <NotebookCardContent className="pt-6">
               <div className="flex justify-between items-center mb-2">
                 <span className="font-bold text-gray-600 uppercase text-sm">Khối</span>
                 <Users className="w-6 h-6 text-purple-900" />
               </div>
               <div className="text-4xl font-black text-purple-900">
                 {Math.max(0, ...classData.students.map((s) => s.profile.grade || 0))}
               </div>
             </NotebookCardContent>
           </NotebookCard>
           
           <NotebookCard className="bg-yellow-50">
             <NotebookCardContent className="pt-6">
               <div className="flex justify-between items-center mb-2">
                 <span className="font-bold text-gray-600 uppercase text-sm">Mới nhất</span>
                 <Plus className="w-6 h-6 text-yellow-900" />
               </div>
               <div className="text-2xl font-black text-yellow-900 mt-2">
                 {classData.students.length > 0
                   ? new Date(
                       Math.max(...classData.students.map((s) => new Date(s.joined_at).getTime()))
                     ).toLocaleDateString("vi-VN")
                   : "N/A"}
               </div>
             </NotebookCardContent>
           </NotebookCard>
        </div>

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
                      <span className="font-bold text-gray-600">Đang học</span>
                      <span className="font-bold text-blue-600 truncate max-w-[120px] text-right" title={student.profile.latest_progress?.nodes?.title}>
                        {student.profile.latest_progress?.nodes?.title || "Chưa có"}
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
                    <NotebookButton className="aspect-square p-2 bg-yellow-100 border-yellow-800 text-yellow-900 hover:bg-yellow-200">
                       <Edit3 className="w-4 h-4" />
                    </NotebookButton>
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
          fetchClassData();
          setCurrentPage(1);
        }}
      />
      <AddStudentFromExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        classId={Number(classId)}
        onSuccess={() => {
          fetchClassData();
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
