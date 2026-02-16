"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getClassDetail } from "@/lib/classService";
import { getTeacherClasses } from "@/lib/classService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Eye,
  UserPlus,
  Users2,
  ArrowLeft,
  Edit3,
  Plus,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Subject } from "@/types/teacher";
import Loading from "@/components/ui/loading";

interface StudentCardProps {
  student: {
    student_id: string;
    joined_at: string;
    profile: {
      full_name: string | null;
      username: string | null;
      total_xp: number;
      grade: number | null;
    };
  };
}

function StudentCard({ student }: StudentCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {student.profile.full_name?.charAt(0) ||
            student.profile.username?.charAt(0) ||
            "?"}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {student.profile.full_name ||
              student.profile.username ||
              "Học sinh"}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {student.profile.username} • {student.profile.total_xp} XP
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              Khối {student.profile.grade}
            </Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Tham gia:{" "}
              {new Date(student.joined_at).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      };
    }>;
  } | null>(null);
  const [teacherData, setTeacherData] = useState<{
    full_name: string | null;
    username: string | null;
    homeroom_classes: Array<{ id: number }>;
    subject_classes: Array<{ id: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/teacher/classes">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {classData.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Khối {classData.grade} • {classData.school_year}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Mã lớp
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {classData.class_code}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Học sinh
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {classData.students.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Môn học
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {classData.homeroom_teacher?.subjects?.[0]?.name ||
                      "Chưa xác định"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tạo lúc
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {new Date(classData.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isHomeroomTeacher && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Hành động quản lý
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link href={`/teacher/classes/${classId}/students`}>
                <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <Users2 className="w-4 h-4" />
                  Quản lý học sinh
                </Button>
              </Link>
              <Link href={`/teacher/classes/${classId}/manage`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Quản lý lớp
                </Button>
              </Link>
              <Link href={`/teacher/tests/create?classId=${classId}`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Tạo bài kiểm tra
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Teacher Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Homeroom Teacher */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Giáo viên chủ nhiệm
            </h2>
            {classData.homeroom_teacher ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {classData.homeroom_teacher.full_name?.charAt(0) || "?"}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {classData.homeroom_teacher.full_name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Môn:{" "}
                    {classData.homeroom_teacher.subjects
                      ?.map((s) => s.name)
                      .join(", ") || "Chưa xác định"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Chưa có giáo viên chủ nhiệm
              </div>
            )}
          </div>

          {/* Subject Teachers */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Giáo viên bộ môn
            </h2>
            {classData.subject_teachers.length > 0 ? (
              <div className="space-y-4">
                {classData.subject_teachers.map((teacher, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                      {teacher.teacher.full_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {teacher.teacher.full_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Môn: {teacher.subject.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Chưa có giáo viên bộ môn
              </div>
            )}
          </div>
        </div>

        {/* Students */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              Danh sách học sinh ({classData.students.length})
            </h2>
            {isHomeroomTeacher && (
              <Link href={`/teacher/classes/${classId}/students`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Quản lý chi tiết
                </Button>
              </Link>
            )}
          </div>

          {classData.students.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classData.students.map((student) => (
                <StudentCard key={student.student_id} student={student} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Lớp học này hiện chưa có học sinh nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
