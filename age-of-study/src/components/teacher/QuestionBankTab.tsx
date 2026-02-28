import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Check,
  Clock,
  Book,
  Edit3,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Question,
  QuestionType,
  DifficultyLevel,
  QuestionDifficulty,
} from "@/types/teacher";
import {
  QuestionBankQuestion,
  EditQuestionData,
} from "@/lib/questionBankService";
import { questionBankService } from "@/lib/questionBankService";
import Loading from "../ui/loading";
import { QuestionEditor } from "./QuestionEditor";

interface QuestionBankTabProps {
  onAddQuestions: (questions: Question[]) => void;
  selectedSubjectId?: string;
  selectedNodeId?: string;
  existingQuestionIds?: Set<string>;
}

export function QuestionBankTab({
  onAddQuestions,
  selectedSubjectId,
  selectedNodeId,
  existingQuestionIds,
}: QuestionBankTabProps) {
  const [questions, setQuestions] = useState<QuestionBankQuestion[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [nodes, setNodes] = useState<{ id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    subjectId: selectedSubjectId || "0",
    nodeId: selectedNodeId || "0",
    difficulty: "0" as DifficultyLevel | "0",
    type: "0" as QuestionType | "0",
    search: "",
  });

  // Selection state
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(
    new Set(),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const questionsPerPage = 10;
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Load subjects and initial questions
  useEffect(() => {
    loadSubjects();
    loadQuestions();
  }, []);

  // Load subjects
  const loadSubjects = async () => {
    setIsLoadingSubjects(true);
    try {
      const subjectList = await questionBankService.getSubjects();
      setSubjects(subjectList);
    } catch (error) {
      console.error("Failed to load subjects:", error);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  // Load nodes when subject changes
  useEffect(() => {
    if (filters.subjectId && filters.subjectId !== "0") {
      loadNodes(filters.subjectId);
    } else {
      setNodes([]);
    }
  }, [filters.subjectId]);

  const loadNodes = async (subjectId: string) => {
    setIsLoadingNodes(true);
    try {
      const nodeList = await questionBankService.getNodesBySubject(subjectId);
      setNodes(nodeList);
    } catch (error) {
      console.error("Failed to load nodes:", error);
    } finally {
      setIsLoadingNodes(false);
    }
  };

  // Load questions based on filters
  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const filter: {
        subjectId?: string;
        nodeId?: string;
        difficulty?: DifficultyLevel;
        type?: QuestionType;
        search?: string;
        limit?: number;
        offset?: number;
      } = {
        subjectId: filters.subjectId !== "0" ? filters.subjectId : undefined,
        nodeId: filters.nodeId !== "0" ? filters.nodeId : undefined,
        difficulty: filters.difficulty !== "0" ? filters.difficulty : undefined,
        type: filters.type !== "0" ? filters.type : undefined,
        search: filters.search || undefined,
        limit: questionsPerPage,
        offset: (currentPage - 1) * questionsPerPage,
      };

      const [questionList, count] = await Promise.all([
        questionBankService.getQuestions(filter),
        questionBankService.getQuestionCount(filter),
      ]);

      setQuestions(questionList);
      setTotalQuestions(count);
    } catch (error) {
      console.error("Failed to load questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload questions when filters change
  useEffect(() => {
    setCurrentPage(1);
    loadQuestions();
  }, [filters]);

  // Reload questions when page changes
  useEffect(() => {
    loadQuestions();
  }, [currentPage]);

  const handleFilterChange = (
    key: string,
    value: string | DifficultyLevel | QuestionType,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleAddSelectedQuestions = () => {
    const selectedQuestions = questions.filter(
      (q) => selectedQuestionIds.has(q.id) && !existingQuestionIds?.has(q.id),
    );
    if (selectedQuestions.length === 0) {
      alert("Vui lòng chọn ít nhất một câu hỏi chưa có trong bài kiểm tra");
      return;
    }

    // Transform questions to match the expected format for PaginatedQuestionPreview
    const transformedQuestions = selectedQuestions.map((q, index) => ({
      id: q.id,
      createdAt: q.createdAt,
      number: 0, // Will be set when added to test
      type: q.type,
      questionText: q.questionText,
      options: q.options.map((opt, idx) => ({
        id: opt.id,
        label: opt.label,
        text:
          typeof opt.text === "string"
            ? opt.text
            : (opt.text as { text?: string })?.text || "",
        isCorrect: idx === 0, // Default first option as correct
      })),
      difficulty: q.difficulty,
      points: 10, // Default points
      explanation: q.explanation || "",
      model_answer: q.model_answer || "",
    }));

    onAddQuestions(transformedQuestions);
    setSelectedQuestionIds(new Set());
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này khỏi kho?")) {
      return;
    }

    const success = await questionBankService.deleteQuestion(questionId);
    if (success) {
      alert("Xóa câu hỏi thành công!");
      loadQuestions(); // Reload questions to update the list
    } else {
      alert("Xóa câu hỏi thất bại. Vui lòng thử lại.");
    }
  };

  const handleEditQuestion = (question: QuestionBankQuestion) => {
    // Transform question to match Question type for QuestionEditor
    // Keep the original ID (numeric for bank questions, UUID for new questions)
    const transformedQuestion: Question = {
      id: question.id, // Keep original ID to preserve bank question identification
      createdAt: question.createdAt,
      number: 0, // Will be set when added to test
      type: question.type,
      questionText: question.questionText,
      options: question.options.map((opt, idx) => ({
        id: opt.id,
        label: opt.label,
        text:
          typeof opt.text === "string"
            ? opt.text
            : (opt.text as { text?: string })?.text || "",
        isCorrect: idx === 0, // Default first option as correct
      })),
      difficulty: question.difficulty,
      points: 10, // Default points
      explanation: question.explanation || "",
      model_answer: question.model_answer || "",
    };
    setEditingQuestion(transformedQuestion);
  };

  const handleSaveEdit = async (updatedQuestion: Question) => {
    if (!updatedQuestion) return;

    // This is a question from the bank, update it in the question bank
    const editData: EditQuestionData = {
      questionText: updatedQuestion.questionText,
      options: updatedQuestion.options,
      difficulty: updatedQuestion.difficulty,
      explanation: updatedQuestion.explanation || "",
      model_answer: updatedQuestion.model_answer || "",
    };

    const success = await questionBankService.editQuestion(
      updatedQuestion.id,
      editData,
    );
    if (success) {
      alert("Cập nhật câu hỏi thành công!");
      setEditingQuestion(null);
      loadQuestions(); // Reload questions to update the list
    } else {
      alert("Cập nhật câu hỏi thất bại. Vui lòng thử lại.");
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return <Plus className="w-4 h-4" />;
      case "TRUE_FALSE":
        return <Check className="w-4 h-4" />;
      case "ESSAY":
        return <Book className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const totalPages = Math.ceil(totalQuestions / questionsPerPage);

  // Filter out questions that already exist in the current test
  const filteredQuestions = questions.filter(
    (q) => !existingQuestionIds?.has(q.id),
  );

  return (
    <div className="space-y-8 mt-4">
      {/* Filter Section */}
      <div className="bg-[#fffdf8] border-2 border-black rounded-xl p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-red-200/50 -translate-y-3 rotate-[-1deg] border border-red-300"></div>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-gray-300">
          <Filter className="w-6 h-6 text-black" />
          <h2 className="text-3xl font-black text-gray-900 font-handwritten tracking-tight">
            Bộ lọc câu hỏi
          </h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Môn học
              </label>
              <Select
                value={filters.subjectId}
                onChange={(e) =>
                  handleFilterChange("subjectId", e.target.value)
                }
                disabled={isLoadingSubjects}
                className="w-full"
              >
                <option value="0">Tất cả môn học</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Node Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chủ đề / Bài học
              </label>
              <Select
                value={filters.nodeId}
                onChange={(e) => handleFilterChange("nodeId", e.target.value)}
                disabled={
                  isLoadingNodes ||
                  !filters.subjectId ||
                  filters.subjectId === "0"
                }
                className="w-full"
              >
                <option value="0">Tất cả bài học</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.title}
                  </option>
                ))}
              </Select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Độ khó
              </label>
              <Select
                value={filters.difficulty}
                onChange={(e) =>
                  handleFilterChange("difficulty", e.target.value)
                }
                className="w-full"
              >
                <option value="0">Tất cả độ khó</option>
                <option value="Easy">Dễ</option>
                <option value="Medium">Trung bình</option>
                <option value="Hard">Khó</option>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại câu hỏi
              </label>
              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full"
              >
                <option value="0">Tất cả loại</option>
                <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                <option value="TRUE_FALSE">Đúng/Sai</option>
                <option value="ESSAY">Tự luận</option>
              </Select>
            </div>

            {/* Search Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Tìm kiếm theo nội dung..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex justify-between items-center bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2rem] pb-2">
        <div className="text-xl font-bold font-handwritten text-gray-800">
          Đã tìm thấy <span className="text-blue-700">{totalQuestions}</span> câu hỏi
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddSelectedQuestions}
            disabled={selectedQuestionIds.size === 0}
            className="flex items-center gap-2 bg-[#ffde59] hover:bg-[#efce49] border-2 border-black text-black font-black py-2 px-4 rounded-lg transition-transform hover:-translate-y-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <Plus className="w-5 h-5" />
            Thêm{" "}
            {selectedQuestionIds.size > 0 &&
              `(${selectedQuestionIds.size})`}{" "}
            câu hỏi đã chọn
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-[#fffdf8] border-2 border-black rounded-xl p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loading />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-bold border-4 border-dashed border-gray-300 rounded-xl bg-gray-50">
              Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại
            </div>
          ) : (
            <>
              <div className="h-[600px] overflow-y-auto custom-scrollbar pr-4">
                <div className="space-y-6">
                  {filteredQuestions.map((question) => (
                    <div key={question.id} className="p-6 bg-white border-2 border-dashed border-gray-400 rounded-xl hover:border-black hover:bg-yellow-50/50 transition-colors shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative group">
                      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer bg-white border-2 border-black rounded px-2 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">
                              <input
                                type="checkbox"
                                checked={selectedQuestionIds.has(question.id)}
                                onChange={() =>
                                  handleQuestionSelection(question.id)
                                }
                                className="w-5 h-5 text-blue-600 bg-white border-2 border-black rounded focus:ring-0 cursor-pointer"
                              />
                            </label>
                            <Badge
                              variant="secondary"
                              className={`${getDifficultyColor(
                                question.difficulty,
                              )} border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold px-3 py-1`}
                            >
                              {question.difficulty}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              {getTypeIcon(question.type)}
                              {question.type === "MULTIPLE_CHOICE"
                                ? "Trắc nghiệm"
                                : question.type === "TRUE_FALSE"
                                  ? "Đúng/Sai"
                                  : "Tự luận"}
                            </Badge>
                            {question.subject_name && (
                              <Badge
                                variant="outline"
                                className="text-blue-600"
                              >
                                {question.subject_name}
                              </Badge>
                            )}
                            {question.node_title && (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-800 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold px-3 py-1"
                              >
                                {question.node_title}
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-medium text-xl text-gray-900 mb-4 font-handwritten tracking-wide leading-relaxed">
                            {question.questionText}
                          </h3>

                          {question.options && question.options.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {question.options
                                .slice(0, 4)
                                .map((option, index) => (
                                  <div
                                    key={`${question.id}-${option.id}-${index}`}
                                    className="flex items-start gap-3 p-3 bg-white border-2 border-black rounded-lg hover:bg-blue-50 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                                  >
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 border-2 border-black rounded-full flex items-center justify-center font-black">
                                      {option.label}
                                    </div>
                                    <span className="text-sm font-bold text-gray-800 leading-relaxed pt-1">
                                      {typeof option.text === "string"
                                        ? option.text
                                        : (option.text as { text?: string })
                                            ?.text || ""}
                                    </span>
                                  </div>
                                ))}
                              {question.options.length > 4 && (
                                <div className="col-span-full text-sm font-bold text-gray-600 bg-gray-100 p-3 rounded-lg border-2 border-dashed border-gray-400 text-center">
                                  +{question.options.length - 4} lựa chọn khác
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">
                            <span>
                              Ngày tạo: {question.created_at_formatted}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-row md:flex-col gap-3">
                          <button
                            onClick={() => handleEditQuestion(question)}
                            className="flex items-center justify-center gap-2 p-3 bg-blue-100 border-2 border-black text-blue-900 font-bold rounded-lg hover:bg-blue-200 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                            title="Sửa"
                          >
                            <Edit3 className="w-5 h-5" />
                            <span className="md:hidden">Sửa</span>
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="flex items-center justify-center gap-2 p-3 bg-red-100 border-2 border-black text-red-900 font-bold rounded-lg hover:bg-red-200 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                            title="Xóa"
                          >
                            <Trash2 className="w-5 h-5" />
                            <span className="md:hidden">Xóa</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 p-6 border-t-2 border-dashed border-gray-300 mt-6">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border-2 border-black text-black font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50"
                  >
                    Trước
                  </button>

                  <div className="text-xl font-black text-gray-800 bg-white border-2 border-black px-6 py-2 rounded-md shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    {currentPage} / {totalPages}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border-2 border-black text-black font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Question Editor Modal */}
      {editingQuestion && (
        <QuestionEditor
          question={editingQuestion}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
}
