"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Search,
  Users,
  Eye,
  Archive,
  AlertCircle,
  Pencil,
} from "lucide-react";
import {
  getAllClasses,
  getClassDetail,
  createClass,
  archiveClass,
  assignTeacherToClass,
  updateClass,
} from "@/lib/classService";
import type {
  ClassWithCount,
  ClassDetail,
  CreateClassInput,
  AssignTeacherInput,
} from "@/types/class";
import { Subject } from "@/types/teacher";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import CreateClassModal from "@/components/admin/CreateClassModal";
import AssignTeacherModal from "@/components/admin/AssignTeacherModal";
import EditClassModal from "@/components/admin/EditClassModal";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  role: string;
}

// ============================================================================
// Class Card Component (memoized to prevent re-render on modal open/close)
// ============================================================================
interface ClassCardProps {
  cls: ClassWithCount;
  onViewDetail: (id: number) => void;
  onEdit: (cls: ClassWithCount) => void;
  onArchive: (id: number, name: string) => void;
}

const ClassCard = memo(function ClassCard({
  cls,
  onViewDetail,
  onEdit,
  onArchive,
}: ClassCardProps) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-100 p-4 sm:p-6 hover:border-teal-200 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Class Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              {cls.name}
            </h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
              Khối {cls.grade}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-400" />
              <span>Mã lớp: </span>
              <code className="px-2 py-0.5 bg-gray-100 rounded font-mono text-xs font-semibold">
                {cls.class_code}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{cls.student_count} học sinh</span>
            </div>
            <div className="col-span-1 sm:col-span-2 flex items-center gap-2">
              <span className="text-gray-500">GVCN:</span>
              <span className="font-medium text-gray-900">
                {cls.homeroom_teacher_name || "Chưa phân công"}
              </span>
            </div>
            <div className="col-span-1 sm:col-span-2 flex items-center gap-2 text-xs">
              <span className="text-gray-500">Năm học:</span>
              <span className="text-gray-700">{cls.school_year}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetail(cls.id)}
            className="flex items-center gap-2 px-3 py-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors text-sm font-medium"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Chi tiết</span>
          </button>
          <button
            onClick={() => onEdit(cls)}
            className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
            title="Chỉnh sửa lớp"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">Sửa</span>
          </button>
          <button
            onClick={() => onArchive(cls.id, cls.name)}
            className="flex items-center gap-2 px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-sm font-medium"
            title="Lưu trữ lớp"
          >
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">Lưu trữ</span>
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Main Page Component
// ============================================================================
export default function ClassesManagementPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassWithCount[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassWithCount[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState<number | "all">("all");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassWithCount | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterClasses();
  }, [searchTerm, gradeFilter, classes]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load classes
      const classesResult = await getAllClasses();
      if (classesResult.error) {
        console.error("Error loading classes:", classesResult.error);
      } else {
        setClasses(classesResult.data || []);
        setFilteredClasses(classesResult.data || []);
      }

      // Load teachers for dropdown
      const supabase = getSupabaseBrowserClient();
      const { data: teachersData, error: teachersError } = await supabase
        .from("profiles")
        .select("id, full_name, username, role")
        .eq("role", "teacher")
        .order("full_name", { ascending: true });

      if (teachersError) {
        console.error("Error loading teachers:", teachersError);
      } else {
        setTeachers(teachersData || []);
      }

      // Load subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .order("name", { ascending: true });

      if (subjectsError) {
        console.error("Error loading subjects:", subjectsError);
      } else {
        setSubjects(subjectsData || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterClasses = () => {
    let filtered = classes;

    // Grade filter
    if (gradeFilter !== "all") {
      filtered = filtered.filter((c) => c.grade === gradeFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.class_code.toLowerCase().includes(term) ||
          c.homeroom_teacher_name?.toLowerCase().includes(term)
      );
    }

    setFilteredClasses(filtered);
  };

  const handleCreateClass = async (input: CreateClassInput) => {
    const result = await createClass(input);
    if (result.error) {
      alert(`Lỗi tạo lớp: ${result.error}`);
      return false;
    }
    await loadData();
    return true;
  };

  const handleViewDetail = useCallback(async (classId: number) => {
    const result = await getClassDetail(classId);
    if (result.error) {
      alert(`Lỗi tải thông tin lớp: ${result.error}`);
      return;
    }
    if (!result.data) {
      alert('Không tìm thấy thông tin lớp');
      return;
    }
    setSelectedClass(result.data);
    setShowDetailModal(true);
  }, []);

  const handleEditClass = useCallback((cls: ClassWithCount) => {
    setEditingClass(cls);
    setShowEditModal(true);
  }, []);

  const handleEditSubmit = async (
    classId: number,
    updates: { name: string; grade: number; school_year: string }
  ) => {
    const result = await updateClass(classId, updates);
    if (result.error) {
      alert(`Lỗi cập nhật lớp: ${result.error}`);
      return false;
    }
    setShowEditModal(false);
    setEditingClass(null);
    await loadData();
    return true;
  };

  const handleArchiveClass = useCallback(async (classId: number, className: string) => {
    if (
      !confirm(
        `Bạn có chắc muốn lưu trữ lớp "${className}"? Lớp này sẽ không còn hiển thị trong danh sách lớp đang hoạt động.`
      )
    ) {
      return;
    }

    const result = await archiveClass(classId);
    if (result.error) {
      alert(`Lỗi lưu trữ lớp: ${result.error}`);
      return;
    }

    await loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAssignTeacher = async (input: AssignTeacherInput) => {
    const result = await assignTeacherToClass(input);
    if (result.error) {
      alert(`Lỗi phân công giáo viên: ${result.error}`);
      return false;
    }
    
    // Reload class detail
    if (selectedClass) {
      const detailResult = await getClassDetail(selectedClass.id);
      if (detailResult.data) {
        setSelectedClass(detailResult.data);
      }
    }
    
    await loadData();
    return true;
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
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Quản lý lớp học
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Tạo và quản lý các lớp học trong hệ thống
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border-2 border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm lớp, mã lớp, GVCN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) =>
              setGradeFilter(
                e.target.value === "all" ? "all" : parseInt(e.target.value)
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="all">Tất cả khối</option>
            <option value="1">Khối 1</option>
            <option value="2">Khối 2</option>
            <option value="3">Khối 3</option>
            <option value="4">Khối 4</option>
            <option value="5">Khối 5</option>
          </select>

          {/* Create Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Tạo lớp mới</span>
            <span className="sm:hidden">Tạo lớp</span>
          </button>

          {/* Archive Button */}
          <button
            onClick={() => router.push('/admin/classes/archived')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium whitespace-nowrap"
          >
            <Archive className="w-5 h-5" />
            <span className="hidden sm:inline">Lưu trữ</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span className="text-gray-600">
              Tổng số lớp:{" "}
              <span className="font-semibold text-gray-900">
                {classes.length}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">
              Tổng học sinh:{" "}
              <span className="font-semibold text-gray-900">
                {classes.reduce((sum, c) => sum + c.student_count, 0)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Classes List */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-gray-100 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Không tìm thấy lớp học
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || gradeFilter !== "all"
              ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
              : "Chưa có lớp học nào trong hệ thống"}
          </p>
          {!searchTerm && gradeFilter === "all" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              Tạo lớp đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredClasses.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              onViewDetail={handleViewDetail}
              onEdit={handleEditClass}
              onArchive={handleArchiveClass}
            />
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <CreateClassModal
          teachers={teachers}
          subjects={subjects}
          onClose={() => setShowCreateModal(false)}
          onSuccess={async (input) => {
            const success = await handleCreateClass(input);
            if (success) {
              setShowCreateModal(false);
            }
            return success;
          }}
        />
      )}

      {/* Class Detail Modal */}
      {showDetailModal && selectedClass && (
        <ClassDetailModal
          classDetail={selectedClass}
          teachers={teachers}
          subjects={subjects}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedClass(null);
          }}
          onAssignTeacher={() => setShowAssignModal(true)}
        />
      )}

      {/* Assign Teacher Modal */}
      {showAssignModal && selectedClass && (
        <AssignTeacherModal
          classId={selectedClass.id}
          className={selectedClass.name}
          teachers={teachers}
          subjects={subjects}
          onClose={() => setShowAssignModal(false)}
          onSuccess={handleAssignTeacher}
        />
      )}

      {/* Edit Class Modal */}
      {showEditModal && editingClass && (
        <EditClassModal
          classId={editingClass.id}
          initialName={editingClass.name}
          initialGrade={editingClass.grade}
          initialSchoolYear={editingClass.school_year}
          onClose={() => {
            setShowEditModal(false);
            setEditingClass(null);
          }}
          onSuccess={handleEditSubmit}
        />
      )}
    </div>
  );
}

// ============================================================================
// Class Detail Modal Component
// ============================================================================

interface ClassDetailModalProps {
  classDetail: ClassDetail;
  teachers: Profile[];
  subjects: Subject[];
  onClose: () => void;
  onAssignTeacher: () => void;
}

function ClassDetailModal({
  classDetail,
  onClose,
  onAssignTeacher,
}: ClassDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {classDetail.name}
            </h2>
            <p className="text-sm text-gray-600">
              Khối {classDetail.grade} • Năm học {classDetail.school_year}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Class Code */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Mã tham gia lớp</p>
            <code className="text-2xl font-bold text-blue-700 font-mono">
              {classDetail.class_code}
            </code>
            <p className="text-xs text-gray-500 mt-2">
              Học sinh có thể dùng mã này để tham gia lớp
            </p>
          </div>

          {/* Homeroom Teacher */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Giáo viên chủ nhiệm
            </h3>
            {classDetail.homeroom_teacher ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">
                  {classDetail.homeroom_teacher.full_name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Môn dạy:{" "}
                  {classDetail.homeroom_teacher.subjects
                    .map((s) => s.name)
                    .join(", ")}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 italic">Chưa phân công GVCN</p>
            )}
          </div>

          {/* Subject Teachers */}
          {classDetail.subject_teachers.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Giáo viên bộ môn
              </h3>
              <div className="space-y-2">
                {classDetail.subject_teachers.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <span className="font-medium text-gray-900">
                      {st.teacher.full_name}
                    </span>
                    <span className="text-sm text-gray-600">
                      {st.subject.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Students List */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Danh sách học sinh ({classDetail.students.length})
            </h3>
            {classDetail.students.length === 0 ? (
              <p className="text-gray-500 italic">Chưa có học sinh nào</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {classDetail.students.map((student) => (
                  <div
                    key={student.student_id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.profile.full_name || student.profile.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        @{student.profile.username} • {student.profile.total_xp}{" "}
                        XP
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      Tham gia:{" "}
                      {new Date(student.joined_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between gap-3 flex-shrink-0">
          <button
            onClick={onAssignTeacher}
            className="px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition-colors font-medium"
          >
            + Phân công GV
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
