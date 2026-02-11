'use client';

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

export default function LearnPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  // No need to call checkAuth here - DashboardLayout already handles it

  useEffect(() => {
    // Only redirect after auth has finished loading to avoid race condition
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Chào mừng, {user.full_name || user.username}! 🎉
        </h1>
        <p className="text-lg text-gray-600">
          Sẵn sàng chinh phục kiến thức mới hôm nay chưa?
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Math Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-red-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔢</span>
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-2">Toán Học</h3>
            <p className="text-gray-600 text-sm mb-4">Rèn luyện tư duy logic</p>
            <button className="px-6 py-2 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors">
              Bắt đầu
            </button>
          </div>
        </div>

        {/* English Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-blue-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🇬🇧</span>
            </div>
            <h3 className="text-xl font-bold text-blue-600 mb-2">Tiếng Anh</h3>
            <p className="text-gray-600 text-sm mb-4">
              Phát triển kỹ năng giao tiếp
            </p>
            <button className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors">
              Bắt đầu
            </button>
          </div>
        </div>

        {/* Vietnamese Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-green-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🇻🇳</span>
            </div>
            <h3 className="text-xl font-bold text-green-600 mb-2">
              Tiếng Việt
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Nâng cao văn học quốc ngữ
            </p>
            <button className="px-6 py-2 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors">
              Bắt đầu
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-12 bg-white rounded-2xl p-8 shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          Thống kê của bạn
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-gray-900">
              {user.total_xp ?? 0}
            </div>
            <div className="text-sm text-gray-600">Tổng XP</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-gray-900">
              {user.current_streak ?? 0}
            </div>
            <div className="text-sm text-gray-600">Chuỗi ngày</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📈</div>
            <div className="text-2xl font-bold text-gray-900">
              {user.weekly_xp ?? 0}
            </div>
            <div className="text-sm text-gray-600">XP tuần này</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">❄️</div>
            <div className="text-2xl font-bold text-gray-900">
              {user.freeze_count ?? 0}
            </div>
            <div className="text-sm text-gray-600">Lượt đóng băng</div>
          </div>
        </div>
      </div>
    </div>
  );
}
