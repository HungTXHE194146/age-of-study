"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
import {
  NotebookCard,
  NotebookCardContent,
  NotebookButton,
} from "@/components/ui/notebook-card";
import { QuizGeneratorForm } from "@/components/teacher/QuizGeneratorForm";
import { QuestionBankTab } from "@/components/teacher/QuestionBankTab";
import { ManualQuestionTab } from "@/components/teacher/ManualQuestionTab";
import { TestDetailsForm, TestDetails } from "@/components/teacher/TestDetailsForm";
import { QuestionPointsGrid } from "@/components/teacher/QuestionPointsGrid";
import { PaginatedQuestionPreview } from "@/components/teacher/PaginatedQuestionPreview";
import { Button } from "@/components/ui/button";
import { Question, QuestionDifficulty } from "@/types/teacher";
import { subjectService } from "@/lib/subjectService";
import { Subject } from "@/types/teacher";
import { TestService } from "@/lib/testService";
import { CreateTestRequest, TestWithQuestions } from "@/types/test";
import { useAuthStore } from "@/store/useAuthStore";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { AIQuestionService } from "@/lib/aiQuestionService";
import { getTeacherClasses } from "@/lib/classService";
import Loading from "@/components/ui/loading";

// Helper functions (same as create page for consistency)
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
    let qType = q.type.toLowerCase();

    let correctIndex = -1;
    if (q.type === "MULTIPLE_CHOICE") {
      correctIndex = (q.options || []).findIndex((opt) => opt.isCorrect);
    } else if (q.type === "TRUE_FALSE") {
      correctIndex = (q.options || []).findIndex((opt) => opt.isCorrect);
    }

    return {
      id: q.id,
      node_id: resolveNodeId(testDetails.subject, testDetails.node),
      content: {
        type: q.type,
        questionText: q.questionText,
        hint: q.hint,
        options: (q.options || []).map((opt) => ({
          label: opt.label,
          text: opt.text,
          isCorrect: opt.isCorrect
        })),
        metadata: q.metadata
      },
      correct_option_index: correctIndex !== -1 ? correctIndex : null,
      difficulty: (q.difficulty || "Medium").toLowerCase() as "easy" | "medium" | "hard",
      status: "available",
      created_by: userId || null,
      created_at: new Date().toISOString(),
      q_type: qType,
      model_answer: q.model_answer || "",
      subject_id: resolveSubjectId(testDetails.subject),
      explanation: q.explanation || null,
      hint: q.hint || null,
    };
  });
};

export default function TeacherTestEditPage() {
  return (
    <Suspense fallback={<Loading message="Đang tải..." />}>
      <TestEditContent />
    </Suspense>
  );
}

function TestEditContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const testId = params.testId as string;
  const classIdParam = searchParams.get("classId");
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"manual" | "ai" | "bank">("manual");
  const [testDetails, setTestDetails] = useState<TestDetails>({
    title: "",
    description: "",
    subject: "",
    node: "",
    timeLimit: 30,
    showHints: false,
    classId: classIdParam || "",
    type: "homework",
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [points, setPoints] = useState<{ [questionId: string]: number }>({});
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [nodes, setNodes] = useState<{ id: number; title: string }[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Fetch initial data and test details
  useEffect(() => {
    async function loadData() {
      if (!testId) return;

      setIsLoading(true);
      try {
        const testService = new TestService();
        const testData = await testService.getTestWithQuestions(testId);

        if (!testData) {
          router.push("/teacher/tests");
          return;
        }

        // 1. Initial form state
        setTestDetails({
          title: testData.title,
          description: testData.description || "",
          subject: testData.subject_id?.toString() || "",
          node: testData.node_id?.toString() || "",
          timeLimit: testData.settings.time_limit || 30,
          showHints: testData.settings.show_hints || false,
          classId: testData.class_id?.toString() || classIdParam || "",
          type: testData.type || "homework",
        });

        // 2. Map questions from DB structure to frontend Question type
        const mappedQuestions: Question[] = testData.questions.map((q, idx) => ({
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
          hint: q.hint || q.content.hint || "",
          points: q.points || 10,
        }));

        setQuestions(mappedQuestions);

        // 3. Initialize points
        const initialPoints: { [id: string]: number } = {};
        mappedQuestions.forEach(q => { initialPoints[q.id] = q.points || 10; });
        setPoints(initialPoints);

        // 4. Load auxiliary data
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

        // 5. Load nodes if subject exists
        if (testData.subject_id) {
          await loadNodes(testData.subject_id.toString());
        }

      } catch (error) {
        console.error("Error loading test data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [testId, user?.id]);

  const loadNodes = async (subjectId: string) => {
    if (!subjectId) return;
    setIsLoadingNodes(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("nodes")
        .select("id, title")
        .eq("subject_id", parseInt(subjectId))
        .order("title", { ascending: true });
      if (error) throw error;
      setNodes(data || []);
    } catch (e) {
      console.error("Error loading nodes", e);
    } finally {
      setIsLoadingNodes(false);
    }
  };

  const handleAddQuestion = (question: Question) => {
    setQuestions((prev) => [...prev, question]);
    setPoints((prev) => ({ ...prev, [question.id]: question.points || 10 }));
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleEditQuestion = (updatedQuestion: Question) => {
    setQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
  };

  const handleReplaceQuestion = async (id: string) => {
    const questionToReplace = questions.find(q => q.id === id);
    if (!questionToReplace) return;

    setIsReplacing(true);
    try {
      const aiService = new AIQuestionService();
      // Yêu cầu AI tạo 1 câu hỏi với cấu trúc tách bạch Instruction và Content
      const response = await aiService.generateQuestions({
        textPrompt: `Tạo một câu hỏi mới thay thế cho câu hỏi này: "${questionToReplace.questionText}". 
        YÊU CẦU QUAN TRỌNG: 
        1. Phải tách rõ phần dẫn đề (ví dụ: "Sắp xếp các từ sau...") vào trường questionText.
        2. Phần nội dung làm bài (ví dụ: câu văn, các từ đơn) phải nằm trong metadata.
        3. Cùng chủ đề và mức độ khó: ${questionToReplace.difficulty}.`,
        questionCount: 1,
        difficulty: questionToReplace.difficulty as any,
        subject: testDetails.subject,
        questionTypes: [questionToReplace.type],
        fromKnowledgeBase: !!testDetails.node,
      });

      if (response.questions && response.questions.length > 0) {
        let newQuestion = response.questions[0];

        const instructionMap: Record<string, string> = {
          WORD_ORDERING: "Hãy sắp xếp các từ sau để tạo thành một câu hoàn chỉnh nhé!",
          FIND_ERROR: "Thám tử nhí ơi, hãy tìm và nhấn vào lỗi sai trong câu sau đây nhé!",
          FILL_IN_BLANKS: "Em hãy điền từ còn thiếu vào chỗ trống để hoàn thành câu dưới đây:",
          MATCHING: "Hãy nối các cụm từ ở cột bên trái với cột bên phải sao cho phù hợp nhất!",
          CATEGORIZATION: "Em hãy phân loại các từ ngữ sau vào nhóm tương ứng nhé!"
        };

        // Quan trọng: Lưu lại nội dung câu văn gốc vào metadata nếu AI trả về trong questionText
        const rawMetadata = (newQuestion as any).metadata || {};
        let finalMetadata = { ...rawMetadata };
        let finalQuestionText = instructionMap[newQuestion.type] || newQuestion.questionText || "Hãy hoàn thành câu hỏi sau:";

        if (newQuestion.type === "FILL_IN_BLANKS" || newQuestion.type === "FIND_ERROR") {
          // Nếu questionText chứa dấu gạch chân hoặc lỗi sai, di chuyển nó vào metadata.sentence
          if (!finalMetadata.sentence && (newQuestion.questionText.includes('_') || newQuestion.questionText.length > 20)) {
            finalMetadata.sentence = newQuestion.questionText;
          }
        }

        const transformed: Question = {
          ...newQuestion as any,
          id: crypto.randomUUID(),
          number: questionToReplace.number,
          createdAt: Date.now(),
          questionText: finalQuestionText,
          metadata: finalMetadata
        };
        setQuestions(prev => prev.map(q => q.id === id ? transformed : q));
        setPoints(prev => ({ ...prev, [transformed.id]: prev[id] || 10 }));
      }
    } catch (error) {
      console.error("Failed to replace question:", error);
      alert("Không thể tạo câu hỏi thay thế lúc này.");
    } finally {
      setIsReplacing(false);
    }
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
      const supabase = getSupabaseBrowserClient();

      // 1. Update Test Table
      await testService.updateTest(testId, {
        title: testDetails.title,
        description: testDetails.description,
        type: testDetails.type as any,
        subject_id: resolveSubjectId(testDetails.subject),
        node_id: resolveNodeId(testDetails.subject, testDetails.node),
        settings: {
          time_limit: testDetails.timeLimit,
          allow_retry: true,
          show_hints: testDetails.showHints || false,
        },
        is_published: !isDraft,
        class_id: testDetails.classId ? parseInt(testDetails.classId) : null,
      });

      // 2. Upsert Questions
      const questionsToSave = prepareQuestionsToSave(questions, testDetails, user?.id);
      const { error: questionsError } = await supabase
        .from("questions")
        .upsert(questionsToSave, { onConflict: "id" });

      if (questionsError) throw questionsError;

      // 3. Refresh Test Questions (delete and re-insert for order and points)
      await supabase.from("test_questions").delete().eq("test_id", testId);

      const testQuestionsToInsert = questions.map((q, index) => ({
        test_id: testId,
        question_id: q.id,
        points: points[q.id] || 10,
        display_order: index,
      }));

      const { error: testQuestionsError } = await supabase
        .from("test_questions")
        .insert(testQuestionsToInsert);

      if (testQuestionsError) throw testQuestionsError;

      alert("Bài kiểm tra đã được cập nhật thành công!");
      if (classIdParam) {
        router.push(`/teacher/classes/${classIdParam}`);
      } else {
        router.push("/teacher/tests");
      }
    } catch (error) {
      console.error("Error saving test:", error);
      alert("Có lỗi xảy ra khi cập nhật bài kiểm tra");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading message="Đang tải dữ liệu bài kiểm tra..." />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 p-8 bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2.5rem] border-b-2 border-dashed border-gray-400 relative">
        <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-blue-200 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"></div>
        <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-blue-200 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"></div>

        <NotebookButton onClick={() => router.back()} className="mb-6 bg-white border-2 border-black text-gray-800 hover:bg-gray-100 px-4 py-1 text-sm font-bold flex items-center gap-2">
          Quay lại
        </NotebookButton>
        <h1 className="text-5xl font-black text-gray-900 mb-4 font-handwritten tracking-tight pl-6">
          Chỉnh Sửa Bài Kiểm Tra
        </h1>
        <p className="text-xl text-gray-700 font-bold italic pl-6 leading-10">
          Cập nhật thông tin bài tập và bộ câu hỏi
        </p>
      </div>

      <div className="grid gap-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <NotebookCard className="bg-yellow-50 h-full">
              <NotebookCardContent className="pt-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-gray-400">
                  <div className="w-12 h-12 bg-yellow-200 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    <Settings className="w-6 h-6 text-yellow-800" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 font-handwritten">Chi tiết</h2>
                    <p className="text-gray-700 font-bold text-sm">Thông số cơ bản</p>
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

          <div className="lg:col-span-2">
            <NotebookCard className="bg-[#fffdf8] h-full">
              <NotebookCardContent className="pt-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dashed border-gray-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <Plus className="w-6 h-6 text-green-700" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 font-handwritten">Thêm Câu Hỏi</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-blue-700 font-handwritten">{questions.length}</span>
                    <p className="text-sm font-bold text-gray-600 uppercase">câu hỏi</p>
                  </div>
                </div>

                <div className="border-b-2 border-black mb-6">
                  <nav className="-mb-[2px] flex space-x-2">
                    {["manual", "ai", "bank"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex items-center gap-2 py-3 px-4 border-2 font-bold text-sm rounded-t-lg transition-colors ${activeTab === tab
                          ? "border-black border-b-white bg-white text-gray-900 z-10"
                          : "border-transparent bg-gray-100/50 text-gray-500 hover:text-gray-900"
                          }`}
                      >
                        {tab === "manual" && <FileText className="w-5 h-5" />}
                        {tab === "ai" && <LinkIcon className="w-5 h-5" />}
                        {tab === "bank" && <Book className="w-5 h-5" />}
                        {tab === "manual" ? "Nhập thủ công" : tab === "ai" ? "AI Generator" : "Ngân hàng"}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="space-y-6">
                  {activeTab === "manual" && <ManualQuestionTab questionsLength={questions.length} onAddQuestion={handleAddQuestion} />}
                  {activeTab === "ai" && (
                    <QuizGeneratorForm
                      subjectId={testDetails.subject}
                      nodeId={testDetails.node}
                      onQuestionsGenerated={(newQuestions) => {
                        const transformed = newQuestions.map((q, index) => {
                          let finalQ = { ...q };
                          const instructionMap: Record<string, string> = {
                            WORD_ORDERING: "Hãy sắp xếp các từ sau để tạo thành một câu hoàn chỉnh nhé!",
                            FIND_ERROR: "Thám tử nhí ơi, hãy tìm và nhấn vào lỗi sai trong câu sau đây nhé!",
                            FILL_IN_BLANKS: "Em hãy điền từ còn thiếu vào chỗ trống để hoàn thành câu dưới đây:",
                            MATCHING: "Hãy nối các cụm từ ở cột bên trái với cột bên phải sao cho phù hợp nhất!",
                            CATEGORIZATION: "Em hãy phân loại các từ ngữ sau vào nhóm tương ứng nhé!"
                          };

                          // Repair logic for interactive types that need a sentence
                          if (q.type === 'FILL_IN_BLANKS' || q.type === 'FIND_ERROR') {
                            const metadata = (finalQ as any).metadata || {};
                            // If metadata.sentence is missing, move content from questionText if it looks like content
                            if (!metadata.sentence && (q.questionText.includes('___') || q.questionText.length > 30)) {
                              // Double check it's not already an instruction
                              const values = Object.values(instructionMap);
                              if (!values.includes(q.questionText)) {
                                metadata.sentence = q.questionText;
                                finalQ.questionText = instructionMap[q.type] || "Em hãy hoàn thành câu hỏi sau:";
                                (finalQ as any).metadata = metadata;
                              }
                            }
                          } else if (q.type === 'WORD_ORDERING' || q.type === 'MATCHING' || q.type === 'CATEGORIZATION') {
                            // Ensure there's a proper instruction if the AI didn't provide one
                            if (!q.questionText || q.questionText.length < 10) {
                              finalQ.questionText = instructionMap[q.type];
                            }
                          }

                          return {
                            ...finalQ,
                            number: questions.length + index + 1,
                            id: crypto.randomUUID(),
                            createdAt: Date.now(),
                          };
                        });
                        setQuestions(prev => [...prev, ...transformed as Question[]]);
                        transformed.forEach(q => { setPoints(p => ({ ...p, [q.id]: 10 })); });
                      }}
                      onBankQuestionsSelected={(selectedQuestions) => {
                        const existingIds = new Set(questions.map(q => q.id));
                        const unique = selectedQuestions.filter(q => !existingIds.has(q.id));

                        unique.forEach((q, index) => {
                          const transformed = {
                            ...q,
                            number: questions.length + index + 1,
                            createdAt: q.createdAt || Date.now(),
                          };
                          handleAddQuestion(transformed);
                        });

                        if (unique.length < selectedQuestions.length) {
                          alert(`Đã thêm ${unique.length} câu hỏi. ${selectedQuestions.length - unique.length} câu đã tồn tại.`);
                        }
                      }}
                    />
                  )}
                  {activeTab === "bank" && (
                    <QuestionBankTab
                      onAddQuestions={(newQuestions) => {
                        const existingIds = new Set(questions.map(q => q.id));
                        const unique = newQuestions.filter(q => !existingIds.has(q.id));
                        unique.forEach(q => handleAddQuestion(q));
                      }}
                      selectedSubjectId={testDetails.subject}
                      selectedNodeId={testDetails.node}
                      existingQuestionIds={new Set(questions.map(q => q.id))}
                    />
                  )}
                </div>
              </NotebookCardContent>
            </NotebookCard>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <NotebookCard className="bg-purple-50 h-full">
              <NotebookCardContent className="pt-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dashed border-gray-400">
                  <h2 className="text-2xl font-black text-gray-900 font-handwritten">Điểm số</h2>
                </div>
                {questions.length > 0 ? (
                  <QuestionPointsGrid
                    questions={questions}
                    onPointsChange={(id, p) => setPoints(prev => ({ ...prev, [id]: p }))}
                    onNavigateToQuestion={setCurrentQuestionIndex}
                    currentQuestionIndex={currentQuestionIndex}
                    points={points}
                  />
                ) : <div className="text-center py-12 font-bold text-gray-500">Chưa có câu hỏi</div>}
              </NotebookCardContent>
            </NotebookCard>
          </div>

          <div className="lg:col-span-2">
            <NotebookCard className="bg-[#fffdf8] h-full">
              <NotebookCardContent className="pt-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dashed border-gray-300">
                  <h2 className="text-3xl font-black text-gray-900 font-handwritten">Xem trước</h2>
                  <span className="text-xl font-bold text-gray-500">Câu {questions.length > 0 ? currentQuestionIndex + 1 : 0} / {questions.length}</span>
                </div>
                {questions.length > 0 ? (
                  <PaginatedQuestionPreview
                    questions={questions}
                    currentQuestionIndex={currentQuestionIndex}
                    onQuestionChange={setCurrentQuestionIndex}
                    onQuestionDelete={handleRemoveQuestion}
                    onQuestionEdit={handleEditQuestion}
                    onQuestionReplace={handleReplaceQuestion}
                    isReplacing={isReplacing}
                    points={points}
                  />
                ) : <div className="text-center py-12 font-bold text-gray-500">Chưa có câu hỏi</div>}
              </NotebookCardContent>
            </NotebookCard>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-4 border-t-4 border-dashed border-gray-300 pt-6">
        <NotebookButton onClick={() => handleSave(true)} disabled={isSaving} className="bg-white text-gray-700 border-gray-400 py-3 px-6 font-bold flex items-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <Save className="w-5 h-5" /> {isSaving ? "Đang lưu..." : "Lưu nháp"}
        </NotebookButton>
        <NotebookButton onClick={() => handleSave(false)} disabled={isSaving} className="bg-blue-100 text-blue-900 border-blue-900 py-3 px-6 font-bold flex items-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <Save className="w-5 h-5" /> {isSaving ? "Đang lưu..." : "Cập nhật bài tập"}
        </NotebookButton>
      </div>
    </div>
  );
}
