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
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Bộ lọc câu hỏi
          </h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Đã tìm thấy {totalQuestions} câu hỏi
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAddSelectedQuestions}
            disabled={selectedQuestionIds.size === 0}
            className="bg-green-500 hover:bg-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm{" "}
            {selectedQuestionIds.size > 0 &&
              `(${selectedQuestionIds.size})`}{" "}
            câu hỏi đã chọn
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loading />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại
            </div>
          ) : (
            <>
              <div className="h-[500px] overflow-y-auto">
                <div className="divide-y divide-gray-200">
                  {filteredQuestions.map((question) => (
                    <div key={question.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedQuestionIds.has(question.id)}
                              onChange={() =>
                                handleQuestionSelection(question.id)
                              }
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <Badge
                              variant="secondary"
                              className={getDifficultyColor(
                                question.difficulty,
                              )}
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
                                className="text-green-600"
                              >
                                {question.node_title}
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-medium text-gray-900 mb-2">
                            {question.questionText}
                          </h3>

                          {question.options && question.options.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                              {question.options
                                .slice(0, 4)
                                .map((option, index) => (
                                  <div
                                    key={`${question.id}-${option.id}-${index}`}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 shadow-sm"
                                  >
                                    <div className="flex-shrink-0 w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
                                      <span className="text-sm font-semibold text-gray-700">
                                        {option.label}
                                      </span>
                                    </div>
                                    <span className="text-sm text-gray-700 leading-relaxed">
                                      {typeof option.text === "string"
                                        ? option.text
                                        : (option.text as { text?: string })
                                            ?.text || ""}
                                    </span>
                                  </div>
                                ))}
                              {question.options.length > 4 && (
                                <div className="col-span-full text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  +{question.options.length - 4} lựa chọn khác
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              Ngày tạo: {question.created_at_formatted}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuestion(question)}
                            className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                          >
                            <Edit3 className="w-4 h-4" />
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 p-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>

                  <div className="text-sm text-gray-600">
                    Trang {currentPage} / {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </Button>
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
