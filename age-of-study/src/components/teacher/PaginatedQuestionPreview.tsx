"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
} from "lucide-react";
import { Question } from "@/types/teacher";
import { QuestionEditor } from "./QuestionEditor";

interface PaginatedQuestionPreviewProps {
  questions: Question[];
  currentQuestionIndex: number;
  onQuestionChange: (index: number) => void;
  onQuestionDelete?: (questionId: string) => void;
  onQuestionEdit?: (question: Question) => void;
  points: { [questionId: string]: number };
  showAnswers?: boolean;
}

export function PaginatedQuestionPreview({
  questions,
  currentQuestionIndex,
  onQuestionChange,
  onQuestionDelete,
  onQuestionEdit,
  points,
  showAnswers = true,
}: PaginatedQuestionPreviewProps) {
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      onQuestionChange(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      onQuestionChange(currentQuestionIndex - 1);
    }
  };

  const getPointsForQuestion = (questionId: string) => {
    return points[questionId] || 10;
  };

  if (!currentQuestion) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-md">
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">Chưa có câu hỏi nào</div>
          <p className="text-sm text-gray-400">Hãy thêm câu hỏi để xem trước</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-600">
            Câu hỏi {currentQuestionIndex + 1} / {totalQuestions}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {getPointsForQuestion(currentQuestion.id)} pts
            </div>
            <p className="text-sm text-gray-600">cho câu hỏi này</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
            className="flex items-center gap-2"
          >
            {showCorrectAnswers ? (
              <>
                <EyeOff className="w-4 h-4" />
                Ẩn đáp án
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Hiện đáp án
              </>
            )}
          </Button>
          {onQuestionEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
            >
              <Edit3 className="w-4 h-4" />
              Sửa câu hỏi
            </Button>
          )}

          {isEditing && (
            <QuestionEditor
              question={currentQuestion}
              onSave={(updatedQuestion) => {
                onQuestionEdit?.(updatedQuestion);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          )}
          {onQuestionDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (
                  confirm(
                    "Bạn có chắc chắn muốn xóa câu hỏi này khỏi bài kiểm tra?",
                  )
                ) {
                  onQuestionDelete(currentQuestion.id);
                }
              }}
              className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Xóa câu hỏi
            </Button>
          )}
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                Câu {currentQuestion.number}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentQuestion.difficulty === "Easy"
                    ? "bg-green-100 text-green-800"
                    : currentQuestion.difficulty === "Medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {currentQuestion.difficulty}
              </span>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                {currentQuestion.type === "MULTIPLE_CHOICE"
                  ? "Trắc nghiệm"
                  : currentQuestion.type === "TRUE_FALSE"
                    ? "Đúng/Sai"
                    : "Tự luận"}
              </span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              {currentQuestion.questionText}
            </h4>
          </div>
        </div>

        {/* Options */}
        {currentQuestion.type === "MULTIPLE_CHOICE" && (
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div
                key={`option-${currentQuestion.id}-${option.id}-${index}`}
                className={`p-4 rounded-lg border-2 transition-all ${
                  showCorrectAnswers && option.isCorrect
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-600 w-8">
                      {option.label}.
                    </span>
                    <span className="text-gray-900">{option.text}</span>
                  </div>
                  {showCorrectAnswers && option.isCorrect && (
                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Đáp án đúng
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* True/False */}
        {currentQuestion.type === "TRUE_FALSE" && (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <div
                key={option.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  showCorrectAnswers && option.isCorrect
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-600 w-8">
                      {option.label}.
                    </span>
                    <span className="text-gray-900">{option.text}</span>
                  </div>
                  {showCorrectAnswers && option.isCorrect && (
                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Đáp án đúng
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Essay */}
        {currentQuestion.type === "ESSAY" && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border-2 border-gray-200 bg-white">
              <h5 className="font-semibold text-gray-900 mb-2">
                Gợi ý trả lời:
              </h5>
              <p className="text-gray-700">
                {currentQuestion.options[0]?.text || "Chưa có gợi ý trả lời"}
              </p>
            </div>
            <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <h5 className="font-semibold text-gray-900 mb-2">
                Khu vực trả lời:
              </h5>
              <div className="h-32 bg-white rounded border-2 border-gray-200"></div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Câu trước
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentQuestionIndex === totalQuestions - 1}
            className="flex items-center gap-2"
          >
            Câu sau
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Question Index Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Chuyển đến:</span>
          <div className="flex gap-1">
            {questions.map((q, index) => (
              <Button
                key={`question-nav-${q.id}`}
                variant={
                  currentQuestionIndex === index ? "secondary" : "outline"
                }
                size="sm"
                onClick={() => onQuestionChange(index)}
                className={`w-8 h-8 p-0 ${
                  currentQuestionIndex === index
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {q.number}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
