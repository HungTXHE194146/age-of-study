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
  RefreshCw,
} from "lucide-react";
import { Question } from "@/types/teacher";
import { QuestionEditor } from "./QuestionEditor";
import Loading from "@/components/ui/loading";
import { motion, AnimatePresence } from "framer-motion";
import WordOrderingRenderer from "../student/QuestionRenderers/WordOrderingRenderer";
import MatchingRenderer from "../student/QuestionRenderers/MatchingRenderer";
import FillInBlanksRenderer from "../student/QuestionRenderers/FillInBlanksRenderer";
import CategorizationRenderer from "../student/QuestionRenderers/CategorizationRenderer";
import FindErrorRenderer from "../student/QuestionRenderers/FindErrorRenderer";
import confetti from "canvas-confetti";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

interface PaginatedQuestionPreviewProps {
  questions: Question[];
  currentQuestionIndex: number;
  onQuestionChange: (index: number) => void;
  onQuestionDelete?: (questionId: string) => void;
  onQuestionEdit?: (question: Question) => void;
  onQuestionReplace?: (questionId: string) => void;
  points: { [questionId: string]: number };
  showAnswers?: boolean;
  isReplacing?: boolean;
}

export function PaginatedQuestionPreview({
  questions,
  currentQuestionIndex,
  onQuestionChange,
  onQuestionDelete,
  onQuestionEdit,
  onQuestionReplace,
  points,
  showAnswers = true,
  isReplacing = false,
}: PaginatedQuestionPreviewProps) {
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);
  const [interactionKey, setInteractionKey] = useState(0); // Dùng để reset renderer khi chuyển câu

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      onQuestionChange(currentQuestionIndex + 1);
      setFeedback(null);
      setInteractionKey((prev) => prev + 1);
      setShowCorrectAnswers(false);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      onQuestionChange(currentQuestionIndex - 1);
      setFeedback(null);
      setInteractionKey((prev) => prev + 1);
      setShowCorrectAnswers(false);
    }
  };

  const getPointsForQuestion = (questionId: string) => {
    return points[questionId] || 10;
  };

  if (!currentQuestion) {
    return (
      <div className="bg-[#fffdf8] border-2 border-black rounded-xl p-8 shadow-[4px_4px_0_0_rgba(0,0,0,1)] mt-4">
        <div className="text-center py-12 border-4 border-dashed border-gray-300 rounded-xl bg-gray-50/50 cursor-not-allowed">
          <div className="text-2xl font-black text-gray-500 mb-4 font-handwritten">
            Chưa có câu hỏi nào
          </div>
          <p className="text-lg font-bold text-gray-400">
            Hãy thêm câu hỏi từ kho hoặc tạo mới bằng AI để xem trước
          </p>
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
            <span className="text-sm font-bold text-gray-800 uppercase">
              pts
            </span>
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
            {onQuestionReplace && (
              <button
                onClick={() => onQuestionReplace(currentQuestion.id)}
                disabled={isReplacing}
                className={`flex items-center gap-2 px-3 py-1.5 bg-blue-100 border-2 border-black text-blue-900 font-bold rounded-lg hover:bg-blue-200 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50`}
                title="AI sẽ đổi sang câu hỏi khác cùng dạng"
              >
                {isReplacing ? (
                  <Loading size="sm" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Đổi câu</span>
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
                  {currentQuestion.difficulty === "Easy"
                    ? "Dễ"
                    : currentQuestion.difficulty === "Medium"
                      ? "Trung bình"
                      : "Khó"}
                </span>
                <span className="bg-purple-200 border-2 border-black text-purple-900 text-sm font-bold px-4 py-1 rounded-full shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  {currentQuestion.type === "MULTIPLE_CHOICE"
                    ? "Chọn đáp án đúng nhất"
                    : currentQuestion.type === "TRUE_FALSE"
                      ? "Chọn Đúng hoặc Sai"
                      : currentQuestion.type === "WORD_ORDERING"
                        ? "Sắp xếp các từ thành câu"
                        : currentQuestion.type === "MATCHING"
                          ? "Nối các cặp tương ứng"
                          : currentQuestion.type === "FILL_IN_BLANKS"
                            ? "Điền từ vào chỗ trống"
                            : currentQuestion.type === "CATEGORIZATION"
                              ? "Phân loại các từ vào nhóm"
                              : currentQuestion.type === "FIND_ERROR"
                                ? "Tìm và nhấn vào lỗi sai trong câu"
                                : "Viết câu trả lời của em"}
                </span>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
                {currentQuestion.questionText}
              </h4>
              {currentQuestion.hint && (
                <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-start gap-3">
                  <div className="text-xl">💡</div>
                  <div>
                    <p className="text-xs font-black text-blue-700 uppercase tracking-wider mb-1">
                      Gợi ý cho học sinh:
                    </p>
                    <p className="text-sm font-bold text-blue-800 italic">
                      {currentQuestion.hint}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          {currentQuestion.type === "MULTIPLE_CHOICE" && (
            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={`option-${currentQuestion.id}-${option.id}-${index}`}
                  disabled={feedback?.isCorrect}
                  onClick={() => {
                    if (option.isCorrect) {
                      setFeedback({
                        isCorrect: true,
                        message: "Tuyệt vời! Hiệp sĩ đã chọn đúng đáp án rồi!",
                      });
                      confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                      });
                    } else {
                      setFeedback({
                        isCorrect: false,
                        message:
                          "Ối, chưa chính xác rồi. Hiệp sĩ thử lại xem sao nhé!",
                      });
                    }
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex gap-4 items-center text-left ${
                    showCorrectAnswers && option.isCorrect
                      ? "border-green-600 bg-green-50 ring-2 ring-green-600 ring-offset-2"
                      : feedback?.isCorrect === false &&
                          !option.isCorrect &&
                          !showCorrectAnswers
                        ? "border-red-400 bg-red-50"
                        : "border-black bg-white hover:border-blue-500 hover:bg-blue-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border-2 font-black text-lg ${
                      showCorrectAnswers && option.isCorrect
                        ? "bg-green-500 text-white border-green-700"
                        : "bg-gray-100 text-gray-800 border-black"
                    }`}
                  >
                    {option.label}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">
                      {option.text}
                    </span>
                    {showCorrectAnswers && option.isCorrect && (
                      <div className="flex items-center gap-2 text-green-700 font-black uppercase text-sm bg-green-200 border-2 border-green-700 px-3 py-1 rounded-full">
                        <Check className="w-4 h-4" />
                        Đúng
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* True/False */}
          {currentQuestion.type === "TRUE_FALSE" && (
            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={`tf-option-${currentQuestion.id}-${index}`}
                  disabled={feedback?.isCorrect}
                  onClick={() => {
                    if (option.isCorrect) {
                      setFeedback({
                        isCorrect: true,
                        message: "Chính xác tuyệt đối! Hiệp sĩ giỏi quá!",
                      });
                      confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                      });
                    } else {
                      setFeedback({
                        isCorrect: false,
                        message: "Opps! Hãy suy nghĩ thêm một chút nhé!",
                      });
                    }
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex gap-4 items-center text-left ${
                    showCorrectAnswers && option.isCorrect
                      ? "border-green-600 bg-green-50 ring-2 ring-green-600 ring-offset-2"
                      : feedback?.isCorrect === false &&
                          !option.isCorrect &&
                          !showCorrectAnswers
                        ? "border-red-400 bg-red-50"
                        : "border-black bg-white hover:border-blue-500 hover:bg-blue-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border-2 font-black text-lg ${
                      showCorrectAnswers && option.isCorrect
                        ? "bg-green-500 text-white border-green-700"
                        : "bg-gray-100 text-gray-800 border-black"
                    }`}
                  >
                    {option.label}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">
                      {option.text}
                    </span>
                    {showCorrectAnswers && option.isCorrect && (
                      <div className="flex items-center gap-2 text-green-700 font-black uppercase text-sm bg-green-200 border-2 border-green-700 px-3 py-1 rounded-full">
                        <Check className="w-4 h-4" />
                        Đúng
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Essay */}
          {currentQuestion.type === "ESSAY" && (
            <div className="space-y-6">
              {showCorrectAnswers && (
                <div className="p-6 rounded-xl border-2 border-black bg-yellow-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)] relative">
                  <div className="absolute top-0 right-4 -translate-y-1/2 bg-yellow-400 border-2 border-black font-black uppercase px-3 py-1 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] rotate-[2deg]">
                    Gợi ý đáp án
                  </div>
                  <p className="text-xl font-medium text-gray-800">
                    {currentQuestion.options[0]?.text ||
                      "Chưa có gợi ý trả lời"}
                  </p>
                </div>
              )}
              <div className="p-6 rounded-xl border-4 border-dashed border-gray-400 bg-white min-h-[200px] flex items-center justify-center">
                <span className="text-2xl font-black font-handwritten text-gray-400">
                  Khu vực trả lời của học sinh
                </span>
              </div>
            </div>
          )}

          {/* New Question Types with Student-like Interaction */}
          <div key={`${currentQuestion.id}-${interactionKey}`}>
            {currentQuestion.type === "WORD_ORDERING" && (
              <div className="space-y-6">
                <WordOrderingRenderer
                  questionText={currentQuestion.questionText}
                  orderedWords={currentQuestion.metadata?.orderedWords || []}
                  onComplete={(isCorrect) => {
                    if (isCorrect) {
                      setFeedback({
                        isCorrect: true,
                        message: "Tuyệt vời! Hiệp sĩ đã sắp xếp rất chính xác!",
                      });
                      confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                      });
                    }
                  }}
                  hint={currentQuestion.hint}
                  showHintsSetting={true}
                />
                {showCorrectAnswers && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-green-50 border-2 border-green-600 rounded-xl"
                  >
                    <p className="font-black text-green-800 uppercase text-sm mb-2">
                      Đáp án đúng:
                    </p>
                    <p className="text-lg font-bold">
                      {currentQuestion.metadata?.orderedWords?.join(" ")}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {currentQuestion.type === "MATCHING" && (
              <div className="space-y-6">
                <MatchingRenderer
                  matchingPairs={currentQuestion.metadata?.matchingPairs || []}
                  onComplete={(isCorrect) => {
                    if (isCorrect) {
                      setFeedback({
                        isCorrect: true,
                        message: "Đỉnh quá! Các cặp đôi đã tìm thấy nhau rồi!",
                      });
                      confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                      });
                    }
                  }}
                  hint={currentQuestion.hint}
                  showHintsSetting={true}
                />
                {showCorrectAnswers && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-green-50 border-2 border-green-600 rounded-xl"
                  >
                    <p className="font-black text-green-800 uppercase text-sm mb-2">
                      Các cặp nối đúng:
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {currentQuestion.metadata?.matchingPairs?.map(
                        (pair, i) => (
                          <div
                            key={i}
                            className="text-sm font-bold bg-white p-2 border border-green-200 rounded-lg"
                          >
                            {pair.left} ↔ {pair.right}
                          </div>
                        ),
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {currentQuestion.type === "FILL_IN_BLANKS" && (
              <div className="space-y-6">
                <FillInBlanksRenderer
                  questionText={
                    (currentQuestion.metadata as any)?.sentence ||
                    currentQuestion.questionText
                  }
                  blanks={currentQuestion.metadata?.blanks || []}
                  onComplete={(isCorrect) => {
                    if (isCorrect) {
                      setFeedback({
                        isCorrect: true,
                        message:
                          "Hoàn hảo! Các ô trống đã được lấp đầy kiến thức!",
                      });
                      confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                      });
                    }
                  }}
                  hint={currentQuestion.hint}
                  showHintsSetting={true}
                />
                {showCorrectAnswers && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-green-50 border-2 border-green-600 rounded-xl"
                  >
                    <p className="font-black text-green-800 uppercase text-sm mb-2">
                      Nội dung điền đúng:
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {currentQuestion.metadata?.blanks?.map((blank, i) => (
                        <div
                          key={i}
                          className="text-sm font-bold bg-white p-2 border border-green-200 rounded-lg"
                        >
                          Ô {blank.index + 1}:{" "}
                          <span className="text-green-700">{blank.answer}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {currentQuestion.type === "CATEGORIZATION" && (
              <div className="space-y-6">
                <CategorizationRenderer
                  categoriesData={currentQuestion.metadata?.categories || []}
                  onComplete={(isCorrect) => {
                    if (isCorrect) {
                      setFeedback({
                        isCorrect: true,
                        message:
                          "Nhà thông thái ơi, bạn phân loại cực chuẩn luôn!",
                      });
                      confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                      });
                    }
                  }}
                  hint={currentQuestion.hint}
                  showHintsSetting={true}
                />
                {showCorrectAnswers && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    {currentQuestion.metadata?.categories?.map((cat, i) => (
                      <div
                        key={i}
                        className="p-3 bg-green-50 border-2 border-green-600 rounded-xl"
                      >
                        <p className="font-black text-green-800 uppercase text-xs mb-1">
                          {cat.name}
                        </p>
                        <p className="text-sm font-bold">
                          {cat.items.join(", ")}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {currentQuestion.type === "FIND_ERROR" && (
              <div className="space-y-6">
                <FindErrorRenderer
                  questionText={
                    (currentQuestion.metadata as any)?.sentence ||
                    currentQuestion.questionText
                  }
                  errorPosition={
                    currentQuestion.metadata?.errorPosition || {
                      startIndex: 0,
                      endIndex: 0,
                      correctText: "",
                    }
                  }
                  onComplete={(isCorrect) => {
                    if (isCorrect) {
                      setFeedback({
                        isCorrect: true,
                        message: "Thám tử nhí đã tìm ra lỗi sai rồi! Giỏi quá!",
                      });
                      confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                      });
                    }
                  }}
                  hint={currentQuestion.hint}
                  showHintsSetting={true}
                />
                {showCorrectAnswers && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-green-50 border-2 border-green-600 rounded-xl"
                  >
                    <p className="font-black text-green-800 uppercase text-sm mb-2">
                      Thông tin lỗi sai:
                    </p>
                    <p className="text-lg font-bold">
                      Lỗi:{" "}
                      <span className="text-red-600 underline">
                        {(() => {
                          const text =
                            (currentQuestion.metadata as any)?.sentence ||
                            currentQuestion.questionText;
                          const { startIndex, endIndex } = currentQuestion
                            .metadata?.errorPosition || {
                            startIndex: 0,
                            endIndex: 0,
                          };
                          let s = startIndex;
                          while (
                            s > 0 &&
                            text[s - 1] !== " " &&
                            text[s - 1] !== "\n"
                          )
                            s--;
                          let e = endIndex;
                          while (
                            e < text.length - 1 &&
                            text[e + 1] !== " " &&
                            text[e + 1] !== "\n"
                          )
                            e++;
                          return text.substring(s, e + 1);
                        })()}
                      </span>
                      {" → "}
                      Sửa thành:{" "}
                      <span className="text-green-700">
                        {currentQuestion.metadata?.errorPosition?.correctText}
                      </span>
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Explanation Section */}
          {currentQuestion.explanation && (
            <div className="mt-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400/10 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
              <h5 className="flex items-center gap-2 text-lg font-black text-yellow-800 mb-3 uppercase tracking-tight">
                <span className="text-2xl animate-pulse">💡</span> Giải thích từ
                Giáo sư Cú:
              </h5>
              <div
                className="text-yellow-900 font-bold leading-relaxed italic pr-4"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(currentQuestion.explanation || ""),
                }}
              />
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl border-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-4 ${
            feedback.isCorrect
              ? "bg-green-100 border-green-600 text-green-800"
              : "bg-red-100 border-red-600 text-red-800"
          }`}
        >
          <div className="text-3xl">{feedback.isCorrect ? "🌟" : "💡"}</div>
          <div className="font-black text-lg">{feedback.message}</div>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t-2 border-dashed border-gray-300">
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-4 md:pb-0 custom-scrollbar">
          <span className="font-bold text-gray-700 whitespace-nowrap hidden lg:inline">
            Chuyển đến:
          </span>
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
