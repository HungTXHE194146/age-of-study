'use client';

import { Settings, Shield, Database, Bell } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Cài đặt hệ thống
        </h1>
        <p className="text-gray-600">
          Cấu hình và quản lý các thiết lập của hệ thống
        </p>
      </div>

      {/* Coming Soon Message */}
      <div className="bg-white rounded-xl border-2 border-gray-100 p-12 text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Settings className="w-10 h-10 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Tính năng đang phát triển
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Trang cài đặt sẽ cho phép bạn cấu hình các thông số hệ thống, quản lý
          bảo mật và điều chỉnh các tùy chọn nâng cao.
        </p>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-100">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Cài đặt chung</h3>
            <p className="text-sm text-gray-600">
              Cấu hình cơ bản của hệ thống
            </p>
          </div>

          <div className="p-6 bg-red-50 rounded-lg border-2 border-red-100">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Bảo mật</h3>
            <p className="text-sm text-gray-600">
              Quản lý quyền truy cập và bảo mật
            </p>
          </div>

          <div className="p-6 bg-green-50 rounded-lg border-2 border-green-100">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Dữ liệu</h3>
            <p className="text-sm text-gray-600">Sao lưu và quản lý dữ liệu</p>
          </div>

          <div className="p-6 bg-teal-50 rounded-lg border-2 border-teal-100">
            <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Thông báo</h3>
            <p className="text-sm text-gray-600">Cấu hình email và thông báo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
