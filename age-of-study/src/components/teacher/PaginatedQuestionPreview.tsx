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
  Check,
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
      <div className="bg-[#fffdf8] border-2 border-black rounded-xl p-8 shadow-[4px_4px_0_0_rgba(0,0,0,1)] mt-4">
        <div className="text-center py-12 border-4 border-dashed border-gray-300 rounded-xl bg-gray-50/50 cursor-not-allowed">
          <div className="text-2xl font-black text-gray-500 mb-4 font-handwritten">Chưa có câu hỏi nào</div>
          <p className="text-lg font-bold text-gray-400">Hãy thêm câu hỏi từ kho hoặc tạo mới bằng AI để xem trước</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fffdf8] border-2 border-black rounded-xl p-8 shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative mt-4">
      {/* Decorative tape */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-green-200/50 -translate-y-2.5 rotate-[-2deg] border border-green-300"></div>

      <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-dashed border-gray-300">
        <div>
          <h3 className="text-3xl font-black text-gray-900 font-handwritten tracking-tight">
            Nội dung chi tiết
          </h3>
          <p className="text-lg font-bold text-gray-600 font-handwritten mt-1">
            Câu hỏi {currentQuestionIndex + 1} / {totalQuestions}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="text-right flex items-center gap-2 bg-blue-50 px-3 py-1 border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <span className="text-2xl font-black text-blue-700 font-handwritten">
              {getPointsForQuestion(currentQuestion.id)}
            </span>
            <span className="text-sm font-bold text-gray-800 uppercase">pts</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black text-black font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              {showCorrectAnswers ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Ẩn đáp án</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Hiện đáp án</span>
                </>
              )}
            </button>
            {onQuestionEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 border-2 border-black text-yellow-900 font-bold rounded-lg hover:bg-yellow-200 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Sửa</span>
              </button>
            )}
            {onQuestionDelete && (
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Bạn có chắc chắn muốn xóa câu hỏi này khỏi bài kiểm tra?",
                    )
                  ) {
                    onQuestionDelete(currentQuestion.id);
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 border-2 border-black text-red-900 font-bold rounded-lg hover:bg-red-200 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Xóa</span>
              </button>
            )}
          </div>

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
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-[linear-gradient(transparent_95%,#e0f2fe_95%)] bg-[length:100%_2rem] border-2 border-black rounded-xl p-8 mb-8 relative shadow-inner">
        {/* Margin line */}
        <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-red-300"></div>
        
        <div className="pl-10 relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-[#ffde59] border-2 border-black text-black text-lg font-black px-4 py-1 rounded-full shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase tracking-tight">
                  Câu {currentQuestion.number}
                </span>
                <span
                  className={`border-2 border-black px-3 py-1 rounded-full text-sm font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${
                    currentQuestion.difficulty === "Easy"
                      ? "bg-green-200 text-green-900"
                      : currentQuestion.difficulty === "Medium"
                        ? "bg-yellow-200 text-yellow-900"
                        : "bg-red-200 text-red-900"
                  }`}
                >
                  {currentQuestion.difficulty === "Easy" ? "Dễ" : currentQuestion.difficulty === "Medium" ? "Trung bình" : "Khó"}
                </span>
                <span className="bg-purple-200 border-2 border-black text-purple-900 text-sm font-bold px-3 py-1 rounded-full shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  {currentQuestion.type === "MULTIPLE_CHOICE"
                    ? "Trắc nghiệm"
                    : currentQuestion.type === "TRUE_FALSE"
                      ? "Đúng/Sai"
                      : "Tự luận"}
                </span>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
                {currentQuestion.questionText}
              </h4>
            </div>
          </div>

          {/* Options */}
          {currentQuestion.type === "MULTIPLE_CHOICE" && (
            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={`option-${currentQuestion.id}-${option.id}-${index}`}
                  className={`p-4 rounded-xl border-2 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex gap-4 items-center ${
                    showCorrectAnswers && option.isCorrect
                      ? "border-green-600 bg-green-50 ring-2 ring-green-600 ring-offset-2"
                      : "border-black bg-white hover:border-blue-500 hover:bg-blue-50"
                  }`}
                >
                  <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border-2 font-black text-lg ${
                    showCorrectAnswers && option.isCorrect ? "bg-green-500 text-white border-green-700" : "bg-gray-100 text-gray-800 border-black"
                  }`}>
                    {option.label}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">{option.text}</span>
                    {showCorrectAnswers && option.isCorrect && (
                      <div className="flex items-center gap-2 text-green-700 font-black uppercase text-sm bg-green-200 border-2 border-green-700 px-3 py-1 rounded-full px-2">
                        <Check className="w-4 h-4" />
                        Đúng
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* True/False */}
          {currentQuestion.type === "TRUE_FALSE" && (
            <div className="space-y-4">
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={`p-4 rounded-xl border-2 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex gap-4 items-center ${
                    showCorrectAnswers && option.isCorrect
                      ? "border-green-600 bg-green-50 ring-2 ring-green-600 ring-offset-2"
                      : "border-black bg-white hover:border-blue-500 hover:bg-blue-50"
                  }`}
                >
                  <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border-2 font-black text-lg ${
                    showCorrectAnswers && option.isCorrect ? "bg-green-500 text-white border-green-700" : "bg-gray-100 text-gray-800 border-black"
                  }`}>
                    {option.label}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">{option.text}</span>
                    {showCorrectAnswers && option.isCorrect && (
                      <div className="flex items-center gap-2 text-green-700 font-black uppercase text-sm bg-green-200 border-2 border-green-700 px-3 py-1 rounded-full px-2">
                        <Check className="w-4 h-4" />
                        Đúng
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Essay */}
          {currentQuestion.type === "ESSAY" && (
            <div className="space-y-6">
              {showCorrectAnswers && (
                <div className="p-6 rounded-xl border-2 border-black bg-yellow-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)] relative">
                  <div className="absolute top-0 right-4 -translate-y-1/2 bg-yellow-400 border-2 border-black font-black uppercase px-3 py-1 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] rotate-[2deg]">Gợi ý đáp án</div>
                  <p className="text-xl font-medium text-gray-800">
                    {currentQuestion.options[0]?.text || "Chưa có gợi ý trả lời"}
                  </p>
                </div>
              )}
              <div className="p-6 rounded-xl border-4 border-dashed border-gray-400 bg-white min-h-[200px] flex items-center justify-center">
                 <span className="text-2xl font-black font-handwritten text-gray-400">Khu vực trả lời của học sinh</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t-2 border-dashed border-gray-300">
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-4 md:pb-0 custom-scrollbar">
          <span className="font-bold text-gray-700 whitespace-nowrap hidden lg:inline">Chuyển đến:</span>
          <div className="flex gap-2 min-w-max">
            {questions.map((q, index) => (
              <button
                key={`question-nav-${q.id}`}
                onClick={() => onQuestionChange(index)}
                className={`w-10 h-10 rounded-lg border-2 font-black flex items-center justify-center transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${
                  currentQuestionIndex === index
                    ? "bg-[#ffde59] border-black text-black scale-110 -translate-y-1"
                    : "bg-white border-black text-gray-600 hover:bg-gray-100"
                }`}
              >
                {q.number}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black text-black font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Trước</span>
          </button>
          <button
            onClick={handleNext}
            disabled={currentQuestionIndex === totalQuestions - 1}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black text-black font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50"
          >
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
