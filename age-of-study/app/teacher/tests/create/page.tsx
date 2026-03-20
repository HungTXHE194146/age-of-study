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
  RotateCcw,
  Wifi,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotebookCard, NotebookCardContent, NotebookButton } from "@/components/ui/notebook-card";
import { QuizGeneratorForm } from "@/components/teacher/QuizGeneratorForm";
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
      q_type: qType, // <-- lowercase
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
    type: "homework", // Default to homework
  });
  const [nodes, setNodes] = useState<{ id: number; title: string }[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  // Auto-save logic states
  const [hasDraft, setHasDraft] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);

  // Offline Sync states
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);



  // State for question management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [points, setPoints] = useState<{ [questionId: string]: number }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const total = questions.reduce((sum, q) => sum + (points[q.id] || 10), 0);
    setTotalPoints(total);
  }, [questions, points]);


  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  useEffect(() => {
    if (classIdParam) {
      setTestDetails((prev) => ({
        ...prev,
        classId: classIdParam,
        type: "homework"
      }));
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

  // Network & Sync Logic
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Auto-trigger sync if there's a draft
      const savedDraft = localStorage.getItem("teacher-test-draft");
      if (savedDraft) {
        setPendingSync(true);
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!window.navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Hotkeys handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + S: Save Draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave(true);
      }
      // Ctrl + Enter: Save Test
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [testDetails, questions, isSaving]); // Re-bind when data changes to ensure handleSave has latest state


  // Check for existing draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("teacher-test-draft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Only show restore if there's actually some content
        if (parsed.testDetails?.title || parsed.questions?.length > 0) {
          setDraftData(parsed);
          setHasDraft(true);
          setShowRestoreDialog(true);
        }
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  // Sync state with localStorage whenever data changes (debounced)
  useEffect(() => {
    if (isSaving) return; // Don't save draft while actively saving to DB

    const timer = setTimeout(() => {
      // Don't save empty drafts
      if (!testDetails.title && questions.length === 0) return;

      const dataToSave = {
        testDetails,
        questions,
        points,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem("teacher-test-draft", JSON.stringify(dataToSave));
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [testDetails, questions, points, isSaving]);

  const restoreDraft = () => {
    if (draftData) {
      setTestDetails(draftData.testDetails);
      setQuestions(draftData.questions);
      if (draftData.points) setPoints(draftData.points);
    }
    setShowRestoreDialog(false);
  };

  const discardDraft = () => {
    localStorage.removeItem("teacher-test-draft");
    setShowRestoreDialog(false);
  };


  const handleAddQuestion = (question: Question) => {
    setQuestions((prev) => [...prev, question]);
    setPoints((prev) => ({
      ...prev,
      [question.id]: question.points || 10
    }));
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
      alert("Không thể tạo câu hỏi thay thế lúc này. Vui lòng thử lại sau.");
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

      const createTestRequest: CreateTestRequest = {
        title: testDetails.title,
        description: testDetails.description,
        type: testDetails.type as any,
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
          points: points[q.id] || 10,
          display_order: index,
        })

      );

      const { error: testQuestionsError } = await supabase
        .from("test_questions")
        .insert(testQuestionsToInsert);

      if (testQuestionsError) throw testQuestionsError;

      alert(`Bài kiểm tra đã được lưu ${isDraft ? "nháp " : ""}thành công!`);

      // Clear local draft upon successful save
      localStorage.removeItem("teacher-test-draft");
      setPendingSync(false);

      if (classIdParam) {
        router.push(`/teacher/classes/${classIdParam}`);
      } else {
        router.push("/teacher/tests");
      }
    } catch (error) {
      if (isOffline) {
        setPendingSync(true);
        alert("Hiện không có kết nối mạng. Bài kiểm tra đã được lưu tạm vào trình duyệt và sẽ tự động đồng bộ khi có mạng trở lại.");
      } else {
        console.error(`Error saving ${isDraft ? "draft" : "test"}:`, error);
        alert(`Có lỗi xảy ra khi lưu ${isDraft ? "nháp " : ""}bài kiểm tra`);
      }
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

        {/* Restore Draft Dialog */}
        <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <DialogContent className="bg-[#fffdf8] border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-gray-900 sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black font-handwritten flex items-center gap-3">
                <RotateCcw className="w-8 h-8 text-blue-600" />
                Khôi phục bản nháp?
              </DialogTitle>
              <DialogDescription className="text-lg font-bold text-gray-700 pt-4">
                Chúng tôi tìm thấy một bản nháp bài kiểm tra chưa được lưu từ lần trước (
                <span className="text-blue-700 italic">
                  {draftData?.savedAt ? new Date(draftData.savedAt).toLocaleString('vi-VN') : 'vừa xong'}
                </span>
                ). Bạn có muốn tiếp tục chỉnh sửa không?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-6 flex flex-row gap-4 justify-end">
              <Button
                variant="outline"
                onClick={discardDraft}
                className="border-2 border-black font-bold hover:bg-red-50 hover:text-red-700"
              >
                Bỏ qua và tạo mới
              </Button>
              <Button
                onClick={restoreDraft}
                className="bg-blue-600 border-2 border-black text-white font-bold hover:bg-blue-700 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
              >
                Tiếp tục soạn thảo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


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
                    <div className="animate-in fade-in duration-500">
                      <QuizGeneratorForm
                        subjectId={testDetails.subject}
                        nodeId={testDetails.node}
                        onQuestionsGenerated={(newQuestions) => {
                          const transformed = newQuestions.map((q, index) => ({
                            ...q,
                            number: questions.length + index + 1,
                            id: crypto.randomUUID(),
                            createdAt: Date.now(),
                          }));
                          setQuestions(prev => [...prev, ...transformed as Question[]]);

                          // Initialize points for new questions
                          const newPoints = { ...points };
                          transformed.forEach(q => {
                            newPoints[q.id] = 10; // Default points
                          });
                          setPoints(newPoints);
                        }}

                        onBankQuestionsSelected={(selectedQuestions) => {
                          const existingIds = new Set(questions.map(q => q.id));
                          const unique = selectedQuestions.filter(q => !existingIds.has(q.id));

                          const transformed = unique.map((q, index) => ({
                            ...q,
                            number: questions.length + index + 1,
                            createdAt: q.createdAt || Date.now(),
                          }));

                          setQuestions(prev => [...prev, ...transformed as Question[]]);
                          if (unique.length < selectedQuestions.length) {
                            alert(`Đã thêm ${unique.length} câu hỏi. ${selectedQuestions.length - unique.length} câu đã tồn tại.`);
                          }
                        }}
                        bankQuestions={[]} // This would ideally come from a separate hook/fetch
                        isLoadingBank={false}
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
                  <div className="space-y-4">
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
                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={() => {
                          setActiveTab("manual");
                          const element = document.getElementById("manual-tab-trigger");
                          if (element) element.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-green-100 text-green-700 border-2 border-green-600 font-bold hover:bg-green-200"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm câu hỏi mới vào sau
                      </Button>
                    </div>
                  </div>

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
          <span className="ml-1 text-[10px] opacity-60">Ctrl+S</span>
        </NotebookButton>
        <NotebookButton
          onClick={handleSaveTest}
          disabled={isSaving}
          className="bg-blue-100 text-blue-900 border-blue-900 py-3 px-6 text-base font-bold flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isSaving ? "Đang lưu..." : "Lưu bài kiểm tra"}
          <span className="ml-1 text-[10px] opacity-60">Ctrl+↵</span>
        </NotebookButton>
      </div>

      {/* Sync Status Toast */}
      {pendingSync && !isOffline && (
        <div className="fixed bottom-8 left-8 z-[100] bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-4 animate-bounce">
          <div className="bg-green-100 p-2 rounded-full border-2 border-black">
            <Wifi className="w-6 h-6 text-green-700" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Bạn đã online trở lại!</p>
            <button
              onClick={() => {
                setPendingSync(false);
                handleSave(true);
              }}
              className="text-blue-600 font-extrabold hover:underline text-sm"
            >
              Nhấn đây để đồng bộ bản nháp lên Server ngay
            </button>
          </div>
          <button onClick={() => setPendingSync(false)} className="ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
