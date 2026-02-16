"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { QuizGeneratorForm } from "@/components/teacher/QuizGeneratorForm";
import { QuizReviewList } from "@/components/teacher/QuizReviewList";
import { QuestionBankTab } from "@/components/teacher/QuestionBankTab";
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

export default function CreateTestPage() {
  const router = useRouter();
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
  });
  const [nodes, setNodes] = useState<{ id: number; title: string }[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [manualQuestionType, setManualQuestionType] = useState<
    "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY"
  >("MULTIPLE_CHOICE");

  // Manual question form state
  const [manualQuestionText, setManualQuestionText] = useState("");
  const [manualDifficulty, setManualDifficulty] = useState<
    "Easy" | "Medium" | "Hard"
  >("Easy");
  const [manualOptions, setManualOptions] = useState([
    { id: "1", label: "A", text: "", isCorrect: false },
    { id: "2", label: "B", text: "", isCorrect: false },
    { id: "3", label: "C", text: "", isCorrect: false },
    { id: "4", label: "D", text: "", isCorrect: false },
  ]);
  const [manualCorrectAnswer, setManualCorrectAnswer] = useState("A");
  const [manualTrueFalseContent, setManualTrueFalseContent] = useState({
    true: "",
    false: "",
  });
  const [manualTrueFalseCorrectAnswer, setManualTrueFalseCorrectAnswer] =
    useState<"TRUE" | "FALSE">("TRUE");
  const [manualEssayHint, setManualEssayHint] = useState("");
  const [manualExplanation, setManualExplanation] = useState("");

  // State for question management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [points, setPoints] = useState<{ [questionId: string]: number }>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch subjects from Supabase
  useEffect(() => {
    async function fetchSubjects() {
      try {
        setIsLoadingSubjects(true);
        const subjectList = await subjectService.getSubjects();
        setSubjects(subjectList);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      } finally {
        setIsLoadingSubjects(false);
      }
    }

    fetchSubjects();
  }, []);

  const handleAddQuestion = (question: Question) => {
    setQuestions((prev) => [...prev, question]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSaveTest = async () => {
    if (!testDetails.title.trim()) {
      alert("Vui lòng nhập tiêu đề bài kiểm tra");
      return;
    }

    if (
      !testDetails.subject ||
      testDetails.subject === "" ||
      testDetails.subject === "0"
    ) {
      alert("Vui lòng chọn môn học liên quan cho bài kiểm tra");
      return;
    }

    if (questions.length === 0) {
      alert("Vui lòng thêm ít nhất một câu hỏi");
      return;
    }

    setIsSaving(true);
    try {
      const testService = new TestService();

      // Create test data for Supabase
      const createTestRequest: CreateTestRequest = {
        title: testDetails.title,
        description: testDetails.description,
        type: "practice",

        // 1. Lưu ID môn học vào cột subject_id
        subject_id: testDetails.subject ? parseInt(testDetails.subject) : null,

        // 2. node_id chỉ có dữ liệu nếu người dùng chọn cụ thể một bài học (Skill Node)
        // Nếu chỉ chọn môn chung chung, node_id phải là null
        node_id: testDetails.node ? parseInt(testDetails.node) : null,

        settings: {
          time_limit: testDetails.timeLimit,
          allow_retry: true,
        },
        is_published: true,
        created_by: user?.id || "",
      };

      // Fix for foreign key violation: ensure node_id is properly null for practice tests
      if (
        !testDetails.subject ||
        testDetails.subject === "" ||
        testDetails.subject === "0"
      ) {
        createTestRequest.node_id = null;
      }

      // Create the test in Supabase
      const createdTest = await testService.createTest(createTestRequest);

      // Create test_questions relationships
      const supabase = await getSupabaseBrowserClient();

      // Update existing questions or create new ones
      // Use upsert for all questions to handle both new and existing questions from bank
      const questionsToSave = questions.map((q, index) => ({
        id: q.id,
        node_id: testDetails.node ? parseInt(testDetails.node) : null,
        content: {
          questionText: q.questionText,
          options: q.options.map((opt) => ({
            label: opt.label,
            text: opt.text,
          })),
        },
        correct_option_index:
          q.type === "MULTIPLE_CHOICE"
            ? q.options.findIndex((opt) => opt.isCorrect)
            : q.type === "TRUE_FALSE"
              ? 0 // Assume first option (True) is correct for TRUE_FALSE
              : -1, // -1 for ESSAY questions
        difficulty: q.difficulty.toLowerCase() as "easy" | "medium" | "hard",
        status: "available",
        created_by: user?.id || null,
        created_at: new Date().toISOString(),
        q_type:
          q.type === "MULTIPLE_CHOICE"
            ? "multiple_choice"
            : q.type === "TRUE_FALSE"
              ? "true_false"
              : "essay",
        model_answer: q.model_answer || "",
        subject_id: testDetails.subject
          ? parseInt(testDetails.subject)
          : null,
        explanation: q.explanation || null,
      }));

      try {
        // Use upsert with conflict resolution to handle both new and existing questions
        const { error: questionsError } = await supabase
          .from("questions")
          .upsert(questionsToSave, { onConflict: "id" });

        if (questionsError) {
          console.error("Error upserting questions:", questionsError);
          throw questionsError;
        }
      } catch (error) {
        console.error("Error saving questions:", error);
        throw error;
      }

      // Insert test_questions relationships for all questions
      const testQuestionsToInsert = questions.map(
        (q: Question, index: number) => ({
          test_id: createdTest.id,
          question_id: q.id,
          points: q.points || 10,
          display_order: index,
        }),
      );

      const { error: testQuestionsError } = await supabase
        .from("test_questions")
        .insert(testQuestionsToInsert);

      if (testQuestionsError) throw testQuestionsError;

      alert("Bài kiểm tra đã được lưu thành công!");
      router.push("/teacher/tests");
    } catch (error) {
      console.error("Error saving test:", error);
      alert("Có lỗi xảy ra khi lưu bài kiểm tra");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!testDetails.title.trim()) {
      alert("Vui lòng nhập tiêu đề bài kiểm tra");
      return;
    }

    if (
      !testDetails.subject ||
      testDetails.subject === "" ||
      testDetails.subject === "0"
    ) {
      alert("Vui lòng chọn môn học liên quan cho bài kiểm tra");
      return;
    }

    if (questions.length === 0) {
      alert("Vui lòng thêm ít nhất một câu hỏi");
      return;
    }

    setIsSaving(true);
    try {
      const testService = new TestService();

      // Create test data for Supabase (draft version)
      const createTestRequest: CreateTestRequest = {
        title: testDetails.title,
        description: testDetails.description,
        type: "practice",

        // 1. Lưu ID môn học vào cột subject_id
        subject_id: testDetails.subject ? parseInt(testDetails.subject) : null,

        // 2. node_id chỉ có dữ liệu nếu người dùng chọn cụ thể một bài học (Skill Node)
        // Nếu chỉ chọn môn chung chung, node_id phải là null
        node_id: testDetails.node ? parseInt(testDetails.node) : null,

        settings: {
          time_limit: testDetails.timeLimit,
          allow_retry: true,
        },
        is_published: false, // Draft status
        created_by: user?.id || "",
      };

      // Fix for foreign key violation: ensure node_id is properly null for practice tests
      if (
        !testDetails.subject ||
        testDetails.subject === "" ||
        testDetails.subject === "0"
      ) {
        createTestRequest.node_id = null;
      }

      // Create the test in Supabase
      const createdTest = await testService.createTest(createTestRequest);

      // Create test_questions relationships only (questions already exist in question bank)
      const supabase = await getSupabaseBrowserClient();

      // Insert test_questions relationships
      const testQuestionsToInsert = questions.map(
        (q: Question, index: number) => ({
          test_id: createdTest.id,
          question_id: q.id, // Use existing question ID from question bank
          points: 10, // Default points
          display_order: index,
        }),
      );

      const { error: testQuestionsError } = await supabase
        .from("test_questions")
        .insert(testQuestionsToInsert);

      if (testQuestionsError) throw testQuestionsError;

      alert("Bài kiểm tra đã được lưu nháp thành công!");
      router.push("/teacher/tests");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Có lỗi xảy ra khi lưu nháp bài kiểm tra");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Tạo bài kiểm tra mới
        </h1>
        <p className="text-lg text-gray-600">
          Thiết lập chi tiết bài kiểm tra và thêm câu hỏi
        </p>
      </div>

      <div className="grid gap-8">
        {/* Row 1: Test Details (Left) and Question Management (Right) */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Test Details Section */}
          <div className="bg-white rounded-2xl p-8 shadow-md lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Chi tiết bài kiểm tra
                </h2>
                <p className="text-gray-600">Cấu hình các thông số cơ bản</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề bài kiểm tra
                </label>
                <input
                  type="text"
                  value={testDetails.title}
                  onChange={(e) =>
                    setTestDetails((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tiêu đề bài kiểm tra..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={testDetails.description}
                  onChange={(e) =>
                    setTestDetails((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mô tả ngắn về bài kiểm tra..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Môn học <span className="text-red-500">*</span>
                </label>
                <select
                  value={testDetails.subject}
                  onChange={async (e) => {
                    const selectedSubjectId = e.target.value;
                    setTestDetails((prev) => ({
                      ...prev,
                      subject: selectedSubjectId,
                      node: "", // Reset node when subject changes
                    }));

                    // Fetch nodes for the selected subject
                    if (selectedSubjectId) {
                      try {
                        setIsLoadingNodes(true);
                        const supabase = (
                          await import("@/lib/supabase")
                        ).getSupabaseBrowserClient();
                        const { data, error } = await supabase
                          .from("nodes")
                          .select("id, title")
                          .eq("subject_id", parseInt(selectedSubjectId))
                          .order("title", { ascending: true });

                        if (error) throw error;
                        setNodes(data || []);
                      } catch (error) {
                        console.error("Error fetching nodes:", error);
                        setNodes([]);
                      } finally {
                        setIsLoadingNodes(false);
                      }
                    } else {
                      setNodes([]);
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn môn học</option>
                  {isLoadingSubjects ? (
                    <option disabled>Đang tải môn học...</option>
                  ) : (
                    subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chủ đề / Bài học
                </label>
                <select
                  value={testDetails.node}
                  onChange={(e) =>
                    setTestDetails((prev) => ({
                      ...prev,
                      node: e.target.value,
                    }))
                  }
                  disabled={!testDetails.subject || isLoadingNodes}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Kiểm tra tổng hợp / Luyện tập chung</option>
                  {isLoadingNodes ? (
                    <option disabled>Đang tải bài học...</option>
                  ) : (
                    nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian làm bài (phút)
                </label>
                <input
                  type="number"
                  value={testDetails.timeLimit}
                  onChange={(e) =>
                    setTestDetails((prev) => ({
                      ...prev,
                      timeLimit: parseInt(e.target.value),
                    }))
                  }
                  min="5"
                  max="180"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Question Management Section */}
          <div className="bg-white rounded-2xl p-8 shadow-md lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Câu hỏi</h2>
                  <p className="text-gray-600">Thêm và quản lý câu hỏi</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">
                  {questions.length}
                </span>
                <p className="text-sm text-gray-600">câu hỏi</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("manual")}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "manual"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Nhập thủ công
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "ai"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  AI Generator
                </button>
                <button
                  onClick={() => setActiveTab("bank")}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "bank"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Book className="w-4 h-4" />
                  Question Bank
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === "manual" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Tạo câu hỏi thủ công
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Nhập thông tin câu hỏi và các lựa chọn trả lời
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nội dung câu hỏi
                      </label>
                      <textarea
                        rows={3}
                        value={manualQuestionText}
                        onChange={(e) => setManualQuestionText(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập nội dung câu hỏi..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loại câu hỏi
                      </label>
                      <select
                        value={manualQuestionType}
                        onChange={(e) =>
                          setManualQuestionType(
                            e.target.value as
                              | "MULTIPLE_CHOICE"
                              | "TRUE_FALSE"
                              | "ESSAY",
                          )
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                        <option value="TRUE_FALSE">Đúng/Sai</option>
                        <option value="ESSAY">Tự luận</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Độ khó
                      </label>
                      <select
                        value={manualDifficulty}
                        onChange={(e) =>
                          setManualDifficulty(
                            e.target.value as "Easy" | "Medium" | "Hard",
                          )
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Easy">Dễ</option>
                        <option value="Medium">Trung bình</option>
                        <option value="Hard">Khó</option>
                      </select>
                    </div>

                    {/* Multiple Choice Options */}
                    {manualQuestionType === "MULTIPLE_CHOICE" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-gray-900">
                            Lựa chọn trả lời
                          </h4>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (manualOptions.length > 3) {
                                  setManualOptions((prev) => prev.slice(0, -1));
                                  // Update correct answer if it was the last option
                                  if (
                                    manualCorrectAnswer ===
                                    String.fromCharCode(
                                      64 + manualOptions.length,
                                    )
                                  ) {
                                    setManualCorrectAnswer(
                                      String.fromCharCode(
                                        64 + manualOptions.length - 1,
                                      ),
                                    );
                                  }
                                }
                              }}
                              disabled={manualOptions.length <= 3}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              - Xóa
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (manualOptions.length < 6) {
                                  const newOption = {
                                    id: (manualOptions.length + 1).toString(),
                                    label: String.fromCharCode(
                                      65 + manualOptions.length,
                                    ),
                                    text: "",
                                    isCorrect: false,
                                  };
                                  setManualOptions((prev) => [
                                    ...prev,
                                    newOption,
                                  ]);
                                }
                              }}
                              disabled={manualOptions.length >= 6}
                              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              + Thêm
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {manualOptions.map((option, index) => (
                            <div key={option.id} className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lựa chọn {option.label}
                              </label>
                              <input
                                type="text"
                                value={option.text}
                                onChange={(e) => {
                                  const updatedOptions = [...manualOptions];
                                  updatedOptions[index] = {
                                    ...option,
                                    text: e.target.value,
                                  };
                                  setManualOptions(updatedOptions);
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={`Nhập lựa chọn ${option.label}...`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* True/False Options */}
                    {manualQuestionType === "TRUE_FALSE" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Đáp án Đúng
                          </label>
                          <input
                            type="text"
                            value={manualTrueFalseContent.true}
                            onChange={(e) =>
                              setManualTrueFalseContent({
                                ...manualTrueFalseContent,
                                true: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nhập nội dung cho Đúng..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Đáp án Sai
                          </label>
                          <input
                            type="text"
                            value={manualTrueFalseContent.false}
                            onChange={(e) =>
                              setManualTrueFalseContent({
                                ...manualTrueFalseContent,
                                false: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nhập nội dung cho Sai..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Essay Question */}
                    {manualQuestionType === "ESSAY" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gợi ý trả lời
                        </label>
                        <textarea
                          rows={4}
                          value={manualEssayHint}
                          onChange={(e) => setManualEssayHint(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nhập gợi ý trả lời hoặc hướng dẫn chấm điểm..."
                        />
                      </div>
                    )}

                    {/* Multiple Choice Answer */}
                    {manualQuestionType === "MULTIPLE_CHOICE" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Đáp án đúng
                        </label>
                        <select
                          value={manualCorrectAnswer}
                          onChange={(e) =>
                            setManualCorrectAnswer(e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {manualOptions.map((option) => (
                            <option key={option.id} value={option.label}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* True/False Answer */}
                    {manualQuestionType === "TRUE_FALSE" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Đáp án đúng
                        </label>
                        <select
                          value={manualTrueFalseCorrectAnswer}
                          onChange={(e) =>
                            setManualTrueFalseCorrectAnswer(
                              e.target.value as "TRUE" | "FALSE",
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="TRUE">Đúng</option>
                          <option value="FALSE">Sai</option>
                        </select>
                      </div>
                    )}

                    {/* Explanation Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giải thích (không bắt buộc)
                      </label>
                      <textarea
                        rows={3}
                        value={manualExplanation}
                        onChange={(e) => setManualExplanation(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập giải thích cho câu hỏi..."
                      />
                    </div>

                    <button
                      onClick={() => {
                        // Validate required fields
                        if (!manualQuestionText.trim()) {
                          alert("Vui lòng nhập nội dung câu hỏi");
                          return;
                        }

                        if (manualQuestionType === "MULTIPLE_CHOICE") {
                          const hasEmptyOptions = manualOptions.some(
                            (option) => !option.text.trim(),
                          );
                          if (hasEmptyOptions) {
                            alert(
                              "Vui lòng nhập đầy đủ nội dung cho tất cả các lựa chọn",
                            );
                            return;
                          }
                        }

                        if (manualQuestionType === "TRUE_FALSE") {
                          if (
                            !manualTrueFalseContent.true.trim() ||
                            !manualTrueFalseContent.false.trim()
                          ) {
                            alert("Vui lòng nhập nội dung cho cả Đúng và Sai");
                            return;
                          }
                        }

                        if (manualQuestionType === "ESSAY") {
                          if (!manualEssayHint.trim()) {
                            alert(
                              "Vui lòng nhập gợi ý trả lời cho câu hỏi tự luận",
                            );
                            return;
                          }
                        }

                        // Create question object
                        const newQuestion: Question = {
                          id: Date.now().toString(),
                          createdAt: Date.now(),
                          number: questions.length + 1,
                          type: manualQuestionType,
                          questionText: manualQuestionText,
                          options:
                            manualQuestionType === "MULTIPLE_CHOICE"
                              ? manualOptions.map((option) => ({
                                  ...option,
                                  isCorrect:
                                    option.label === manualCorrectAnswer,
                                }))
                              : manualQuestionType === "TRUE_FALSE"
                                ? [
                                    {
                                      id: "1",
                                      label: "A",
                                      text: manualTrueFalseContent.true,
                                      isCorrect:
                                        manualTrueFalseCorrectAnswer === "TRUE",
                                    },
                                    {
                                      id: "2",
                                      label: "B",
                                      text: manualTrueFalseContent.false,
                                      isCorrect:
                                        manualTrueFalseCorrectAnswer ===
                                        "FALSE",
                                    },
                                  ]
                                : [],
                          difficulty: manualDifficulty,
                          explanation: manualExplanation || undefined,
                        };

                        handleAddQuestion(newQuestion);

                        // Reset form
                        setManualQuestionText("");
                        setManualOptions([
                          { id: "1", label: "A", text: "", isCorrect: false },
                          { id: "2", label: "B", text: "", isCorrect: false },
                          { id: "3", label: "C", text: "", isCorrect: false },
                          { id: "4", label: "D", text: "", isCorrect: false },
                        ]);
                        setManualCorrectAnswer("A");
                        setManualTrueFalseContent({ true: "", false: "" });
                        setManualEssayHint("");
                        setManualExplanation("");
                      }}
                      className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Thêm câu hỏi
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "ai" && (
                <div>
                  <QuizGeneratorForm
                    onGenerate={async (data) => {
                      setIsGenerating(true);
                      try {
                        // Call the new AI generation API
                        const formData = new FormData();
                        formData.append("textPrompt", data.topic || "");
                        formData.append(
                          "questionCount",
                          data.questionCount.toString(),
                        );
                        formData.append("difficulty", data.difficulty);
                        formData.append("subject", data.subject || "");

                        if (data.file) {
                          formData.append("file", data.file);
                        }

                        const supabase = await getSupabaseBrowserClient();
                        const {
                          data: { session },
                        } = await supabase.auth.getSession();

                        // Ensure we have a valid session and access token
                        if (!session || !session.access_token) {
                          alert(
                            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
                          );
                          return;
                        }

                        const response = await fetch(
                          "/api/generate-questions",
                          {
                            method: "POST",
                            body: formData,
                            headers: {
                              Authorization: `Bearer ${session.access_token}`,
                            },
                          },
                        );

                        const result = await response.json();

                        if (!response.ok) {
                          throw new Error(
                            result.error || "Failed to generate questions",
                          );
                        }

                        if (result.questions && result.questions.length > 0) {
                          // Transform AI-generated questions to match the expected format
                          const transformedQuestions = result.questions.map(
                            (
                              q: {
                                type: string;
                                questionText: string;
                                options: QuestionOption[];
                                difficulty: string;
                                explanation?: string;
                              },
                              index: number,
                            ) => ({
                              id: crypto.randomUUID(), // Generate proper UUID
                              createdAt: Date.now(),
                              number: questions.length + index + 1,
                              type: q.type,
                              questionText: q.questionText,
                              options: q.options || [],
                              difficulty: q.difficulty,
                              topic: data.topic || "AI Generated",
                              explanation: q.explanation || "",
                            }),
                          );

                          transformedQuestions.forEach((q: Question) =>
                            handleAddQuestion(q),
                          );

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
          </div>
        </div>

        {/* Row 2: Question Points Grid (Left) and Preview (Right) */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Question Points Grid */}
          <div className="bg-white rounded-2xl p-8 shadow-md lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Điểm số câu hỏi
                  </h2>
                  <p className="text-gray-600">
                    Thiết lập điểm cho từng câu hỏi
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">
                  {questions.length}
                </span>
                <p className="text-sm text-gray-600">câu hỏi</p>
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
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">Chưa có câu hỏi nào</div>
                <p className="text-sm text-gray-400">
                  Hãy thêm câu hỏi để thiết lập điểm số
                </p>
              </div>
            )}
          </div>

          {/* Paginated Question Preview */}
          <div className="bg-white rounded-2xl p-8 shadow-md lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Xem trước câu hỏi
                  </h2>
                  <p className="text-gray-600">Xem chi tiết từng câu hỏi</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">
                  {questions.length > 0 ? currentQuestionIndex + 1 : 0}
                </span>
                <p className="text-sm text-gray-600">câu hỏi hiện tại</p>
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
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">Chưa có câu hỏi nào</div>
                <p className="text-sm text-gray-400">
                  Hãy thêm câu hỏi để xem trước
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end gap-4">
        <button
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="px-8 py-4 bg-gray-500 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isSaving ? "Đang lưu..." : "Lưu nháp"}
        </button>
        <button
          onClick={handleSaveTest}
          disabled={isSaving}
          className="px-8 py-4 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isSaving ? "Đang lưu..." : "Lưu bài kiểm tra"}
        </button>
      </div>
    </div>
  );
}
