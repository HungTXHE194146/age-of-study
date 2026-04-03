"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Question, TestWithQuestions, QuestionOption } from "@/types/test";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { RotateCcw } from "lucide-react";
import WordOrderingRenderer from "@/components/student/QuestionRenderers/WordOrderingRenderer";
import MatchingRenderer from "@/components/student/QuestionRenderers/MatchingRenderer";
import FillInBlanksRenderer from "@/components/student/QuestionRenderers/FillInBlanksRenderer";
import CategorizationRenderer from "@/components/student/QuestionRenderers/CategorizationRenderer";
import FindErrorRenderer from "@/components/student/QuestionRenderers/FindErrorRenderer";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

// --- Web Audio API Utilities ---
let sharedAudioCtx: AudioContext | null = null;
const getAudioCtx = () => {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) sharedAudioCtx = new AudioContextClass();
  }
  return sharedAudioCtx;
};

const playSoundFeedback = (type: "correct" | "incorrect") => {
  const ctx = getAudioCtx();
  if (!ctx) return;

  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;

  if (type === "correct") {
    // "Ting-Ting" (Soft Bell Arpeggio: C5 then G5)
    const playNote = (freq: number, startTime: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.value = freq;

      // Envelope: Fast attack, slow decay (makes it sound like a soft bell)
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    };

    playNote(523.25, now); // C5
    playNote(783.99, now + 0.12); // G5 (played slightly after)
  } else {
    // Soft "Thud/Bonk" for incorrect
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = "triangle"; // Milder than sawtooth

    // Quick pitch drop
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

    // Envelope: Fast attack, moderately fast decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  }
};
// -------------------------------

interface TestInterfaceProps {
  test: TestWithQuestions;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  answers: Record<string, number | string>;
  handleAnswerChange: (questionId: string, answer: number | string) => void;
  isQuestionComplete: boolean;
  setIsQuestionComplete: (complete: boolean) => void;
  friendlyMessage: string | null;
  setFriendlyMessage: (msg: string | null) => void;
  isWobbling: boolean;
  setIsWobbling: (wobble: boolean) => void;
  timeLeft: number;
  timeWarning: boolean;
  formatTime: (seconds: number) => string;
  isSubmitting: boolean;
  handleSubmitClick: () => void;
  handlePrevQuestion: () => void;
  handleNextQuestion: () => void;
  wrongAttempts: Record<string, number>;
  handleWrongAttempt: (questionId: string) => void;
  evaluatedQuestions: Record<string, boolean>;
  setEvaluatedQuestions: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  retryQueue: string[];
  setRetryQueue: React.Dispatch<React.SetStateAction<string[]>>;
  isRetryMode: boolean;
  correctlyAnswered: string[];
  setCorrectlyAnswered: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function TestInterface({
  test,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  answers,
  handleAnswerChange,
  isQuestionComplete,
  setIsQuestionComplete,
  friendlyMessage,
  setFriendlyMessage,
  isWobbling,
  setIsWobbling,
  timeLeft,
  timeWarning,
  formatTime,
  isSubmitting,
  handleSubmitClick,
  handlePrevQuestion,
  handleNextQuestion,
  wrongAttempts,
  handleWrongAttempt,
  evaluatedQuestions,
  setEvaluatedQuestions,
  retryQueue,
  setRetryQueue,
  isRetryMode,
  correctlyAnswered,
  setCorrectlyAnswered,
}: TestInterfaceProps) {
  const [persistentHint, setPersistentHint] = useState<{
    text: string;
    type: "hint" | "explanation";
  } | null>(null);

  const autoAdvanceTimer = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setPersistentHint(null);
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, [currentQuestionIndex]);

  const currentQuestion = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-3xl p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 sticky top-8">
          <h3 className="text-xl font-black mb-6 uppercase tracking-wider text-center border-b-4 border-slate-800 pb-4 text-slate-800">
            Câu Hỏi
          </h3>

          {/* Progress summary */}
          <div className="mb-4 text-center text-sm font-bold text-slate-500">
            <span className="text-green-600">{answeredCount}</span> /{" "}
            {totalQuestions} đã trả lời
          </div>

          <div className="grid grid-cols-5 lg:grid-cols-4 gap-3">
            {test.questions.map((question, index) => {
              const isAnswered = answers[question.id] !== undefined;
              const isCurrent = index === currentQuestionIndex;
              return (
                <button
                  key={question.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`
                    w-full aspect-square flex items-center justify-center font-black rounded-xl border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1
                    ${
                      isCurrent
                        ? "bg-indigo-500 text-white border-slate-800 scale-110"
                        : isAnswered
                          ? "bg-green-400 text-slate-900 border-slate-800"
                          : "bg-slate-100 text-slate-500 border-slate-300 hover:border-slate-800 hover:text-slate-800"
                    }
                  `}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Question Area */}
      <div className="lg:col-span-3">
        {/* Progress Bar (Duolingo Style) */}
        <div className="w-full flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-white rounded-full border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center font-black text-xl text-slate-800 flex-shrink-0">
            {currentQuestionIndex + 1}
          </div>
          <div className="flex-1 overflow-hidden h-6 bg-slate-200 rounded-full border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative">
            {(() => {
              const totalMistakes = Object.values(wrongAttempts).reduce(
                (a, b) => a + b,
                0,
              );
              const totalSteps = test.questions.length + totalMistakes;
              const completedSteps = correctlyAnswered.length + totalMistakes;
              const progressPercentage =
                totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

              return (
                <>
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-green-500 rounded-r-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  {/* Lớp phản quang */}
                  <motion.div
                    className="absolute top-1 left-2 right-2 h-[30%] bg-white/30 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `calc(${progressPercentage}% - 16px)` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </>
              );
            })()}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 transform rotate-1 relative">
          {/* Passage block — only for comprehension questions */}
          {currentQuestion.content?.passage && (
            <blockquote className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-2xl text-slate-700 text-base font-medium leading-relaxed italic">
              {currentQuestion.content.passage}
            </blockquote>
          )}

          <h3
            className="text-2xl font-black mb-8 border-b-2 border-dashed border-slate-300 pb-6 leading-relaxed text-slate-800"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(
                currentQuestion.content?.question ||
                  currentQuestion.content?.questionText ||
                  (currentQuestion.content as any)?.text ||
                  "Câu hỏi không có nội dung",
              ),
            }}
          />

          <motion.div
            key={`question-container-${currentQuestion.id}`}
            animate={isWobbling ? { x: [-10, 10, -10, 10, 0] } : {}}
            className="space-y-4 mb-10"
          >
            <QuestionBodyRenderer
              currentQuestion={currentQuestion}
              answers={answers}
              handleAnswerChange={handleAnswerChange}
              setIsQuestionComplete={setIsQuestionComplete}
              setFriendlyMessage={setFriendlyMessage}
              setIsWobbling={setIsWobbling}
              handleNextQuestion={handleNextQuestion}
              showHintsSetting={test.settings?.show_hints ?? false}
              wrongAttempts={wrongAttempts}
              handleWrongAttempt={handleWrongAttempt}
              setPersistentHint={setPersistentHint}
              evaluatedQuestions={evaluatedQuestions}
              setEvaluatedQuestions={setEvaluatedQuestions}
              retryQueue={retryQueue}
              setRetryQueue={setRetryQueue}
              isRetryMode={isRetryMode}
              setCorrectlyAnswered={setCorrectlyAnswered}
              autoAdvanceTimer={autoAdvanceTimer}
            />

            {/* Persistent Hint/Explanation Box */}
            <AnimatePresence>
              {persistentHint && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-2xl border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${
                    persistentHint.type === "explanation"
                      ? "bg-green-50"
                      : "bg-indigo-50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg border-2 border-slate-800 ${
                        persistentHint.type === "explanation"
                          ? "bg-green-200"
                          : "bg-indigo-200"
                      }`}
                    >
                      {persistentHint.type === "explanation" ? "📖" : "💡"}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 uppercase text-sm mb-1">
                        {persistentHint.type === "explanation"
                          ? "Lời giải chi tiết"
                          : "Gợi ý từ Cú 🦉"}
                      </h4>
                      <p className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">
                        {persistentHint.text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Friendly Reminder Popup */}
          <AnimatePresence>
            {friendlyMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[90%] md:w-auto"
              >
                <div className="bg-white border-4 border-indigo-500 p-4 rounded-2xl shadow-[8px_8px_0_0_rgba(99,102,241,1)] flex items-center gap-4">
                  <span className="text-4xl animate-bounce">🦉</span>
                  <p className="font-black text-indigo-800 italic text-lg leading-tight">
                    {friendlyMessage}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation + Submit */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-8 border-t-4 border-slate-800">
            {evaluatedQuestions &&
            evaluatedQuestions[currentQuestion.id] &&
            !isQuestionComplete ? (
              // Nút ĐÃ HIỂU, ĐI TIẾP thay thế cụm Điều hướng khi trả lời sai
              <Button
                onClick={handleNextQuestion}
                disabled={
                  isSubmitting || (isRetryMode && retryQueue.length === 0)
                }
                className="w-full sm:flex-1 bg-slate-800 text-white hover:bg-slate-900 font-black px-10 py-5 text-xl rounded-xl border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-1 h-auto"
              >
                ĐÃ HIỂU, ĐI TIẾP
              </Button>
            ) : (
              <div className="flex gap-4 w-full sm:w-auto">
                <Button
                  onClick={handlePrevQuestion}
                  disabled={
                    currentQuestionIndex === 0 || isSubmitting || isRetryMode
                  }
                  className="flex-1 sm:flex-none bg-white !text-slate-800 hover:bg-slate-100 font-bold border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:shadow-none disabled:translate-y-1 py-3 px-6 h-auto text-lg"
                  variant="outline"
                >
                  BÀI TRƯỚC
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={
                    isSubmitting ||
                    (!isRetryMode &&
                      currentQuestionIndex === totalQuestions - 1 &&
                      retryQueue.length === 0) ||
                    (isRetryMode && retryQueue.length === 0)
                  }
                  className="flex-1 sm:flex-none bg-slate-800 text-white hover:bg-slate-900 font-bold border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:shadow-none disabled:translate-y-1 py-3 px-6 h-auto text-lg"
                >
                  KẾ TIẾP
                </Button>
              </div>
            )}

            <Button
              onClick={handleSubmitClick}
              disabled={answeredCount === 0 || isSubmitting}
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-slate-900 font-black px-10 py-3 text-xl rounded-xl border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-1 h-auto min-w-[160px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.7,
                      ease: "linear",
                    }}
                    className="inline-block w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full"
                  />
                  Đang nộp...
                </span>
              ) : (
                "NỘP BÀI"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuestionBodyRendererProps {
  currentQuestion: Question;
  answers: Record<string, number | string>;
  handleAnswerChange: (questionId: string, answer: number | string) => void;
  setIsQuestionComplete: (complete: boolean) => void;
  setFriendlyMessage: (msg: string | null) => void;
  setIsWobbling: (wobble: boolean) => void;
  handleNextQuestion: () => void;
  showHintsSetting: boolean;
  wrongAttempts: Record<string, number>;
  handleWrongAttempt: (questionId: string) => void;
  setPersistentHint: (
    hint: { text: string; type: "hint" | "explanation" } | null,
  ) => void;
  evaluatedQuestions: Record<string, boolean>;
  setEvaluatedQuestions: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  retryQueue: string[];
  setRetryQueue: React.Dispatch<React.SetStateAction<string[]>>;
  isRetryMode: boolean;
  setCorrectlyAnswered: React.Dispatch<React.SetStateAction<string[]>>;
  autoAdvanceTimer: React.MutableRefObject<NodeJS.Timeout | null>;
}

function QuestionBodyRenderer({
  currentQuestion,
  answers,
  handleAnswerChange,
  setIsQuestionComplete,
  setFriendlyMessage,
  setIsWobbling,
  handleNextQuestion,
  showHintsSetting,
  wrongAttempts,
  handleWrongAttempt,
  setPersistentHint,
  evaluatedQuestions,
  setEvaluatedQuestions,
  retryQueue,
  setRetryQueue,
  isRetryMode,
  setCorrectlyAnswered,
  autoAdvanceTimer,
}: QuestionBodyRendererProps) {
  const qType = (
    currentQuestion.content?.type ||
    currentQuestion.q_type ||
    ""
  ).toUpperCase();

  const praises = [
    "Tuyệt đỉnh vô đối! 🌟",
    "Hiệp sĩ nhí giỏi quá! ⚔️",
    "Đúng rồi! Em thông minh quá! 🧠",
    "Xuất sắc luôn! Tiếp tục phát huy nhé! 🚀",
    "Wow! Câu trả lời hoàn hảo! ✨",
  ];

  const encouragements = [
    "Cố lên nào, một chút nữa thôi! 💪",
    "Đừng bỏ cuộc nhé, hiệp sĩ nhí! 🛡️",
    "Gần đúng rồi, em thử lại lần nữa xem! 🔄",
    "Bình tĩnh suy nghĩ thêm chút nhé! 🤔",
    "Lần sau chắc chắn em sẽ làm được! 💫",
  ];

  const handleFeedback = (isCorrect: boolean, hint?: string) => {
    setIsQuestionComplete(isCorrect);

    // Khóa câu hỏi, không cho phép làm lại
    setEvaluatedQuestions((prev) => ({ ...prev, [currentQuestion.id]: true }));

    if (isCorrect) {
      setCorrectlyAnswered((prev) => {
        if (!prev.includes(currentQuestion.id))
          return [...prev, currentQuestion.id];
        return prev;
      });
      // Bỏ khỏi retry queue nếu học sinh làm lại đúng
      setRetryQueue((prev) => prev.filter((id) => id !== currentQuestion.id));

      playSoundFeedback("correct");
      const randomPraise = praises[Math.floor(Math.random() * praises.length)];
      setFriendlyMessage(randomPraise);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Auto-advance
      autoAdvanceTimer.current = setTimeout(() => {
        handleNextQuestion();
      }, 1500);
    } else {
      playSoundFeedback("incorrect");
      handleWrongAttempt(currentQuestion.id);

      if (!isRetryMode) {
        // Lưu vào retry queue để làm lại sau
        setRetryQueue((prev) => {
          if (!prev.includes(currentQuestion.id))
            return [...prev, currentQuestion.id];
          return prev;
        });
      } else {
        // Nếu đang ở Retry Mode mà vẫn sai -> Xóa ở đầu và đẩy xuống cuối hàng chờ (Move to back of queue)
        setRetryQueue((prev) => {
          const filtered = prev.filter((id) => id !== currentQuestion.id);
          return [...filtered, currentQuestion.id];
        });
      }

      // Ghi nhận làm sai (nếu cần thiết cho reporting sau này, hiện tại không ảnh hưởng logic retry nữa)
      handleWrongAttempt(currentQuestion.id);

      // Duolingo style: Hiện gợi ý/giải thích ngay lập tức sau lần làm sai đầu tiên
      if (currentQuestion.explanation) {
        setPersistentHint({
          text: currentQuestion.explanation,
          type: "explanation",
        });
        setFriendlyMessage(null);
      } else if (hint && showHintsSetting) {
        setPersistentHint({ text: hint, type: "hint" });
        setFriendlyMessage(null);
      } else {
        setFriendlyMessage(
          encouragements[Math.floor(Math.random() * encouragements.length)],
        );
      }

      setIsWobbling(true);
      setTimeout(() => setIsWobbling(false), 500);
    }

    // Clean up message sau 3s (cho popup ngợi khen/động viên bay bay)
    setTimeout(() => {
      setFriendlyMessage(null);
    }, 3000);
  };

  switch (qType) {
    case "WORD_ORDERING":
      return (
        <WordOrderingRenderer
          questionText={currentQuestion.content?.questionText || ""}
          orderedWords={currentQuestion.content?.metadata?.orderedWords || []}
          initialAnswer={
            answers[currentQuestion.id]
              ? typeof answers[currentQuestion.id] === "string"
                ? JSON.parse(answers[currentQuestion.id] as string)
                : answers[currentQuestion.id]
              : undefined
          }
          onUpdate={(answer: string[]) => {
            handleAnswerChange(currentQuestion.id, JSON.stringify(answer));
          }}
          onComplete={(isCorrect, answer: string[]) => {
            handleAnswerChange(currentQuestion.id, JSON.stringify(answer));
            handleFeedback(
              isCorrect,
              currentQuestion.hint || currentQuestion.content?.hint,
            );
          }}
          hint={currentQuestion.hint || currentQuestion.content?.hint}
          showHintsSetting={showHintsSetting}
        />
      );

    case "MATCHING":
      return (
        <MatchingRenderer
          matchingPairs={currentQuestion.content?.metadata?.matchingPairs || []}
          initialAnswer={
            answers[currentQuestion.id]
              ? JSON.parse(answers[currentQuestion.id] as string)
              : undefined
          }
          onUpdate={(pairs: any[]) => {
            handleAnswerChange(currentQuestion.id, JSON.stringify(pairs));
          }}
          onComplete={(isCorrect, pairs) => {
            handleAnswerChange(currentQuestion.id, JSON.stringify(pairs));
            handleFeedback(
              isCorrect,
              currentQuestion.hint || currentQuestion.content?.hint,
            );
          }}
          hint={currentQuestion.hint || currentQuestion.content?.hint}
          showHintsSetting={showHintsSetting}
        />
      );

    case "FILL_IN_BLANKS":
      return (
        <FillInBlanksRenderer
          questionText={
            currentQuestion.content?.metadata?.sentence ||
            currentQuestion.content?.questionText ||
            ""
          }
          blanks={currentQuestion.content?.metadata?.blanks || []}
          initialAnswer={
            answers[currentQuestion.id]
              ? (answers[currentQuestion.id] as string).split("|")
              : undefined
          }
          onUpdate={(userAnswers: string[]) => {
            handleAnswerChange(currentQuestion.id, userAnswers.join("|"));
          }}
          onComplete={(isCorrect, userAnswers) => {
            handleAnswerChange(currentQuestion.id, userAnswers.join("|"));
            handleFeedback(
              isCorrect,
              currentQuestion.hint || currentQuestion.content?.hint,
            );
          }}
          hint={currentQuestion.hint || currentQuestion.content?.hint}
          showHintsSetting={showHintsSetting}
        />
      );

    case "CATEGORIZATION":
      return (
        <CategorizationRenderer
          categoriesData={currentQuestion.content?.metadata?.categories || []}
          initialAnswer={
            answers[currentQuestion.id]
              ? JSON.parse(answers[currentQuestion.id] as string)
              : undefined
          }
          onUpdate={(categories: any[]) => {
            handleAnswerChange(currentQuestion.id, JSON.stringify(categories));
          }}
          onComplete={(isCorrect, categories: any[]) => {
            handleAnswerChange(currentQuestion.id, JSON.stringify(categories));
            handleFeedback(
              isCorrect,
              currentQuestion.hint || currentQuestion.content?.hint,
            );
          }}
          hint={currentQuestion.hint || currentQuestion.content?.hint}
          showHintsSetting={showHintsSetting}
        />
      );

    case "FIND_ERROR":
      return (
        <FindErrorRenderer
          questionText={
            currentQuestion.content?.metadata?.sentence ||
            currentQuestion.content?.questionText ||
            ""
          }
          errorPosition={
            currentQuestion.content?.metadata?.errorPosition || {
              startIndex: 0,
              endIndex: 0,
              correctText: "",
            }
          }
          initialAnswer={answers[currentQuestion.id] as string}
          onComplete={(isCorrect, selectedText) => {
            handleAnswerChange(currentQuestion.id, selectedText);
            handleFeedback(
              isCorrect,
              currentQuestion.hint || currentQuestion.content?.hint,
            );
          }}
          hint={currentQuestion.hint || currentQuestion.content?.hint}
          showHintsSetting={showHintsSetting}
        />
      );

    case "ESSAY":
      return (
        <div className="space-y-4">
          <textarea
            value={(answers[currentQuestion.id] as string) || ""}
            onChange={(e) => {
              handleAnswerChange(currentQuestion.id, e.target.value);
              setIsQuestionComplete(e.target.value.length > 5);
            }}
            className="w-full p-6 text-xl font-medium border-4 border-slate-800 rounded-[2rem] focus:ring-4 focus:ring-indigo-200 outline-none transition-all min-h-[200px]"
            placeholder="Nhập câu trả lời của em tại đây..."
          />
          <p className="text-sm text-slate-400 font-bold italic">
            (Giáo viên sẽ chấm điểm bài này sau nhé!)
          </p>
        </div>
      );

    default: // MULTIPLE_CHOICE or TRUE_FALSE
      return (
        <div className="space-y-4">
          {(currentQuestion.content.options || []).map(
            (option: any, index: number) => {
              const isSelected = answers[currentQuestion.id] === index;
              const optionText =
                typeof option === "string" ? option : option?.text || "";
              const isCorrect =
                currentQuestion.correct_option_index !== undefined &&
                currentQuestion.correct_option_index !== null
                  ? index === currentQuestion.correct_option_index
                  : typeof option === "object" && option?.isCorrect;

              return (
                <button
                  key={`opt-${currentQuestion.id}-${index}`}
                  disabled={
                    evaluatedQuestions && evaluatedQuestions[currentQuestion.id]
                  }
                  onClick={() => {
                    if (
                      evaluatedQuestions &&
                      evaluatedQuestions[currentQuestion.id]
                    )
                      return;
                    handleAnswerChange(currentQuestion.id, index);
                    handleFeedback(
                      isCorrect,
                      currentQuestion.hint || currentQuestion.content?.hint,
                    );
                  }}
                  className={`w-full p-6 rounded-2xl border-4 transition-all shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex gap-6 items-center text-left ${
                    isSelected
                      ? isCorrect
                        ? "bg-green-100 border-green-500 shadow-none translate-y-1"
                        : "bg-red-100 border-red-500 shadow-none translate-y-1"
                      : "bg-white border-slate-800 hover:bg-slate-50 hover:-translate-y-1"
                  } disabled:opacity-90 disabled:cursor-not-allowed`}
                >
                  <div
                    className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border-4 font-black text-xl ${
                      isSelected
                        ? isCorrect
                          ? "bg-green-500 text-white border-green-700"
                          : "bg-red-500 text-white border-red-700"
                        : "bg-slate-100 text-slate-800 border-slate-800"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1">
                    <span className="text-xl font-bold text-slate-800">
                      {optionText}
                    </span>
                  </div>
                  {isSelected && (
                    <div className={`text-3xl animate-bounce`}>
                      {isCorrect ? "✅" : "❌"}
                    </div>
                  )}
                </button>
              );
            },
          )}
        </div>
      );
  }
}
