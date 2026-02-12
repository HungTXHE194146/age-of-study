'use client'

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  ClipboardList, 
  Users, 
  BarChart3, 
  Settings,
  Plus,
  LogOut
} from "lucide-react";
import { checkRoutePermission } from "@/lib/routeMiddleware";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function TeacherDashboard() {
  const { user, checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Check route permissions using centralized middleware
      const currentPath = window.location.pathname;
      const redirectPath = checkRoutePermission({
        user,
        currentPath,
        isAuthenticated
      });

      if (redirectPath) {
        router.push(redirectPath);
        return;
      }
    } else if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Đang tải..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Bảng Điều Khiển Giáo Viên
            </h1>
            <p className="text-lg text-gray-600">
              Chào mừng {user.full_name || user.username}! Quản lý lớp học và bài kiểm tra của bạn.
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors"
            onClick={() => {
              // Gọi hàm logout từ store
              const { logout } = useAuthStore.getState();
              logout();
              router.push("/login");
            }}
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Test Management Card */}
        <div 
          className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all border-2 border-blue-100 cursor-pointer hover:border-blue-300"
          onClick={() => handleNavigate('/teacher/tests')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <Plus className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-blue-600 mb-2">
            Quản lý bài kiểm tra
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Tạo, chỉnh sửa và quản lý các bài kiểm tra cho học sinh
          </p>
          <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors">
            Quản lý ngay
          </button>
        </div>

        {/* Student Management Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all border-2 border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <Plus className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-green-600 mb-2">
            Quản lý học sinh
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Theo dõi tiến độ và hiệu suất học tập của học sinh
          </p>
          <button className="w-full px-4 py-2 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors">
            Xem danh sách
          </button>
        </div>

        {/* Analytics Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all border-2 border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <Plus className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-purple-600 mb-2">
            Thống kê & Báo cáo
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Phân tích kết quả học tập và hiệu quả giảng dạy
          </p>
          <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-full font-semibold hover:bg-purple-600 transition-colors">
            Xem báo cáo
          </button>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all border-2 border-orange-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
            <Plus className="w-5 h-5 text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-orange-600 mb-2">
            Cài đặt
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Cấu hình lớp học và tùy chọn giảng dạy
          </p>
          <button className="w-full px-4 py-2 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors">
            Cài đặt
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-12 bg-white rounded-2xl p-8 shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          Hành động nhanh
        </h2>
        <div className="flex flex-wrap gap-4">
          <button 
            className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
            onClick={() => handleNavigate('/teacher/tests/create')}
          >
            ✨ Tạo bài kiểm tra mới
          </button>
          <button className="px-6 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors">
            📊 Xem thống kê lớp học
          </button>
          <button className="px-6 py-3 bg-purple-500 text-white rounded-full font-semibold hover:bg-purple-600 transition-colors">
            📈 Xuất báo cáo
          </button>
        </div>
      </div>
    </div>
  );
}