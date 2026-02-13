'use client'

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/components/ui/loading";
import { 
  ClipboardList, 
  Users, 
  BarChart3, 
  Settings,
  Plus
} from "lucide-react";

export default function TeacherDashboard() {
  const { user, checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <Loading message="Đang tải bảng điều khiển giáo viên..." size="lg" fullScreen />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Bảng Điều Khiển Giáo Viên
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          Chào mừng {user.full_name || user.username}! Quản lý lớp học và bài kiểm tra của bạn.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Test Management Card */}
        <div 
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all border-2 border-blue-100 cursor-pointer hover:border-blue-300"
          onClick={() => handleNavigate('/teacher/tests')}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
          <h3 className="text-base sm:text-xl font-bold text-blue-600 mb-2">
            Quản lý bài kiểm tra
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
            Tạo, chỉnh sửa và quản lý các bài kiểm tra cho học sinh
          </p>
          <button className="w-full px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors text-sm">
            Quản lý ngay
          </button>
        </div>

        {/* Student Management Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all border-2 border-green-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          </div>
          <h3 className="text-base sm:text-xl font-bold text-green-600 mb-2">
            Quản lý học sinh
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
            Theo dõi tiến độ và hiệu suất học tập của học sinh
          </p>
          <button className="w-full px-3 sm:px-4 py-2 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors text-sm">
            Xem danh sách
          </button>
        </div>

        {/* Analytics Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all border-2 border-purple-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          </div>
          <h3 className="text-base sm:text-xl font-bold text-purple-600 mb-2">
            Thống kê & Báo cáo
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
            Phân tích kết quả học tập và hiệu quả giảng dạy
          </p>
          <button className="w-full px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-full font-semibold hover:bg-purple-600 transition-colors text-sm">
            Xem báo cáo
          </button>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all border-2 border-orange-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
          </div>
          <h3 className="text-base sm:text-xl font-bold text-orange-600 mb-2">
            Cài đặt
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
            Cấu hình lớp học và tùy chọn giảng dạy
          </p>
          <button className="w-full px-3 sm:px-4 py-2 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors text-sm">
            Cài đặt
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 sm:mt-12 bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-md">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
          Hành động nhanh
        </h2>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <button 
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors text-sm sm:text-base"
            onClick={() => handleNavigate('/teacher/tests/create')}
          >
            ✨ Tạo bài kiểm tra mới
          </button>
          <button className="px-4 sm:px-6 py-2 sm:py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors text-sm sm:text-base">
            📊 Xem thống kê lớp học
          </button>
          <button className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-500 text-white rounded-full font-semibold hover:bg-purple-600 transition-colors text-sm sm:text-base">
            📈 Xuất báo cáo
          </button>
        </div>
      </div>
    </div>
  );
}