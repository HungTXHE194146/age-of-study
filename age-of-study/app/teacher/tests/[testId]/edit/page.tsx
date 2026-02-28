"use client";

import { NotebookCard, NotebookCardContent } from "@/components/ui/notebook-card";
import { NotebookButton } from "@/components/ui/notebook-card";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { TestService } from "@/lib/testService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RouteProtectedWrapper } from "@/lib/routeMiddleware";
import { TestWithQuestions } from "@/types/test";
import { Question, QuestionDifficulty, QuestionOption } from "@/types/teacher";
import { subjectService } from "@/lib/subjectService";
import { Subject } from "@/types/teacher";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { AIQuestionService } from "@/lib/aiQuestionService";
import { getTeacherClasses } from "@/lib/classService";
import {
  Save,
  Plus,
  Trash2,
  Eye,
  FileText,
  Link as LinkIcon,
  Settings,
  ArrowLeft,
  Book,
} from "lucide-react";
import { QuizGeneratorForm } from "@/components/teacher/QuizGeneratorForm";
import { QuestionBankTab } from "@/components/teacher/QuestionBankTab";
import { QuestionPointsGrid } from "@/components/teacher/QuestionPointsGrid";
import { PaginatedQuestionPreview } from "@/components/teacher/PaginatedQuestionPreview";
import Loading from "@/components/ui/loading";

// Simple UUID generator function
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface EditableQuestion {
  id?: string;
  content: {
    question: string;
    options: string[];
  };
  correct_option_index: number;
}

