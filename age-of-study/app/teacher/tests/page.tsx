'use client';

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Tag,
  Users,
} from "lucide-react";
import Loading, { LoadingInline } from "@/components/ui/loading";
import { TestService } from "@/lib/testService";

interface Test {
  id: string;
  title: string;
  description: string;
  type: "practice" | "skill";
  time_limit: number;
  created_at: string;
  status: "published" | "draft";
}

export default function TestManagementPage() {
  const { user, checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.id) {
      fetchTests(user.id);
    }
  }, [user]);

  const fetchTests = async (teacherId: string) => {
    setLoading(true);
    try {
      const testService = new TestService();
      const teacherTests = await testService.getTestsByTeacher(teacherId);

      // Map Supabase test data to our interface
      const mappedTests: Test[] = teacherTests.map((test) => ({
        id: test.id,
        title: test.title,
        description: test.description || "",
        type: test.type as "practice" | "skill",
        time_limit: test.settings.time_limit || 0,
        created_at: test.created_at,
        status: test.is_published ? "published" : "draft",
      }));

      setTests(mappedTests);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài kiểm tra này?")) {
      try {
        // Mock delete - replace with actual API call
        setTests(tests.filter((test) => test.id !== testId));
      } catch (error) {
        console.error("Error deleting test:", error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "practice":
        return "bg-blue-100 text-blue-800";
      case "skill":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <Loading message="Đang tải dữ liệu giáo viên..." fullScreen />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Quản lý bài kiểm tra
        </h1>
        <p className="text-lg text-gray-600">
          Danh sách các bài kiểm tra đã tạo và đang quản lý
        </p>
      </div>

      {/* Create New Test Button */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex gap-4">
          <span className="text-sm text-gray-600">
            Tổng số bài kiểm tra: {tests.length}
          </span>
          <span className="text-sm text-gray-600">
            Đã xuất bản: {tests.filter((t) => t.status === "published").length}
          </span>
          <span className="text-sm text-gray-600">
            Nháp: {tests.filter((t) => t.status === "draft").length}
          </span>
        </div>
        <button
          className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
          onClick={() => router.push("/teacher/tests/create")}
        >
          <Plus className="w-5 h-5" />
          Tạo bài kiểm tra mới
        </button>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4">
                    <LoadingInline message="Đang tải danh sách bài kiểm tra..." />
                  </td>
                </tr>
              ) : tests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Chưa có bài kiểm tra nào. Hãy tạo bài kiểm tra đầu tiên!
                  </td>
                </tr>
              ) : (
                tests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {test.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {test.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(test.type)}`}
                      >
                        {test.type === "practice" ? "Luyện tập" : "Kỹ năng"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {test.time_limit || 0} phút
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(test.status)}`}
                      >
                        {test.status === "published" ? "Đã xuất bản" : "Nháp"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(test.created_at).toLocaleDateString("vi-VN")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => router.push(`/teacher/tests/${test.id}`)}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() =>
                          router.push(`/teacher/tests/${test.id}/edit`)
                        }
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteTest(test.id)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng số câu hỏi</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Tag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Bài kiểm tra đang hoạt động
              </p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Học sinh tham gia</p>
              <p className="text-2xl font-bold text-gray-900">245</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
