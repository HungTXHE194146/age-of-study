"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Loading from "@/components/ui/loading";
import {
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  PlusCircle,
  LogOut,
  BookOpen,
  Calendar,
  ChevronRight,
  TrendingUp,
  Award,
  Download,
  QrCode,
  GraduationCap,
} from "lucide-react";
import { checkRoutePermission } from "@/lib/routeMiddleware";
import {
  NotebookCard,
  NotebookCardHeader,
  NotebookCardTitle,
  NotebookCardContent,
  NotebookButton,
  NotebookBadge,
} from "@/components/ui/notebook-card";
import {
  getTeacherDashboardSummary,
  DashboardSummary,
} from "@/lib/dashboardService";

export default function TeacherDashboard() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // No need to call checkAuth() here - the layout already does it
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Check route permissions using centralized middleware
      const currentPath = window.location.pathname;
      const redirectPath = checkRoutePermission({
        user,
        currentPath,
        isAuthenticated,
      });

      if (redirectPath) {
        router.push(redirectPath);
        return;
      }

      // Fetch dashboard summary
      const fetchSummary = async () => {
        try {
          const result = await getTeacherDashboardSummary(user.id);
          if (result.data) {
            setSummary(result.data);
          }
        } catch (error) {
          console.error("Failed to fetch dashboard summary:", error);
        } finally {
          setLoadingSummary(false);
        }
      };

      fetchSummary();
    } else if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || (loadingSummary && !summary)) {
    return (
      <Loading
        message="Đang chuẩn bị bảng điều khiển cho thầy cô..."
        size="lg"
        fullScreen
      />
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const todayLabel = (() => {
    return new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  })();

  const handleNavigate = (path: string) => {
    router.push(path);
  };
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">
      {/* Top Decoration Bar */}
      <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 w-full" />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-teal-600 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {todayLabel}
            </h2>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
              Chào thầy cô,{" "}
              <span className="text-indigo-600">
                {user.full_name || user.username}
              </span>
              !
            </h1>
            <p className="text-base sm:text-xl text-gray-600 font-medium">
              Hôm nay thầy cô có{" "}
              <span className="text-emerald-600 font-bold">
                {summary?.totalClasses || 0} lớp học
              </span>{" "}
              cần quan tâm.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <NotebookButton
              onClick={() => handleNavigate("/teacher/classes")}
              className="bg-emerald-100 text-teal-800 border-teal-800"
            >
              <Users className="w-5 h-5 mr-2" />
              Danh sách lớp{" "}
            </NotebookButton>
            <NotebookButton
              onClick={() => handleNavigate("/teacher/skill-tree")}
              className="bg-indigo-100 text-indigo-800 border-indigo-800"
            >
              <Award className="w-5 h-5 mr-2" />
              Skill Tree
            </NotebookButton>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <NotebookCard className="bg-emerald-50/50 border-emerald-800">
            <NotebookCardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-200 rounded-xl border-2 border-emerald-800">
                  <Users className="w-8 h-8 text-emerald-900" />
                </div>
                <NotebookBadge variant="success">Sĩ số</NotebookBadge>
              </div>
              <div className="text-3xl sm:text-5xl font-black text-emerald-900">
                {summary?.totalStudents || 0}
              </div>
              <div className="text-base sm:text-lg font-bold text-emerald-700 mt-1 uppercase text-left">
                Tổng số học sinh
              </div>
            </NotebookCardContent>
          </NotebookCard>

          <NotebookCard className="bg-amber-50/50 border-amber-800">
            <NotebookCardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-200 rounded-xl border-2 border-amber-800">
                  <TrendingUp className="w-8 h-8 text-amber-900" />
                </div>
                <NotebookBadge variant="warning">Hoạt động</NotebookBadge>
              </div>
              <div className="text-3xl sm:text-5xl font-black text-amber-900">
                {summary?.studentsActiveToday || 0}
              </div>
              <div className="text-base sm:text-lg font-bold text-amber-700 mt-1 uppercase text-left">
                Bạn học bài hôm nay
              </div>
            </NotebookCardContent>
          </NotebookCard>

          <NotebookCard className="bg-indigo-50/50 border-indigo-800">
            <NotebookCardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-200 rounded-xl border-2 border-indigo-800">
                  <BookOpen className="w-8 h-8 text-indigo-900" />
                </div>
                <NotebookBadge>Khóa học</NotebookBadge>
              </div>
              <div className="text-3xl sm:text-5xl font-black text-indigo-900">
                {summary?.totalClasses || 0}
              </div>
              <div className="text-base sm:text-lg font-bold text-indigo-700 mt-1 uppercase text-left">
                Lớp giảng dạy
              </div>
            </NotebookCardContent>
          </NotebookCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Classes List Section */}
          <div className="lg:col-span-2 space-y-10 text-left">
            {/* Homeroom Section (Integrated View) */}
            {summary?.homeroomDetails ? (
              <div className="space-y-6">
                <h2 className="text-3xl font-black text-indigo-900 flex items-center gap-3">
                  🌟 Lớp chủ nhiệm: {summary.homeroomDetails.className}
                  <div className="h-1 bg-indigo-200 flex-1 ml-2" />
                </h2>

                <NotebookCard className="border-indigo-600 shadow-[8px_8px_0_0_#4f46e5] overflow-hidden">
                  <NotebookCardHeader className="bg-indigo-50/50 border-b-2 border-indigo-100 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white border-2 border-indigo-600 rounded-2xl flex items-center justify-center shadow-[4px_4px_0_0_#4f46e5]">
                          <GraduationCap className="w-10 h-10 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-indigo-950">
                            {summary.homeroomDetails.className}
                          </h3>
                          <p className="text-indigo-600 font-bold flex items-center gap-2">
                            <Users className="w-4 h-4" /> {summary.homeroomDetails.students.length} học sinh đang theo dõi
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <NotebookButton
                          onClick={() => handleNavigate(`/teacher/classes/${summary.homeroomDetails?.classId}`)}
                          className="bg-white border-indigo-600 text-indigo-600"
                        >
                          Xem chi tiết
                        </NotebookButton>
                      </div>
                    </div>
                  </NotebookCardHeader>

                  <NotebookCardContent className="py-8">
                    {/* Key Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-3xl border-2 border-indigo-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <BarChart3 className="w-6 h-6 text-indigo-600" />
                          <span className="font-bold text-gray-500 uppercase tracking-wider text-xs">Điểm trung bình</span>
                        </div>
                        <div className="text-4xl font-black text-indigo-900">
                          {summary.homeroomDetails.averageScore.toFixed(1)}
                        </div>
                        <div className="mt-2 text-xs font-bold text-indigo-400 bg-indigo-50 px-2 py-1 rounded-full inline-block">
                          Ổn định
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-3xl border-2 border-emerald-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <ClipboardList className="w-6 h-6 text-emerald-600" />
                          <span className="font-bold text-gray-500 uppercase tracking-wider text-xs">Hoàn thành bài</span>
                        </div>
                        <div className="text-4xl font-black text-emerald-700">
                          {summary.homeroomDetails.completionRate.toFixed(0)}%
                        </div>
                        <div className="w-full bg-emerald-100 h-2 rounded-full mt-3 overflow-hidden border border-emerald-200">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-1000"
                            style={{ width: `${summary.homeroomDetails.completionRate}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-3xl border-2 border-orange-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <TrendingUp className="w-6 h-6 text-orange-600" />
                          <span className="font-bold text-gray-500 uppercase tracking-wider text-xs">Hoạt động tuần này</span>
                        </div>
                        <div className="text-4xl font-black text-orange-700">
                          {summary.homeroomDetails.activityLogs.length}
                        </div>
                        <p className="text-xs font-medium text-orange-400 mt-2">Sự kiện mới trong lớp</p>
                      </div>
                    </div>

                    {/* Quick Student Grid (Mini) */}
                    <div>
                      <h4 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5" /> Danh sách học sinh ({summary.homeroomDetails.students.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {summary.homeroomDetails.students.slice(0, 10).map((s: any) => (
                          <div
                            key={s.student_id}
                            onClick={() => handleNavigate(`/teacher/classes/${summary.homeroomDetails?.classId}/students/${s.student_id}`)}
                            className="flex flex-col items-center p-3 rounded-2xl hover:bg-gray-50 border-2 border-transparent hover:border-gray-200 cursor-pointer transition-all"
                          >
                            <div className="w-12 h-12 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-700 font-black mb-2 shadow-sm overflow-hidden">
                              {s.profile.avatar_url ? (
                                <img src={s.profile.avatar_url} alt={s.profile.full_name} className="w-full h-full object-cover" />
                              ) : (
                                s.profile.full_name?.[0] || '?'
                              )}
                            </div>
                            <span className="text-[10px] font-black text-gray-700 text-center line-clamp-1">{s.profile.full_name}</span>
                            <span className="text-[8px] font-bold text-indigo-400 uppercase">{s.profile.total_xp} XP</span>
                          </div>
                        ))}
                        {summary.homeroomDetails.students.length > 10 && (
                          <div
                            onClick={() => handleNavigate(`/teacher/classes/${summary.homeroomDetails?.classId}`)}
                            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-100 transition-all"
                          >
                            <span className="text-xs font-black text-gray-400">+{summary.homeroomDetails.students.length - 10}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">Xem thêm</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </NotebookCardContent>
                </NotebookCard>
              </div>
            ) : (
              // Fallback for non-homeroom teachers but who might have subject classes
              summary?.homeroomClasses && summary.homeroomClasses.length > 0 && (
                <div className="space-y-6 text-center py-10 opacity-50">
                  <p>Lớp chủ nhiệm đang tải...</p>
                </div>
              )
            )}

            {/* Subject Classes Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                📖 Lớp học bộ môn
                <div className="h-1 bg-gray-200 flex-1 ml-2" />
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {summary?.subjectClasses.map((cls) => (
                  <NotebookCard
                    key={cls.id}
                    className="group hover:-translate-y-1 transition-all duration-300"
                  >
                    <NotebookCardHeader className="bg-blue-50/50">
                      <div className="flex justify-between items-center">
                        <NotebookCardTitle className="text-2xl">
                          {cls.name}
                        </NotebookCardTitle>
                        <NotebookBadge>{cls.school_year}</NotebookBadge>
                      </div>
                    </NotebookCardHeader>
                    <NotebookCardContent className="py-4">
                      <div className="flex items-center gap-2 text-gray-600 font-bold">
                        <Users className="w-4 h-4" />
                        {cls.student_count} học sinh
                      </div>
                    </NotebookCardContent>
                    <div className="p-4 pt-0 flex gap-3">
                      <NotebookButton
                        onClick={() =>
                          handleNavigate(`/teacher/classes/${cls.id}`)
                        }
                        className="flex-1 py-1 text-sm bg-white border-gray-300"
                      >
                        Vào lớp
                      </NotebookButton>
                      <NotebookButton
                        onClick={() =>
                          handleNavigate(`/teacher/tests/create?classId=${cls.id}`)
                        }
                        className="flex-1 py-1 text-sm bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        Giao bài
                      </NotebookButton>
                    </div>
                  </NotebookCard>
                ))}

                {summary?.subjectClasses.length === 0 && (!summary?.homeroomClasses || summary.homeroomClasses.length === 0) && (
                  <div className="col-span-full py-12 text-center text-gray-400 font-bold border-4 border-dashed border-gray-100 rounded-3xl">
                    Chưa có lớp học nào được gán cho thầy cô.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Panel: Recent Activity */}
          <div className="space-y-6 text-left">
            <h2 className="text-3xl font-black text-gray-900">Hoạt động mới</h2>

            <NotebookCard className="border-indigo-200 shadow-none">
              <NotebookCardContent className="p-4 space-y-4 pt-4">
                {(summary?.homeroomDetails?.activityLogs || summary?.recentActivities || []).map((activity: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex gap-3 pb-3 border-b-2 border-dashed border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-200 flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-indigo-900 border-b border-indigo-50 inline-block mb-1">
                        {activity.student?.full_name ||
                          activity.student?.username || "Ẩn danh"}
                      </p>
                      <p className="text-sm text-gray-500 font-medium leading-tight">
                        {activity.description || (
                          activity.activity_type === "node_complete"
                            ? "✅ Hoàn thành bài học"
                            : "📝 Đang học tập"
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-indigo-400 font-black uppercase">
                          {new Date(activity.created_at).toLocaleTimeString(
                            "vi-VN",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                        {activity.xp_earned > 0 && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1 rounded font-bold">
                            +{activity.xp_earned} XP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {(!summary?.homeroomDetails?.activityLogs?.length && !summary?.recentActivities?.length) && (
                  <p className="text-center py-8 text-gray-400 font-bold italic">
                    Chưa có hoạt động mới nào.
                  </p>
                )}
              </NotebookCardContent>
            </NotebookCard>

            {/* Quick Actions Panel */}
            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-[8px_8px_0_0_#312e81] border-4 border-[#312e81]">
              <h3 className="text-2xl font-black mb-4">Hành động nhanh</h3>
              <div className="space-y-4">
                <button
                  onClick={() => handleNavigate("/teacher/tests/create?type=homework")}
                  className="w-full py-3 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 border-2 border-emerald-700"
                >
                  <PlusCircle className="w-5 h-5" />
                  GIAO BÀI TẬP VỀ NHÀ
                </button>
                <button
                  onClick={() => handleNavigate("/teacher/tests/create")}
                  className="w-full py-3 bg-white text-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  TẠO BÀI KIỂM TRA
                </button>
                <button
                  onClick={() => handleNavigate("/teacher/classes")}
                  className="w-full py-3 bg-white/20 text-white rounded-2xl font-black hover:bg-white/30 transition-colors flex items-center justify-center gap-2 border-2 border-white/50"
                >
                  <QrCode className="w-5 h-5" />
                  IN THẺ QR LỚP
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