export default function TeacherTestEditPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const testId = params.testId as string;

  const [test, setTest] = useState<TestWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "ai" | "bank">(
    "manual",
  );
  const [testDetails, setTestDetails] = useState({
    title: "",
    description: "",
    subject: "",
    node: "",
    timeLimit: 30,
    classId: "",
  });
  const [nodes, setNodes] = useState<{ id: number; title: string }[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
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
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (testId) {
      fetchTest();
      fetchSubjects();
    }
  }, [testId]);

  useEffect(() => {
    if (user?.id) {
      loadTeacherClasses();
    }
  }, [user?.id]);

  const loadTeacherClasses = async () => {
    try {
      setIsLoadingClasses(true);
      const { data, error } = await getTeacherClasses(user!.id);
      if (error) throw error;
      const allTeacherClasses = [
        ...(data?.homeroom_classes || []),
        ...(data?.subject_classes || []),
      ];
      // Remove duplicates
      const uniqueClasses = Array.from(
        new Map(allTeacherClasses.map((c) => [c.id, c])).values(),
      );
      setTeacherClasses(uniqueClasses);
    } catch (error) {
      console.error("Failed to fetch teacher classes:", error);
    } finally {
      setIsLoadingClasses(false);
    }
  };

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

      // Initialize form state with existing test data
      setTestDetails({
        title: testWithQuestions.title,
        description: testWithQuestions.description || "",
        subject: testWithQuestions.subject_id?.toString() || "",
        node: testWithQuestions.node_id?.toString() || "",
        timeLimit: testWithQuestions.settings.time_limit || 30,
        classId: testWithQuestions.class_id?.toString() || "",
      });

      // Fetch nodes for the existing subject
      if (testWithQuestions.subject_id) {
        await fetchNodes(testWithQuestions.subject_id.toString());
      }

      // Initialize questions with points
      const mappedQuestions = testWithQuestions.questions.map((q, index) => ({
        id: q.id,
        createdAt: Date.now(),
        number: index + 1,
        type: "MULTIPLE_CHOICE" as const,
        questionText: q.content.questionText,
        options: q.content.options.map((opt, optIndex) => ({
          id: optIndex.toString(),
          label: opt.label,
          text: opt.text,
          isCorrect: optIndex === q.correct_option_index,
        })),
        difficulty: q.difficulty.toLowerCase() as QuestionDifficulty,
        topic: "Existing",
        points: q.points || 10, // Use existing points or default to 10
      }));
      setQuestions(mappedQuestions);

      // Initialize points state with existing points
      const initialPoints: { [questionId: string]: number } = {};
      testWithQuestions.questions.forEach((q) => {
        initialPoints[q.id] = q.points || 10;
      });
      setPoints(initialPoints);
    } catch (error) {
      console.error("Error fetching test:", error);
      router.push("/teacher/tests");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      setIsLoadingSubjects(true);
      const subjectList = await subjectService.getSubjects();
      setSubjects(subjectList);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const fetchNodes = async (subjectId: string) => {
    try {
      setIsLoadingNodes(true);
      const supabase = await getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("nodes")
        .select("id, title")
        .eq("subject_id", parseInt(subjectId))
        .order("title", { ascending: true });

      if (error) throw error;
      setNodes(data || []);
    } catch (error) {
      console.error("Error fetching nodes:", error);
      setNodes([]);
    } finally {
      setIsLoadingNodes(false);
    }
  };

  const handleAddQuestion = (question: Question) => {
    setQuestions((prev) => [...prev, question]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleEditQuestion = (question: Question) => {
    // Find the question index
    const questionIndex = questions.findIndex((q) => q.id === question.id);
    if (questionIndex === -1) return;

    // Update the question in the list
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === question.id ? { ...question, number: q.number } : q,
      ),
    );
  };

  const handleSaveTest = async () => {
    if (!testDetails.title.trim()) {
      alert("Vui lòng nhập tiêu đề bài kiểm tra");
      return;
    }

    if (questions.length === 0) {
      alert("Vui lòng thêm ít nhất một câu hỏi");
      return;
    }

    setSaving(true);
    try {
      const testService = new TestService();

      // Update test data in Supabase
      await testService.updateTest(testId, {
        title: testDetails.title,
        description: testDetails.description,
        type: "practice",
        subject_id: testDetails.subject ? parseInt(testDetails.subject) : null,
        node_id: testDetails.node ? parseInt(testDetails.node) : null,
        settings: {
          time_limit: testDetails.timeLimit,
          allow_retry: true,
        },
        is_published: true, // Publish status
        class_id: testDetails.classId ? parseInt(testDetails.classId) : null,
      });

      // Update questions and test_questions records
      const supabase = await getSupabaseBrowserClient();

      // Delete existing test_questions relationships
      await supabase.from("test_questions").delete().eq("test_id", testId);

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
          test_id: testId,
          question_id: q.id,
          points: questions[index].points || 10, // Use question points if available, otherwise default to 10
          display_order: index,
        }),
      );

      const { error: testQuestionsError } = await supabase
        .from("test_questions")
        .insert(testQuestionsToInsert);

      if (testQuestionsError) throw testQuestionsError;

      alert("Bài kiểm tra đã được cập nhật thành công!");
      router.push(`/teacher/tests`);
    } catch (error) {
      console.error("Error saving test:", error);
      alert("Cập nhật bài kiểm tra thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!testDetails.title.trim()) {
      alert("Vui lòng nhập tiêu đề bài kiểm tra");
      return;
    }

    if (questions.length === 0) {
      alert("Vui lòng thêm ít nhất một câu hỏi");
      return;
    }

    setSaving(true);
    try {
      const testService = new TestService();

      // Update test data in Supabase (draft version)
      await testService.updateTest(testId, {
        title: testDetails.title,
        description: testDetails.description,
        type: "practice",
        subject_id: testDetails.subject ? parseInt(testDetails.subject) : null,
        node_id: testDetails.node ? parseInt(testDetails.node) : null,
        settings: {
          time_limit: testDetails.timeLimit,
          allow_retry: true,
        },
        is_published: false, // Draft status
        class_id: testDetails.classId ? parseInt(testDetails.classId) : null,
      });

      // Update questions and test_questions records
      const supabase = await getSupabaseBrowserClient();

      // Delete existing test_questions relationships
      await supabase.from("test_questions").delete().eq("test_id", testId);

      // Update existing questions or create new ones
      const questionsToSave = questions.map((q: Question, index: number) => ({
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
        explanation: q.explanation || null,
      }));

      let insertedQuestions: { id: string }[] = [];
      try {
        // Use upsert with conflict resolution to handle both new and existing questions
        const { data, error: questionsError } = await supabase
          .from("questions")
          .upsert(questionsToSave, { onConflict: "id" })
          .select();

        if (questionsError) {
          console.error("Error upserting questions:", questionsError);
          throw questionsError;
        }

        insertedQuestions = data || [];
      } catch (error) {
        console.error("Error saving questions:", error);
        throw error;
      }

      // Insert test_questions relationships - Consistency check: use state questions' IDs
      const testQuestionsToInsert = questions.map(
        (q: Question, index: number) => ({
          test_id: testId,
          question_id: q.id,
          points: points[q.id] || 10,
          display_order: index,
        }),
      );

      const { error: testQuestionsError } = await supabase
        .from("test_questions")
        .insert(testQuestionsToInsert);

      if (testQuestionsError) throw testQuestionsError;

      alert("Bài kiểm tra đã được lưu nháp thành công!");
      router.push(`/teacher/tests`); // Changed to list after draft save like creation page
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Lưu nháp bài kiểm tra thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewTest = () => {
    router.push(`/teacher/tests/${testId}`);
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
      <div className="mb-8 border-b-4 border-dashed border-gray-300 pb-4">
        <button
          className="flex items-center gap-2 text-gray-700 font-bold hover:text-black mb-4 bg-white border-2 border-black rounded-md px-3 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
        <h1 className="text-5xl font-black text-gray-900 mb-2 font-handwritten tracking-tight drop-shadow-sm">
          Chỉnh Sửa Bài Kiểm Tra
        </h1>
        <p className="text-xl text-gray-700 font-bold italic">
          Cập nhật chi tiết bài kiểm tra và câu hỏi
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
                    <p className="text-gray-700 font-bold text-sm">Cập nhật các thông số cơ bản</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                      Tiêu đề bài kiểm tra <span className="text-red-500">*</span>
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
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5"
                      placeholder="Nhập tiêu đề bài kiểm tra..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
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
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 border-dashed"
                      placeholder="Mô tả ngắn về bài kiểm tra..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
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
                          await fetchNodes(selectedSubjectId);
                        } else {
                          setNodes([]);
                        }
                      }}
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 appearance-none cursor-pointer"
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
                    <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                      Gán cho lớp học
                    </label>
                    <select
                      value={testDetails.classId}
                      onChange={(e) =>
                        setTestDetails((prev) => ({
                          ...prev,
                          classId: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 appearance-none cursor-pointer"
                    >
                      <option value="">Không gán cho lớp (Chung)</option>
                      {isLoadingClasses ? (
                        <option disabled>Đang tải danh sách lớp...</option>
                      ) : (
                        teacherClasses.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            Lớp {cls.name} ({cls.school_year})
                          </option>
                        ))
                      )}
                    </select>
                    <p className="mt-2 text-sm text-gray-600 italic">
                      Lưu ý: Nếu gán cho lớp, chỉ học sinh lớp đó mới thấy bài kiểm tra này.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
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
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none cursor-pointer"
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
                    <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
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
                      className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5"
                    />
                  </div>
                </div>
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
                      <p className="text-gray-700 font-bold text-sm">Thêm, chỉnh sửa và quản lý câu hỏi</p>
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

                {/* Tab Content */}
                <div className="space-y-6">
                  {activeTab === "manual" && (
                    <div className="space-y-4">
                      <div className="bg-yellow-100/50 border-2 border-dashed border-gray-300 p-4 rounded-lg shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-1 uppercase text-sm">
                          Tạo câu hỏi thủ công
                        </h3>
                        <p className="text-sm font-bold text-gray-600">
                          Nhập thông tin câu hỏi và các lựa chọn trả lời
                        </p>
                      </div>

                      <div className="grid gap-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                            Nội dung câu hỏi
                          </label>
                          <textarea
                            rows={3}
                            value={manualQuestionText}
                            onChange={(e) => setManualQuestionText(e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 border-dashed"
                            placeholder="Nhập nội dung câu hỏi..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
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
                              className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer"
                            >
                              <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                              <option value="TRUE_FALSE">Đúng/Sai</option>
                              <option value="ESSAY">Tự luận</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                              Độ khó
                            </label>
                            <select
                              value={manualDifficulty}
                              onChange={(e) =>
                                setManualDifficulty(
                                  e.target.value as "Easy" | "Medium" | "Hard",
                                )
                              }
                              className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer"
                            >
                              <option value="Easy">Dễ</option>
                              <option value="Medium">Trung bình</option>
                              <option value="Hard">Khó</option>
                            </select>
                          </div>
                        </div>

                        {/* Multiple Choice Options */}
                        {manualQuestionType === "MULTIPLE_CHOICE" && (
                          <div className="space-y-4 bg-gray-50 border-2 border-black rounded-lg p-4 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-black text-gray-900 uppercase">
                                Lựa chọn trả lời
                              </h4>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (manualOptions.length > 3) {
                                      setManualOptions((prev) => prev.slice(0, -1));
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
                                  className="px-3 py-1 font-bold text-sm bg-red-100 border-2 border-black text-red-900 rounded-md hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5"
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
                                  className="px-3 py-1 font-bold text-sm bg-green-100 border-2 border-black text-green-900 rounded-md hover:bg-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5"
                                >
                                  + Thêm
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {manualOptions.map((option, index) => (
                                <div key={option.id} className="space-y-2">
                                  <label className="block text-sm font-bold text-gray-800 uppercase">
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
                                    className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5"
                                    placeholder={`Nhập lựa chọn ${option.label}...`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* True/False Options */}
                        {manualQuestionType === "TRUE_FALSE" && (
                          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            <div>
                              <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
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
                                className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5"
                                placeholder="Nhập nội dung cho Đúng..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
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
                                className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5"
                                placeholder="Nhập nội dung cho Sai..."
                              />
                            </div>
                          </div>
                        )}

                        {/* Essay Question */}
                        {manualQuestionType === "ESSAY" && (
                          <div className="p-4 bg-gray-50 border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                              Gợi ý trả lời
                            </label>
                            <textarea
                              rows={4}
                              value={manualEssayHint}
                              onChange={(e) => setManualEssayHint(e.target.value)}
                              className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 border-dashed"
                              placeholder="Nhập gợi ý trả lời hoặc hướng dẫn chấm điểm..."
                            />
                          </div>
                        )}

                        {/* Answers Setup Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Multiple Choice Answer */}
                          {manualQuestionType === "MULTIPLE_CHOICE" && (
                            <div>
                              <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                                Đáp án đúng
                              </label>
                              <select
                                value={manualCorrectAnswer}
                                onChange={(e) =>
                                  setManualCorrectAnswer(e.target.value)
                                }
                                className="w-full px-4 py-3 bg-blue-50 border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer"
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
                              <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                                Đáp án đúng
                              </label>
                              <select
                                value={manualTrueFalseCorrectAnswer}
                                onChange={(e) =>
                                  setManualTrueFalseCorrectAnswer(
                                    e.target.value as "TRUE" | "FALSE",
                                  )
                                }
                                className="w-full px-4 py-3 bg-blue-50 border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer"
                              >
                                <option value="TRUE">Đúng</option>
                                <option value="FALSE">Sai</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Explanation Field */}
                        <div>
                          <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                            Giải thích <span className="text-gray-500 font-normal normal-case">(không bắt buộc)</span>
                          </label>
                          <textarea
                            rows={3}
                            value={manualExplanation}
                            onChange={(e) => setManualExplanation(e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 border-dashed"
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
                              id: generateUUID(),
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
                              difficulty:
                                manualDifficulty.toLowerCase() as QuestionDifficulty,
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
                          className="w-full px-4 py-3 bg-green-400 text-green-950 font-black border-2 border-black rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:bg-green-300 transition-all uppercase tracking-wide flex justify-center mt-4"
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
                          try {
                            const aiQuestionService = new AIQuestionService();
                            const result =
                              await aiQuestionService.generateQuestions({
                                textPrompt: data.topic || "",
                                questionCount: data.questionCount,
                                difficulty: data.difficulty,
                                subject: data.subject || "",
                                file: data.file || null,
                              });

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
                                      id?: string;
                                    }[];
                                    difficulty: string;
                                    explanation?: string;
                                  },
                                  index: number,
                                ) => ({
                                  id: generateUUID(),
                                  createdAt: Date.now(),
                                  number: questions.length + index + 1,
                                  type: q.type as
                                    | "MULTIPLE_CHOICE"
                                    | "TRUE_FALSE"
                                    | "ESSAY",
                                  questionText: q.questionText,
                                  options: (q.options || []).map((opt, idx) => ({
                                    id: opt.id || idx.toString(),
                                    label: opt.label,
                                    text: opt.text,
                                    isCorrect: opt.isCorrect,
                                  })),
                                  difficulty: q.difficulty as QuestionDifficulty,
                                  topic: data.topic || "AI Generated",
                                  explanation: q.explanation || "",
                                }),
                              );

                              transformedQuestions.forEach((q) =>
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
                          }
                        }}
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
                    onQuestionEdit={handleEditQuestion}
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
