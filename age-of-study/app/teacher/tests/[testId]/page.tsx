"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
  FileText,
  FileCheck,
  FileEdit,
} from "lucide-react";
import Loading from "@/components/ui/loading";
import { NotebookCard, NotebookCardContent, NotebookButton, NotebookBadge } from "@/components/ui/notebook-card";

export default function TeacherTestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");
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
    const editUrl = `/teacher/tests/${testId}/edit${classId ? `?classId=${classId}` : ""}`;
    router.push(editUrl);
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
        <div className="text-center bg-[#fffdf8] p-12 border-2 border-black rounded-xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg mx-auto transform -rotate-1 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-red-200/50 -translate-y-2 border border-red-300 rotate-2"></div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight font-handwritten">
            Bài kiểm tra không tồn tại
          </h1>
          <p className="text-gray-600 mt-2 font-bold">
            Bài kiểm tra bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <NotebookButton
            onClick={() => router.push("/teacher/tests")}
            className="mt-6 bg-blue-100 text-blue-900 border-blue-900 px-6 py-2"
          >
            Quay lại danh sách
          </NotebookButton>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 p-8 bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2.5rem] border-b-2 border-dashed border-gray-400 relative">
        <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-blue-200 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"></div>
        <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-blue-200 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"></div>

        <NotebookButton
          onClick={() => {
            if (classId) {
              router.push(`/teacher/classes/${classId}`);
            } else {
              router.back();
            }
          }}
          className="mb-6 bg-white border-2 border-black text-gray-800 hover:bg-gray-100 px-4 py-1 text-sm font-bold flex items-center gap-2"
        >
          Quay lại
        </NotebookButton>

        <h1 className="text-5xl font-black text-gray-900 mb-4 font-handwritten tracking-tight drop-shadow-sm leading-10 pl-6">
          {test.title}
        </h1>
        <p className="text-xl text-gray-700 font-bold italic pl-6 leading-10">Mô tả: {test.description}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Questions List */}
        <div className="lg:col-span-2">
          <NotebookCard className="bg-[#fffdf8]">
            <NotebookCardContent className="pt-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dashed border-gray-300">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] transform -rotate-6">
                    <Eye className="w-6 h-6 text-blue-800" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 font-handwritten tracking-tight">
                      Danh sách câu hỏi
                    </h2>
                    <p className="text-gray-600 font-bold">
                      {test.questions.length} câu hỏi trong bài kiểm tra
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-blue-700 font-handwritten drop-shadow-sm">
                    {test.questions.length}
                  </span>
                  <p className="text-sm font-bold text-gray-600 uppercase mt-1">câu hỏi</p>
                </div>
              </div>

              <div className="space-y-6">
                {test.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] group"
                  >
                    <div className="absolute top-0 right-4 w-4 h-8 bg-red-400/50 transform -translate-y-1/2 -rotate-[15deg] border border-red-500 rounded-sm"></div>

                    <div className="flex items-start justify-between mb-4 border-b-2 border-dashed border-gray-200 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <NotebookBadge variant="default" className="text-sm">
                          Câu {index + 1}
                        </NotebookBadge>
                        <NotebookBadge
                          variant={index % 2 === 0 ? "success" : "warning"}
                          className="text-sm"
                        >
                          {index % 2 === 0 ? "Trắc nghiệm" : "Tự luận"}
                        </NotebookBadge>
                        <NotebookBadge variant="danger" className="text-sm">
                          {question.points || 10} pts
                        </NotebookBadge>
                      </div>
                      <span className="text-sm font-black text-blue-800 bg-blue-100 px-3 py-1 rounded border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase">
                        Đáp án:{" "}
                        {String.fromCharCode(65 + question.correct_option_index)}
                      </span>
                    </div>

                    <div className="text-gray-900 mb-6 text-xl font-bold font-handwritten tracking-tight">
                      {question.content.questionText}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {question.content.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-3 rounded-lg border-2 flex items-center gap-3 transition-colors ${optionIndex === question.correct_option_index
                              ? "border-green-600 bg-green-50 shadow-[2px_2px_0_0_rgba(22,163,74,1)]"
                              : "border-black bg-gray-50 hover:bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                            }`}
                        >
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 ${optionIndex === question.correct_option_index
                              ? "bg-green-500 text-white border-green-700"
                              : "bg-white text-gray-900 border-black"
                            }`}>
                            {option.label}
                          </span>
                          <span className={`flex-1 font-bold ${optionIndex === question.correct_option_index ? "text-green-900" : "text-gray-800"}`}>
                            {option.text}
                          </span>
                          {optionIndex === question.correct_option_index && (
                            <span className="ml-2 text-green-700 font-black px-2 py-1 bg-white border-2 border-green-600 rounded-md shadow-[2px_2px_0_0_rgba(22,163,74,1)] text-xs uppercase transform rotate-2">
                              ✓ Đúng
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </NotebookCardContent>
          </NotebookCard>
        </div>

        {/* Test Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Test Details Card */}
          <NotebookCard className="bg-yellow-50">
            <NotebookCardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-gray-400">
                <div className="w-12 h-12 bg-yellow-200 border-2 border-black rounded-lg flex items-center justify-center rotate-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <FileText className="w-6 h-6 text-yellow-800" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 font-handwritten tracking-tight">
                    Thông tin chung
                  </h2>
                  <p className="text-gray-700 font-bold text-sm">Chi tiết và trạng thái</p>
                </div>
              </div>

              <div className="space-y-3 font-bold">
                <div className="flex items-center justify-between p-3 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
                  <span className="text-sm text-gray-700 h-[28px] flex items-center">
                    Trạng thái
                  </span>
                  <NotebookBadge variant={test.is_published ? "success" : "warning"}>
                    {test.is_published ? "Đã xuất bản" : "Nháp"}
                  </NotebookBadge>
                </div>

                <div className="flex items-center justify-between p-3 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
                  <span className="text-sm text-gray-700 h-[28px] flex items-center">
                    Loại bài kiểm tra
                  </span>
                  <NotebookBadge variant={test.type === "practice" ? "default" : "warning"}>
                    {test.type === "practice" ? "Luyện tập" : "Kiểm tra kỹ năng"}
                  </NotebookBadge>
                </div>

                <div className="flex items-center justify-between p-3 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
                  <span className="text-sm text-gray-700">
                    Thời gian làm bài
                  </span>
                  <span className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                    {test.settings.time_limit} phút
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
                  <span className="text-sm text-gray-700">
                    Số câu hỏi
                  </span>
                  <span className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                    {test.questions.length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
                  <span className="text-sm text-gray-700">
                    Ngày tạo
                  </span>
                  <span className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                    {new Date(test.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            </NotebookCardContent>
          </NotebookCard>

          {/* Actions Card */}
          <NotebookCard className="bg-purple-50">
            <NotebookCardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-gray-400">
                <div className="w-12 h-12 bg-purple-200 border-2 border-black rounded-lg flex items-center justify-center -rotate-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <Edit className="w-6 h-6 text-purple-800" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 font-handwritten tracking-tight">Hành động</h2>
                  <p className="text-gray-700 font-bold text-sm">Quản lý bài kiểm tra</p>
                </div>
              </div>

              <div className="space-y-4">
                <NotebookButton
                  onClick={handleEditTest}
                  className="w-full bg-blue-100 text-blue-900 border-blue-900 py-3 text-base flex justify-center"
                >
                  <FileEdit className="w-5 h-5 mr-3" />
                  Sửa bài kiểm tra
                </NotebookButton>

                <NotebookButton
                  onClick={handlePublishTest}
                  className={`w-full py-3 text-base flex justify-center ${test.is_published
                      ? "bg-white text-green-700 border-green-700 shadow-none border-dashed"
                      : "bg-green-100 text-green-900 border-green-900"
                    }`}
                >
                  <FileCheck className="w-5 h-5 mr-3" />
                  {test.is_published ? "Đang xuất bản (Hủy)" : "Xuất bản"}
                </NotebookButton>

                <NotebookButton
                  onClick={handleDeleteTest}
                  disabled={deleting}
                  className="w-full bg-red-50 text-red-700 border-red-700 py-3 text-base flex justify-center"
                >
                  <Trash2 className="w-5 h-5 mr-3" />
                  {deleting ? "Đang xóa..." : "Xóa bài kiểm tra"}
                </NotebookButton>

                <NotebookButton
                  onClick={() => {
                    if (classId) {
                      router.push(`/teacher/classes/${classId}`);
                    } else {
                      router.push("/teacher/tests");
                    }
                  }}
                  className="w-full bg-white text-gray-700 border-gray-400 py-3 text-base flex justify-center hover:bg-gray-100 border-dashed"
                >
                  <Eye className="w-5 h-5 mr-3" />
                  Đóng
                </NotebookButton>
              </div>
            </NotebookCardContent>
          </NotebookCard>
        </div>
      </div>
    </div>
  );
}
