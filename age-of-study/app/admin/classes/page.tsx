'use client';

import { BookOpen, Users, BarChart3 } from "lucide-react";

export default function ClassesPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quản lý lớp học
        </h1>
        <p className="text-gray-600">
          Quản lý tất cả các lớp học trong hệ thống
        </p>
      </div>

      {/* Coming Soon Message */}
      <div className="bg-white rounded-xl border-2 border-gray-100 p-12 text-center">
        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-teal-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Tính năng đang phát triển
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Trang quản lý lớp học sẽ cho phép bạn xem, tạo và quản lý các lớp học,
          cũng như theo dõi hoạt động của học sinh trong từng lớp.
        </p>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-100">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Danh sách lớp</h3>
            <p className="text-sm text-gray-600">
              Xem tất cả các lớp học đang hoạt động
            </p>
          </div>

          <div className="p-6 bg-green-50 rounded-lg border-2 border-green-100">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Quản lý thành viên</h3>
            <p className="text-sm text-gray-600">
              Phê duyệt và quản lý học sinh trong lớp
            </p>
          </div>

          <div className="p-6 bg-teal-50 rounded-lg border-2 border-teal-100">
            <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Thống kê lớp học</h3>
            <p className="text-sm text-gray-600">
              Xem báo cáo và tiến độ của từng lớp
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
