"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  FileText,
  Link as LinkIcon,
  Settings,
  Save,
  ArrowLeft,
  Book,
  Eye,
} from "lucide-react";
import { NotebookCard, NotebookCardContent, NotebookButton } from "@/components/ui/notebook-card";
import { QuizGeneratorForm } from "@/components/teacher/QuizGeneratorForm";
import { QuizReviewList } from "@/components/teacher/QuizReviewList";
import { QuestionBankTab } from "@/components/teacher/QuestionBankTab";
import { ManualQuestionTab } from "@/components/teacher/ManualQuestionTab";
import { TestDetailsForm } from "@/components/teacher/TestDetailsForm";
import { QuestionPointsGrid } from "@/components/teacher/QuestionPointsGrid";
import { PaginatedQuestionPreview } from "@/components/teacher/PaginatedQuestionPreview";
import { Button } from "@/components/ui/button";
import { Question, QuestionOption, QuestionDifficulty } from "@/types/teacher";
import { subjectService } from "@/lib/subjectService";
import { Subject } from "@/types/teacher";
import { TestService } from "@/lib/testService";
import { CreateTestRequest } from "@/types/test";
import { useAuthStore } from "@/store/useAuthStore";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { AIQuestionService } from "@/lib/aiQuestionService";
import { getTeacherClasses } from "@/lib/classService";

// Helper functions extracted to improve code health
const isValidSubject = (subject: string | undefined | null): boolean => {
  return Boolean(subject && subject !== "" && subject !== "0");
};

const validateTestDetails = (testDetails: any, questions: any[]): string | null => {
  if (!testDetails.title.trim()) {
    return "Vui lòng nhập tiêu đề bài kiểm tra";
  }
  if (!isValidSubject(testDetails.subject)) {
    return "Vui lòng chọn môn học liên quan cho bài kiểm tra";
  }
  if (questions.length === 0) {
    return "Vui lòng thêm ít nhất một câu hỏi";
  }
  return null;
};

const resolveSubjectId = (subject: string | undefined | null): number | null => {
  return isValidSubject(subject) ? parseInt(subject as string) : null;
};

const resolveNodeId = (subject: string | undefined | null, node: string | undefined | null): number | null => {
  if (!isValidSubject(subject)) return null;
  return node ? parseInt(node) : null;
};

const fetchSubjectsData = async () => {
  try {
    return await subjectService.getSubjects();
  } catch (error) {
    console.error("Failed to fetch subjects:", error);
    return [];
  }
};

const fetchTeacherClassesData = async (userId: string) => {
  try {
    const { data, error } = await getTeacherClasses(userId);
    if (error) throw error;
    const allTeacherClasses = [
      ...(data?.homeroom_classes || []),
      ...(data?.subject_classes || []),
    ];
    return Array.from(new Map(allTeacherClasses.map((c: any) => [c.id, c])).values());
  } catch (error) {
    console.error("Failed to fetch teacher classes:", error);
    return [];
  }
};

const prepareQuestionsToSave = (questions: Question[], testDetails: any, userId: string | undefined) => {
  return questions.map((q) => {
    let qType = "multiple_choice";
    if (q.type === "TRUE_FALSE") qType = "true_false";
    else if (q.type === "ESSAY") qType = "essay";

    let correctIndex = -1;
    if (q.type === "MULTIPLE_CHOICE") {
      correctIndex = q.options.findIndex((opt) => opt.isCorrect);
    } else if (q.type === "TRUE_FALSE") {
      correctIndex = 0;
    }

    return {
      id: q.id,
      node_id: resolveNodeId(testDetails.subject, testDetails.node),
      content: {
        questionText: q.questionText,
        options: q.options.map((opt) => ({
          label: opt.label,
          text: opt.text,
        })),
      },
      correct_option_index: correctIndex,
      difficulty: q.difficulty.toLowerCase() as "easy" | "medium" | "hard",
      status: "available",
      created_by: userId || null,
      created_at: new Date().toISOString(),
      q_type: qType,
      model_answer: q.model_answer || "",
      subject_id: resolveSubjectId(testDetails.subject),
      explanation: q.explanation || null,
    };
  });
};

function CreateTestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get("classId");
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"manual" | "ai" | "bank">(
    "manual",
  );
  const [testDetails, setTestDetails] = useState({
    title: "",
    description: "",
    subject: "",
    node: "",
    timeLimit: 30,
    classId: classIdParam || "",
  });
  const [nodes, setNodes] = useState<{ id: number; title: string }[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  // State for question management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [points, setPoints] = useState<{ [questionId: string]: number }>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  useEffect(() => {
    if (classIdParam) {
      setTestDetails((prev) => ({ ...prev, classId: classIdParam }));
    }
  }, [classIdParam]);

  // Fetch subjects and teacher classes from Supabase
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingSubjects(true);
      const subjectList = await fetchSubjectsData();
      setSubjects(subjectList);
      setIsLoadingSubjects(false);

      if (user?.id) {
        setIsLoadingClasses(true);
        const classes = await fetchTeacherClassesData(user.id);
        setTeacherClasses(classes);
        setIsLoadingClasses(false);
      }
    }

    loadInitialData();
  }, [user?.id]);

  const handleAddQuestion = (question: Question) => {
    setQuestions((prev) => [...prev, question]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSave = async (isDraft: boolean) => {
    const errorMsg = validateTestDetails(testDetails, questions);
    if (errorMsg) {
      alert(errorMsg);
      return;
    }

    setIsSaving(true);
    try {
      const testService = new TestService();

      const createTestRequest: CreateTestRequest = {
        title: testDetails.title,
        description: testDetails.description,
        type: "practice",
        subject_id: resolveSubjectId(testDetails.subject),
        node_id: resolveNodeId(testDetails.subject, testDetails.node),
        settings: {
          time_limit: testDetails.timeLimit,
          allow_retry: true,
        },
        is_published: !isDraft,
        created_by: user?.id || "",
        class_id: testDetails.classId ? parseInt(testDetails.classId) : null,
      };

      const createdTest = await testService.createTest(createTestRequest);
      const supabase = await getSupabaseBrowserClient();

      const questionsToSave = prepareQuestionsToSave(questions, testDetails, user?.id);

      try {
        const { error: questionsError } = await supabase
          .from("questions")
          .upsert(questionsToSave, { onConflict: "id" });

        if (questionsError) {
          console.error(`Error upserting questions for ${isDraft ? "draft" : "test"}:`, questionsError);
          throw questionsError;
        }
      } catch (error) {
        console.error(`Error saving questions for ${isDraft ? "draft" : "test"}:`, error);
        throw error;
      }

      const testQuestionsToInsert = questions.map(
        (q: Question, index: number) => ({
          test_id: createdTest.id,
          question_id: q.id,
          points: q.points || 10,
          display_order: index,
        })
      );

      const { error: testQuestionsError } = await supabase
        .from("test_questions")
        .insert(testQuestionsToInsert);

      if (testQuestionsError) throw testQuestionsError;

      alert(`Bài kiểm tra đã được lưu ${isDraft ? "nháp " : ""}thành công!`);
      if (classIdParam) {
        router.push(`/teacher/classes/${classIdParam}`);
      } else {
        router.push("/teacher/tests");
      }
    } catch (error) {
      console.error(`Error saving ${isDraft ? "draft" : "test"}:`, error);
      alert(`Có lỗi xảy ra khi lưu ${isDraft ? "nháp " : ""}bài kiểm tra`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTest = () => handleSave(false);
  const handleSaveDraft = () => handleSave(true);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 p-8 bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2.5rem] border-b-2 border-dashed border-gray-400 relative">
        <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-blue-200 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"></div>
        <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-blue-200 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"></div>

        <NotebookButton onClick={() => router.back()} className="mb-6 bg-white border-2 border-black text-gray-800 hover:bg-gray-100 px-4 py-1 text-sm font-bold flex items-center gap-2">
          Quay lại
        </NotebookButton>
        <h1 className="text-5xl font-black text-gray-900 mb-4 font-handwritten tracking-tight drop-shadow-sm leading-10 pl-6">
          Tạo Bài Kiểm Tra Mới
        </h1>
        <p className="text-xl text-gray-700 font-bold italic pl-6 leading-10">
          Thiết lập chi tiết bài kiểm tra và thêm câu hỏi
        </p>
      </div>

      <div className="grid gap-8">
        {/* Row 1: Test Details (Left) and Question Management (Right) */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Test Details Section */}
          <div className="lg:col-span-1">
            <NotebookCard className="bg-yellow-50 h-full">
              <NotebookCardContent className="pt-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-gray-400">
                  <div className="w-12 h-12 bg-yellow-200 border-2 border-black rounded-lg flex items-center justify-center -rotate-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    <Settings className="w-6 h-6 text-yellow-800" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 font-handwritten tracking-tight">
                      Chi tiết bài kiểm tra
                    </h2>
                    <p className="text-gray-700 font-bold text-sm">Cấu hình các thông số cơ bản</p>
                  </div>
                </div>

                <TestDetailsForm
                  testDetails={testDetails}
                  setTestDetails={setTestDetails}
                  subjects={subjects}
                  isLoadingSubjects={isLoadingSubjects}
                  teacherClasses={teacherClasses}
                  isLoadingClasses={isLoadingClasses}
                  nodes={nodes}
                  isLoadingNodes={isLoadingNodes}
                  setNodes={setNodes}
                  setIsLoadingNodes={setIsLoadingNodes}
                />
              </NotebookCardContent>
            </NotebookCard>
          </div>

          {/* Question Management Section */}
          <div className="lg:col-span-2">
            <NotebookCard className="bg-[#fffdf8] h-full">
              <NotebookCardContent className="pt-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dashed border-gray-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 border-2 border-black rounded-full flex items-center justify-center rotate-6 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <Plus className="w-6 h-6 text-green-700" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-gray-900 font-handwritten tracking-tight">Câu Hỏi</h2>
                      <p className="text-gray-700 font-bold text-sm">Thêm và quản lý câu hỏi</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-blue-700 font-handwritten drop-shadow-sm">
                      {questions.length}
                    </span>
                    <p className="text-sm font-bold text-gray-600 uppercase">câu hỏi</p>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b-2 border-black mb-6">
                  <nav className="-mb-[2px] flex space-x-2">
                    <button
                      onClick={() => setActiveTab("manual")}
                      className={`flex items-center gap-2 py-3 px-4 border-2 font-bold text-sm rounded-t-lg transition-colors ${activeTab === "manual"
                        ? "border-black border-b-white bg-white text-gray-900 z-10"
                        : "border-transparent bg-gray-100/50 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                    >
                      <FileText className="w-5 h-5" />
                      Nhập thủ công
                    </button>
                    <button
                      onClick={() => setActiveTab("ai")}
                      className={`flex items-center gap-2 py-3 px-4 border-2 font-bold text-sm rounded-t-lg transition-colors ${activeTab === "ai"
                        ? "border-black border-b-white bg-white text-gray-900 z-10"
                        : "border-transparent bg-gray-100/50 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                    >
                      <LinkIcon className="w-5 h-5" />
                      AI Generator
                    </button>
                    <button
                      onClick={() => setActiveTab("bank")}
                      className={`flex items-center gap-2 py-3 px-4 border-2 font-bold text-sm rounded-t-lg transition-colors ${activeTab === "bank"
                        ? "border-black border-b-white bg-white text-gray-900 z-10"
                        : "border-transparent bg-gray-100/50 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                    >
                      <Book className="w-5 h-5" />
                      Ngân hàng câu hỏi
                    </button>
                  </nav>
                </div>

                <div className="space-y-6">
                  {activeTab === "manual" && (
                    <ManualQuestionTab
                      questionsLength={questions.length}
                      onAddQuestion={handleAddQuestion}
                    />
                  )}

                  {activeTab === "ai" && (
                    <div>
                      <QuizGeneratorForm
                        existingQuestionCount={questions.length}
                        onGenerate={async (data) => {
                          setIsGenerating(true);
                          try {
                            const aiQuestionService = new AIQuestionService();

                            const requestPayload: any = {
                              textPrompt: data.topic || "",
                              questionCount: data.questionCount,
                              difficulty: data.difficulty,
                              subject: data.subject || "",
                              file: data.file || null,
                              onlyFromFile: data.onlyFromFile,
                              fromKnowledgeBase: data.fromKnowledgeBase,
                              fromQuestionBank: data.fromQuestionBank,
                              questionTypes: data.questionTypes,
                              action: data.action,
                            };

                            if (data.action === "edit" && questions.length > 0) {
                              requestPayload.existingQuestions = JSON.stringify(
                                questions.map((q) => ({
                                  type: q.type,
                                  questionText: q.questionText,
                                  options: q.options.map((opt) => ({
                                    label: opt.label,
                                    text: opt.text,
                                    isCorrect: opt.isCorrect,
                                  })),
                                  difficulty: q.difficulty,
                                  explanation: q.explanation,
                                }))
                              );
                            }

                            const result = await aiQuestionService.generateQuestions(requestPayload);

                            if (result.questions && result.questions.length > 0) {
                              // Transform AI-generated questions to match the expected format
                              const transformedQuestions = result.questions.map(
                                (
                                  q: {
                                    type: string;
                                    questionText: string;
                                    options: {
                                      label: string;
                                      text: string;
                                      isCorrect: boolean;
                                    }[];
                                    difficulty: string;
                                    explanation?: string;
                                  },
                                  index: number,
                                ) => ({
                                  id: crypto.randomUUID(), // Generate proper UUID
                                  createdAt: Date.now(),
                                  number: (data.action === "replace" || data.action === "edit" ? 0 : questions.length) + index + 1,
                                  type: q.type as
                                    | "MULTIPLE_CHOICE"
                                    | "TRUE_FALSE"
                                    | "ESSAY",
                                  questionText: q.questionText,
                                  options: (q.options || []).map((opt, idx) => ({
                                    id: `${idx}`,
                                    label: opt.label,
                                    text: opt.text,
                                    isCorrect: opt.isCorrect,
                                  })),
                                  difficulty: q.difficulty as QuestionDifficulty,
                                  topic: data.topic || "AI Generated",
                                  explanation: q.explanation || "",
                                }),
                              );

                              if (data.action === "replace" || data.action === "edit") {
                                setQuestions(transformedQuestions);
                              } else {
                                transformedQuestions.forEach((q) =>
                                  handleAddQuestion(q),
                                );
                              }

                              if (result.totalGenerated < result.requested) {
                                alert(
                                  `AI đã tạo được ${result.totalGenerated} câu hỏi (yêu cầu ${result.requested}). Vui lòng kiểm tra chất lượng câu hỏi.`,
                                );
                              }
                            } else {
                              alert(
                                "AI không thể tạo câu hỏi từ tài liệu này. Vui lòng thử với tài liệu khác hoặc nội dung rõ ràng hơn.",
                              );
                            }
                          } catch (error) {
                            console.error(
                              "Error generating questions with AI:",
                              error,
                            );
                            alert(
                              "Có lỗi xảy ra khi tạo câu hỏi bằng AI. Vui lòng thử lại sau.",
                            );
                          } finally {
                            setIsGenerating(false);
                          }
                        }}
                        isLoading={isGenerating}
                      />
                    </div>
                  )}

                  {activeTab === "bank" && (
                    <div>
                      <QuestionBankTab
                        onAddQuestions={(newQuestions) => {
                          // Filter out questions that already exist in the current list
                          const existingQuestionIds = new Set(
                            questions.map((q) => q.id),
                          );
                          const uniqueQuestions = newQuestions.filter(
                            (q) => !existingQuestionIds.has(q.id),
                          );

                          if (uniqueQuestions.length === 0) {
                            alert("Tất cả câu hỏi đã được thêm vào danh sách!");
                            return;
                          }

                          // Transform questions to match the expected format
                          const transformedQuestions = uniqueQuestions.map(
                            (q, index) => ({
                              ...q,
                              number: questions.length + index + 1,
                            }),
                          );

                          transformedQuestions.forEach((q) => handleAddQuestion(q));

                          if (uniqueQuestions.length < newQuestions.length) {
                            const duplicateCount =
                              newQuestions.length - uniqueQuestions.length;
                            alert(
                              `Đã thêm ${uniqueQuestions.length} câu hỏi mới. ${duplicateCount} câu hỏi đã tồn tại trong danh sách.`,
                            );
                          }
                        }}
                        selectedSubjectId={testDetails.subject}
                        selectedNodeId={testDetails.node}
                        existingQuestionIds={new Set(questions.map((q) => q.id))}
                      />
                    </div>
                  )}
                </div>
              </NotebookCardContent>
            </NotebookCard>
          </div>
        </div>

        {/* Row 2: Question Points Grid (Left) and Preview (Right) */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Question Points Grid */}
          <div className="lg:col-span-1">
            <NotebookCard className="bg-purple-50 h-full">
              <NotebookCardContent className="pt-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dashed border-gray-400">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-200 border-2 border-black rounded-lg flex items-center justify-center rotate-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <FileText className="w-6 h-6 text-purple-800" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 font-handwritten tracking-tight">
                        Điểm số câu hỏi
                      </h2>
                      <p className="text-gray-700 font-bold text-sm">
                        Thiết lập điểm cho từng câu hỏi
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-blue-700 font-handwritten drop-shadow-sm">
                      {questions.length}
                    </span>
                    <p className="text-sm font-bold text-gray-600 uppercase">câu hỏi</p>
                  </div>
                </div>

                {questions.length > 0 ? (
                  <QuestionPointsGrid
                    questions={questions}
                    onPointsChange={(questionId, points) => {
                      setQuestions((prev) =>
                        prev.map((q) =>
                          q.id === questionId ? { ...q, points } : q,
                        ),
                      );
                      // Update points state for display
                      setPoints((prev) => ({
                        ...prev,
                        [questionId]: points,
                      }));
                    }}
                    onNavigateToQuestion={(index) => setCurrentQuestionIndex(index)}
                    currentQuestionIndex={currentQuestionIndex}
                    points={points}
                  />
                ) : (
                  <div className="text-center py-12 bg-white border-2 border-dashed border-gray-400 rounded-lg">
                    <div className="text-gray-600 font-bold mb-2">Chưa có câu hỏi nào</div>
                    <p className="text-sm text-gray-500 font-bold">
                      Hãy thêm câu hỏi để thiết lập điểm số
                    </p>
                  </div>
                )}
              </NotebookCardContent>
            </NotebookCard>
          </div>

          {/* Paginated Question Preview */}
          <div className="lg:col-span-2">
            <NotebookCard className="bg-[#fffdf8] h-full">
              <NotebookCardContent className="pt-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dashed border-gray-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 border-2 border-black rounded-full flex items-center justify-center -rotate-6 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <Eye className="w-6 h-6 text-orange-700" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-gray-900 font-handwritten tracking-tight">
                        Xem trước câu hỏi
                      </h2>
                      <p className="text-gray-700 font-bold text-sm">Xem chi tiết từng câu hỏi</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-blue-700 font-handwritten drop-shadow-sm">
                      {questions.length > 0 ? currentQuestionIndex + 1 : 0}
                    </span>
                    <p className="text-sm font-bold text-gray-600 uppercase">câu hỏi hiện tại</p>
                  </div>
                </div>

                {questions.length > 0 ? (
                  <PaginatedQuestionPreview
                    questions={questions}
                    currentQuestionIndex={currentQuestionIndex}
                    onQuestionChange={setCurrentQuestionIndex}
                    onQuestionDelete={handleRemoveQuestion}
                    points={points}
                  />
                ) : (
                  <div className="text-center py-12 bg-white border-2 border-dashed border-gray-400 rounded-lg">
                    <div className="text-gray-600 font-bold mb-2">Chưa có câu hỏi nào</div>
                    <p className="text-sm text-gray-500 font-bold">
                      Hãy thêm câu hỏi để xem trước
                    </p>
                  </div>
                )}
              </NotebookCardContent>
            </NotebookCard>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end gap-4 border-t-4 border-dashed border-gray-300 pt-6">
        <NotebookButton
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="bg-white text-gray-700 border-gray-400 py-3 px-6 text-base font-bold flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isSaving ? "Đang lưu..." : "Lưu nháp"}
        </NotebookButton>
        <NotebookButton
          onClick={handleSaveTest}
          disabled={isSaving}
          className="bg-blue-100 text-blue-900 border-blue-900 py-3 px-6 text-base font-bold flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isSaving ? "Đang lưu..." : "Lưu bài kiểm tra"}
        </NotebookButton>
      </div>
    </div>
  );
}

export default function CreateTestPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl font-bold text-gray-600">Đang tải...</div>
      </div>
    }>
      <CreateTestContent />
    </Suspense>
  );
}
