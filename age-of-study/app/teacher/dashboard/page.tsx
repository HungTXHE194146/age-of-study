"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { checkRoutePermission } from "@/lib/routeMiddleware";
import { NotebookCard, NotebookCardHeader, NotebookCardTitle, NotebookCardContent, NotebookButton, NotebookBadge } from "@/components/ui/notebook-card";
import { getTeacherDashboardSummary, DashboardSummary } from "@/lib/dashboardService";

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
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <h1 className="text-5xl font-black text-gray-900 leading-tight">
              Chào thầy cô, <span className="text-indigo-600">{user.full_name || user.username}</span>!
            </h1>
            <p className="text-xl text-gray-600 font-medium">
              Hôm nay thầy cô có <span className="text-emerald-600 font-bold">{summary?.totalClasses || 0} lớp học</span> cần quan tâm.
            </p>
          </div>
          
          <div className="flex gap-4">
            <NotebookButton onClick={() => handleNavigate("/teacher/classes")} className="bg-emerald-100 text-teal-800 border-teal-800">
               <Users className="w-5 h-5 mr-2" />
               Dánh sách lớp
            </NotebookButton>
            <NotebookButton onClick={() => handleNavigate("/teacher/skill-tree")} className="bg-indigo-100 text-indigo-800 border-indigo-800">
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
              <div className="text-5xl font-black text-emerald-900">{summary?.totalStudents || 0}</div>
              <div className="text-lg font-bold text-emerald-700 mt-1 uppercase text-left">Tổng số học sinh</div>
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
              <div className="text-5xl font-black text-amber-900">{summary?.studentsActiveToday || 0}</div>
              <div className="text-lg font-bold text-amber-700 mt-1 uppercase text-left">Bạn học bài hôm nay</div>
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
              <div className="text-5xl font-black text-indigo-900">{summary?.totalClasses || 0}</div>
              <div className="text-lg font-bold text-indigo-700 mt-1 uppercase text-left">Lớp giảng dạy</div>
            </NotebookCardContent>
          </NotebookCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Classes List Section */}
          <div className="lg:col-span-2 space-y-6 text-left">
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              Lớp học của tôi
              <div className="h-1 bg-gray-300 flex-1 ml-2" />
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {summary?.classes.map((cls) => (
                <NotebookCard key={cls.id} className="group hover:scale-[1.02] transition-transform duration-300">
                  <NotebookCardHeader className="bg-blue-50">
                    <div className="flex justify-between items-start">
                      <NotebookCardTitle className="text-2xl">{cls.name}</NotebookCardTitle>
                      <NotebookBadge>{cls.school_year}</NotebookBadge>
                    </div>
                  </NotebookCardHeader>
                  <NotebookCardContent className="py-4">
                    <div className="flex items-center gap-2 text-gray-600 font-bold">
                      <Users className="w-4 h-4" />
                      {cls.student_count} học sinh
                    </div>
                  </NotebookCardContent>
                  <div className="p-6 pt-0 flex gap-3">
                    <NotebookButton 
                      onClick={() => handleNavigate(`/teacher/classes/${cls.id}`)}
                      className="flex-1 py-1 text-base bg-blue-600 text-white border-blue-900"
                    >
                      Vào lớp
                    </NotebookButton>
                    <NotebookButton 
                      onClick={() => handleNavigate(`/teacher/classes/${cls.id}/reports`)}
                      className="aspect-square p-2 bg-amber-100 border-amber-800 group-hover:bg-amber-300"
                      title="Xuất báo cáo"
                    >
                      <Download className="w-5 h-5 text-amber-900" />
                    </NotebookButton>
                  </div>
                </NotebookCard>
              ))}
              
              {summary?.classes.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 font-bold border-4 border-dashed border-gray-200 rounded-2xl">
                   Thầy cô chưa được phân công lớp học nào.
                </div>
              )}
            </div>
          </div>

          {/* Side Panel: Recent Activity */}
          <div className="space-y-6 text-left">
            <h2 className="text-3xl font-black text-gray-900">Hoạt động mới</h2>
            
            <NotebookCard className="border-indigo-200 shadow-none">
              <NotebookCardContent className="p-4 space-y-4 pt-4">
                {summary?.recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex gap-3 pb-3 border-b-2 border-dashed border-gray-100 last:border-0 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-200 flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-indigo-900">{activity.student.full_name || activity.student.username}</p>
                      <p className="text-sm text-gray-500 font-medium">{activity.activity_type === 'node_complete' ? '✅ Đã hoàn thành bài học' : '📝 Đã làm kiểm tra'}</p>
                      <p className="text-xs text-indigo-400 font-bold mt-1 uppercase">
                             {new Date(activity.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {summary?.recentActivities.length === 0 && (
                  <p className="text-center py-8 text-gray-400 font-bold italic">Chưa có hoạt động mới nào.</p>
                )}
              </NotebookCardContent>
            </NotebookCard>

            {/* Quick Actions Panel */}
            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-[8px_8px_0_0_#312e81] border-4 border-[#312e81]">
               <h3 className="text-2xl font-black mb-4">Hành động nhanh</h3>
               <div className="space-y-4">
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
