"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { TestService } from "@/lib/testService";
import { Button } from "@/components/ui/button";
import { RouteProtectedWrapper } from "@/lib/routeMiddleware";
import { TestWithQuestions } from "@/types/test";
import {
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Users,
  FileText,
  FileEdit,
  FileCheck,
} from "lucide-react";
import Loading from "@/components/ui/loading";

export default function TeacherTestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const testId = params.testId as string;

  const [test, setTest] = useState<TestWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (testId) {
      fetchTest();
    }
  }, [testId]);

  const fetchTest = async () => {
    setLoading(true);
    try {
      const testService = new TestService();
      const testWithQuestions = await testService.getTestWithQuestions(testId);
      if (!testWithQuestions) {
        router.push("/teacher/tests");
        return;
      }
      setTest(testWithQuestions);
    } catch (error) {
      console.error("Error fetching test:", error);
      router.push("/teacher/tests");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async () => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa bài kiểm tra này? Hành động này không thể hoàn tác.",
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const testService = new TestService();
      await testService.deleteTest(testId);

      // Redirect back to tests list after successful deletion
      router.push("/teacher/tests");
    } catch (error) {
      console.error("Error deleting test:", error);
      alert("Xóa bài kiểm tra thất bại. Vui lòng thử lại.");
    } finally {
      setDeleting(false);
    }
  };

  const handleEditTest = () => {
    router.push(`/teacher/tests/${testId}/edit`);
  };

  const handlePublishTest = async () => {
    if (!test) return;

    try {
      const testService = new TestService();
      await testService.updateTest(testId, {
        is_published: !test.is_published,
      });

      // Refresh the test data
      fetchTest();
    } catch (error) {
      console.error("Error updating test:", error);
      alert("Cập nhật bài kiểm tra thất bại. Vui lòng thử lại.");
    }
  };

  const getStatusColor = (isPublished: boolean) => {
    return isPublished
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "practice":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "skill":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Đang tải bài kiểm tra..." />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Bài kiểm tra không tồn tại
          </h1>
          <p className="text-gray-600 mt-2">
            Bài kiểm tra bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <Button
            onClick={() => router.push("/teacher/tests")}
            className="mt-4"
          >
            Quay lại danh sách bài kiểm tra
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Tên bài kiểm tra: {test.title}
        </h1>
        <p className="text-lg text-gray-600">Mô tả: {test.description}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Questions List */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Danh sách câu hỏi
                </h2>
                <p className="text-gray-600">
                  {test.questions.length} câu hỏi trong bài kiểm tra
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-blue-600">
                {test.questions.length}
              </span>
              <p className="text-sm text-gray-600">câu hỏi</p>
            </div>
          </div>

          <div className="space-y-6">
            {test.questions.map((question, index) => (
              <div
                key={question.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Câu {index + 1}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        index % 2 === 0
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {index % 2 === 0 ? "Trắc nghiệm" : "Tự luận"}
                    </span>
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                      {question.points || 10} pts
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    Đáp án đúng:{" "}
                    {String.fromCharCode(65 + question.correct_option_index)}
                  </span>
                </div>

                <div className="text-gray-900 mb-4 text-lg leading-relaxed">
                  {question.content.question}
                </div>

                <div className="space-y-3">
                  {question.content.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`p-4 rounded-lg border-2 ${
                        optionIndex === question.correct_option_index
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center font-semibold text-gray-700">
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span className="text-gray-900 flex-1">{option}</span>
                        {optionIndex === question.correct_option_index && (
                          <span className="ml-2 text-green-600 font-semibold">
                            ✓ Đáp án đúng
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Test Details Card */}
          <div className="bg-white rounded-2xl p-8 shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Thông tin bài kiểm tra
                </h2>
                <p className="text-gray-600">Chi tiết và trạng thái</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Trạng thái
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(test.is_published)}`}
                >
                  {test.is_published ? "Đã xuất bản" : "Nháp"}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Loại bài kiểm tra
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(test.type)}`}
                >
                  {test.type === "practice" ? "Luyện tập" : "Kiểm tra kỹ năng"}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Thời gian làm bài
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {test.settings.time_limit} phút
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Số câu hỏi
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {test.questions.length}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Ngày tạo
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {new Date(test.created_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white rounded-2xl p-8 shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Edit className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Hành động</h2>
                <p className="text-gray-600">Quản lý bài kiểm tra</p>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleEditTest}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 text-lg"
              >
                <FileEdit className="w-6 h-6" />
                Chỉnh sửa bài kiểm tra
              </Button>

              <Button
                onClick={handlePublishTest}
                variant={test.is_published ? "outline" : "primary"}
                className={`w-full py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 text-lg ${
                  test.is_published
                    ? "border-2 border-green-500 text-green-600 hover:bg-green-50"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                <FileCheck className="w-6 h-6" />
                {test.is_published ? "Hủy xuất bản" : "Xuất bản"}
              </Button>

              <Button
                onClick={handleDeleteTest}
                variant="outline"
                disabled={deleting}
                className="w-full border-2 border-red-500 text-red-600 hover:bg-red-50 py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 text-lg"
              >
                <Trash2 className="w-6 h-6" />
                {deleting ? "Đang xóa..." : "Xóa bài kiểm tra"}
              </Button>

              <Button
                onClick={() => router.push("/teacher/tests")}
                variant="outline"
                className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 text-lg"
              >
                <Eye className="w-6 h-6" />
                Quay lại danh sách
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
