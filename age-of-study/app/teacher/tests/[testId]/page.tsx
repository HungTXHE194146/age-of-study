"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { TestService } from "@/lib/testService";
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
  FileDown,
  Check,
  X,
  Target,
} from "lucide-react";
import Loading from "@/components/ui/loading";
import { PDFExporter } from "@/lib/pdfExporter";
import {
  NotebookCard,
  NotebookCardContent,
  NotebookButton,
  NotebookBadge,
} from "@/components/ui/notebook-card";
import { Question, QuestionDifficulty } from "@/types/teacher";

// Import Renderers for new question types
import WordOrderingRenderer from "@/components/student/QuestionRenderers/WordOrderingRenderer";
import MatchingRenderer from "@/components/student/QuestionRenderers/MatchingRenderer";
import FillInBlanksRenderer from "@/components/student/QuestionRenderers/FillInBlanksRenderer";
import CategorizationRenderer from "@/components/student/QuestionRenderers/CategorizationRenderer";
import FindErrorRenderer from "@/components/student/QuestionRenderers/FindErrorRenderer";

export default function TeacherTestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");
  const testId = params.testId as string;

  const [test, setTest] = useState<TestWithQuestions | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showAnswers, setShowAnswers] = useState(true);

  useEffect(() => {
    if (testId) {
      fetchTest();
    }
  }, [testId]);

  const fetchTest = async () => {
    setLoading(true);
    try {
      const testService = new TestService();
      const testData = await testService.getTestWithQuestions(testId);
      if (!testData) {
        router.push("/teacher/tests");
        return;
      }
      setTest(testData);

      // Map questions to frontend Question type
      const mapped: Question[] = testData.questions.map((q, idx) => ({
        id: q.id,
        number: idx + 1,
        createdAt: new Date(q.created_at).getTime(),
        type: (q.content.type || q.q_type?.toUpperCase() || "MULTIPLE_CHOICE") as any,
        questionText: q.content.questionText || (q.content as any).question || "",
        options: (q.content.options || []).map((opt: any, optIdx: number) => {
          const isString = typeof opt === "string";
          return {
            id: optIdx.toString(),
            label: isString ? String.fromCharCode(65 + optIdx) : opt.label || String.fromCharCode(65 + optIdx),
            text: isString ? opt : opt.text || "",
            isCorrect: optIdx === q.correct_option_index || (opt && typeof opt === 'object' && opt.isCorrect === true),
          };
        }),
        difficulty: (q.difficulty ? q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1).toLowerCase() : "Medium") as QuestionDifficulty,
        explanation: q.explanation || q.content.explanation || "",
        model_answer: q.model_answer || "",
        metadata: q.content.metadata,
        points: q.points || 10,
      }));
      setQuestions(mapped);

    } catch (error) {
      console.error("Error fetching test:", error);
      router.push("/teacher/tests");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài kiểm tra này?")) return;
    setDeleting(true);
    try {
      const testService = new TestService();
      await testService.deleteTest(testId);
      router.push("/teacher/tests");
    } catch (error) {
      console.error("Error deleting test:", error);
      alert("Xóa bài kiểm tra thất bại.");
    } finally {
      setDeleting(false);
    }
  };

  const handleEditTest = () => {
    router.push(`/teacher/tests/${testId}/edit${classId ? `?classId=${classId}` : ""}`);
  };

  const handlePublishTest = async () => {
    if (!test) return;
    try {
      const testService = new TestService();
      await testService.updateTest(testId, { is_published: !test.is_published });
      fetchTest();
    } catch (error) {
      console.error("Error updating test:", error);
      alert("Cập nhật bài kiểm tra thất bại.");
    }
  };

  const handleExportPDF = async () => {
    if (!test) return;
    try {
      const pdfBytes = await PDFExporter.exportTestToPDF(test);
      PDFExporter.downloadPDF(pdfBytes, `Bai_Tap_${test.title.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Export PDF error:", error);
      alert("Có lỗi khi xuất file PDF.");
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE": return "Trắc nghiệm";
      case "TRUE_FALSE": return "Đúng/Sai";
      case "ESSAY": return "Tự luận";
      case "WORD_ORDERING": return "Sắp xếp từ";
      case "MATCHING": return "Nối cặp";
      case "FILL_IN_BLANKS": return "Điền vào chỗ trống";
      case "CATEGORIZATION": return "Phân loại";
      case "FIND_ERROR": return "Tìm lỗi sai";
      default: return "Cơ bản";
    }
  };

  if (loading) return <Loading message="Đang tải bài kiểm tra..." />;
  if (!test) return <div className="p-12 text-center font-bold">Không tìm thấy bài kiểm tra.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8 p-8 bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2.5rem] border-b-2 border-dashed border-gray-400 relative">
        <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-blue-200 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"></div>
        <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-blue-200 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"></div>

        <NotebookButton
          onClick={() => (classId ? router.push(`/teacher/classes/${classId}`) : router.back())}
          className="mb-6 bg-white border-2 border-black text-gray-800 hover:bg-gray-100 px-4 py-1 text-sm font-bold flex items-center gap-2"
        >
          Quay lại
        </NotebookButton>

        <h1 className="text-5xl font-black text-gray-900 mb-4 font-handwritten tracking-tight pl-6">
          {test.title}
        </h1>
        <p className="text-xl text-gray-700 font-bold italic pl-6 leading-10">
          {test.description || "Không có mô tả cho bài tập này."}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Questions List */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-gray-900 font-handwritten flex items-center gap-3">
              <Eye className="w-8 h-8 text-blue-600" />
              Nội dung câu hỏi
            </h2>
            <NotebookButton
              onClick={() => setShowAnswers(!showAnswers)}
              className="bg-white text-sm py-2 px-4 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              {showAnswers ? "Ẩn đáp án" : "Hiện đáp án"}
            </NotebookButton>
          </div>

          <div className="space-y-12">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="bg-white border-2 border-black rounded-2xl p-8 shadow-[6px_6px_0_0_rgba(0,0,0,1)] relative group"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-yellow-300 border-2 border-black rounded-full flex items-center justify-center font-black text-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] rotate-[-10deg] group-hover:rotate-0 transition-transform">
                  {index + 1}
                </div>

                <div className="flex items-center gap-2 mb-6 ml-8">
                  <NotebookBadge variant="default" className="bg-blue-100 text-blue-900 border-blue-900">
                    {getQuestionTypeLabel(q.type)}
                  </NotebookBadge>
                  <NotebookBadge variant="danger" className="text-xs">
                    {q.points || 10} pts
                  </NotebookBadge>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border border-black ${q.difficulty === "Easy" ? "bg-green-100 text-green-700" :
                    q.difficulty === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                    }`}>
                    {q.difficulty === "Easy" ? "Dễ" : q.difficulty === "Medium" ? "Trung bình" : "Khó"}
                  </span>
                </div>

                <div className="text-2xl font-bold text-gray-900 mb-8 leading-relaxed font-handwritten">
                  {/* Avoid duplication if questionText is the same as the sentence in metadata */}
                  {(() => {
                    const sentence = (q.metadata as any)?.sentence;
                    const orderedWords = (q.metadata as any)?.orderedWords?.join(" ");
                    if (q.questionText === sentence || q.questionText === orderedWords) {
                      return q.type === "FIND_ERROR" ? "Hãy nhấn vào lỗi sai trong câu sau:" :
                        q.type === "WORD_ORDERING" ? "Hãy sắp xếp các từ sau thành câu:" :
                          q.questionText;
                    }
                    return q.questionText;
                  })()}
                </div>

                {/* Question Body Renderers */}
                <div className="space-y-4">
                  {q.type === "MULTIPLE_CHOICE" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`p-4 rounded-xl border-2 flex items-center gap-4 ${showAnswers && opt.isCorrect ? "bg-green-50 border-green-600 shadow-[2px_2px_0_0_rgba(22,163,74,1)]" : "bg-gray-50 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"}`}>
                          <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black border-2 ${showAnswers && opt.isCorrect ? "bg-green-500 text-white border-green-700" : "bg-white border-black"}`}>{opt.label}</span>
                          <span className="font-bold flex-1">{opt.text}</span>
                          {showAnswers && opt.isCorrect && <Check className="w-5 h-5 text-green-600" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "TRUE_FALSE" && (
                    <div className="flex gap-4">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-4 ${showAnswers && opt.isCorrect ? "bg-green-50 border-green-600 shadow-[2px_2px_0_0_rgba(22,163,74,1)]" : "bg-gray-50 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"}`}>
                          <span className="font-black text-xl">{opt.text}</span>
                          {showAnswers && opt.isCorrect && <Check className="w-6 h-6 text-green-600" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "ESSAY" && (
                    <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">
                      <p className="text-sm font-bold text-slate-500 uppercase mb-2">Lời giải đề xuất:</p>
                      <p className="font-handwritten text-lg italic">{q.options[0]?.text || "Chưa có gợi ý trả lời"}</p>
                    </div>
                  )}

                  {/* New Types Rendering */}
                  {q.type === "WORD_ORDERING" && (
                    <div className="bg-blue-50/50 p-6 rounded-xl border-2 border-blue-200">
                      <WordOrderingRenderer
                        orderedWords={q.metadata?.orderedWords || []}
                        questionText={q.questionText}
                        onComplete={() => { }}
                      />
                      {showAnswers && <p className="mt-4 font-bold text-green-700">Đáp án: {q.metadata?.orderedWords?.join(" ")}</p>}
                    </div>
                  )}

                  {q.type === "MATCHING" && (
                    <div className="bg-purple-50/50 p-6 rounded-xl border-2 border-purple-200">
                      <MatchingRenderer
                        matchingPairs={q.metadata?.matchingPairs || []}
                        onComplete={() => { }}
                      />
                      {showAnswers && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {q.metadata?.matchingPairs?.map((pair: any, i: number) => (
                            <div key={i} className="text-xs bg-white p-2 border border-black rounded">{pair.left} → {pair.right}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {q.type === "FILL_IN_BLANKS" && (
                    <div className="bg-green-50/50 p-6 rounded-xl border-2 border-green-200">
                      <FillInBlanksRenderer
                        questionText={q.questionText}
                        blanks={q.metadata?.blanks || []}
                        onComplete={() => { }}
                      />
                      {showAnswers && <p className="mt-4 font-bold text-green-700">Đáp án: {q.metadata?.blanks?.map((b: any) => b.answer).join(", ")}</p>}
                    </div>
                  )}

                  {q.type === "CATEGORIZATION" && (
                    <div className="bg-orange-50/50 p-6 rounded-xl border-2 border-orange-200">
                      <CategorizationRenderer
                        categoriesData={q.metadata?.categories || []}
                        onComplete={() => { }}
                      />
                    </div>
                  )}

                  {q.type === "FIND_ERROR" && (
                    <div className="bg-red-50/50 p-6 rounded-xl border-2 border-red-200">
                      <FindErrorRenderer
                        questionText={(q.metadata as any)?.sentence || q.questionText}
                        errorPosition={q.metadata?.errorPosition || { startIndex: 0, endIndex: 0, correctText: "" }}
                        onComplete={() => { }}
                      />
                      {showAnswers && (
                        <p className="mt-4 font-bold text-green-700">
                          Sửa lỗi:{" "}
                          <span className="text-red-600 line-through">
                            {(() => {
                              const text = (q.metadata as any)?.sentence || q.questionText;
                              const { startIndex, endIndex } = q.metadata?.errorPosition || { startIndex: 0, endIndex: 0 };
                              let s = startIndex;
                              while (s > 0 && text[s - 1] !== ' ' && text[s - 1] !== '\n') s--;
                              let e = endIndex;
                              while (e < text.length - 1 && text[e + 1] !== ' ' && text[e + 1] !== '\n') e++;
                              return text.substring(s, e + 1);
                            })()}
                          </span>{" "}
                          → {q.metadata?.errorPosition?.correctText}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {showAnswers && q.explanation && (
                  <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200">
                    <p className="text-sm font-black text-purple-700 uppercase mb-2">💡 Giải thích từ giáo viên:</p>
                    <p className="text-gray-700 italic font-medium">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <NotebookCard className="bg-yellow-50">
            <NotebookCardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-gray-400">
                <FileText className="w-8 h-8 text-yellow-800" />
                <h2 className="text-2xl font-black text-gray-900 font-handwritten">Thông tin chung</h2>
              </div>
              <div className="space-y-4 font-bold">
                <div className="flex justify-between items-center p-3 bg-white border-2 border-black rounded-xl">
                  <span className="text-gray-600">Trạng thái</span>
                  <NotebookBadge variant={test.is_published ? "success" : "warning"}>
                    {test.is_published ? "Đã xuất bản" : "Bản nháp"}
                  </NotebookBadge>
                </div>
                <div className="flex justify-between items-center p-3 bg-white border-2 border-black rounded-xl">
                  <span className="text-gray-600">Số câu hỏi</span>
                  <span className="text-xl font-black text-blue-700 font-handwritten">{test.questions.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white border-2 border-black rounded-xl">
                  <span className="text-gray-600">Thời gian</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {test.settings.time_limit} phút</span>
                </div>
              </div>
            </NotebookCardContent>
          </NotebookCard>

          <div className="space-y-4">
            <NotebookButton onClick={handleEditTest} className="w-full py-4 bg-blue-100 text-blue-900 border-blue-900 flex justify-center text-lg">
              <FileEdit className="mr-2" /> Chỉnh sửa bài tập
            </NotebookButton>
            <NotebookButton onClick={handleExportPDF} className="w-full py-4 bg-orange-100 text-orange-900 border-orange-900 flex justify-center text-lg">
              <FileDown className="mr-2" /> Xuất bản PDF
            </NotebookButton>
            <NotebookButton
              onClick={handlePublishTest}
              className={`w-full py-4 flex justify-center text-lg ${test.is_published ? "bg-white text-green-700 border-green-700" : "bg-green-100 text-green-900 border-green-900"}`}
            >
              <FileCheck className="mr-2" /> {test.is_published ? "Hủy xuất bản" : "Xuất bản bài tập"}
            </NotebookButton>
            <NotebookButton onClick={handleDeleteTest} disabled={deleting} className="w-full py-4 bg-red-50 text-red-700 border-red-700 flex justify-center text-lg">
              <Trash2 className="mr-2" /> Xóa bài tập
            </NotebookButton>
          </div>
        </div>
      </div>
    </div>
  );
}
