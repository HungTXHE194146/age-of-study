"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { TestService } from "@/lib/testService";
import { Button } from "@/components/ui/button";
import { checkRoutePermission } from "@/lib/routeMiddleware";
import Loading from "@/components/ui/loading";
import { useAuthStore } from "@/store/useAuthStore";
import type { Question, TestWithQuestions } from "@/types/test";
import { getTestWithQuestionsServer } from "@/actions/testActions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubmissionResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  questions: Question[];
  answers: {
    question_id: string;
    selected_option_index?: number;
    text_answer?: string;
    is_correct: boolean;
  }[];
  xp_earned?: number;
}

const testService = new TestService();

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentTestPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, updateUserXP } = useAuthStore();
  const testId = params.testId as string;

  const [test, setTest] = useState<TestWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);

  // Notification states
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [timeWarning, setTimeWarning] = useState(false);
  const [showTimeToast, setShowTimeToast] = useState(false);

  // ── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = checkRoutePermission({
        user,
        currentPath: window.location.pathname,
        isAuthenticated,
      });
      if (redirectPath) router.push(redirectPath);
    }
  }, [isAuthenticated, user, router]);

  // ── Fetch test ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (testId) fetchTest();
  }, [testId]);

  const fetchTest = async () => {
    setLoading(true);
    try {
      const { data: testWithQuestions, error } =
        await getTestWithQuestionsServer(testId);
      if (error || !testWithQuestions) {
        router.push("/student");
        return;
      }
      setTest(testWithQuestions as TestWithQuestions);
      setTimeLeft(testWithQuestions.settings.time_limit * 60);
    } catch {
      router.push("/student");
    } finally {
      setLoading(false);
    }
  };

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isStarted || !test?.settings?.time_limit || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        // 60-second warning
        if (prev === 61) {
          setTimeWarning(true);
          setShowTimeToast(true);
          setTimeout(() => setShowTimeToast(false), 5000);
        }
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted, test, isSubmitted]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleStartTest = () => setIsStarted(true);

  const handleAnswerChange = (questionId: string, answer: number | string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (test?.questions?.length || 0) - 1)
      setCurrentQuestionIndex((p) => p + 1);
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex((p) => p - 1);
  };

  const handleSubmitClick = () => {
    setSubmitError(null);
    setShowConfirmModal(true);
  };

  const handleSubmitTest = useCallback(async () => {
    if (!user || !test) return;
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setSubmitError(null);

    const answersArray = Object.entries(answers).map(([questionId, value]) => ({
      question_id: questionId,
      selected_option_index: typeof value === "number" ? value : undefined,
      text_answer: typeof value === "string" ? value : undefined,
    }));

    try {
      const result = await testService.submitTest(
        { test_id: testId, answers: answersArray },
        user.id,
        test.questions,
      );

      setIsSubmitted(true);
      setSubmissionResult(result);

      if (result.xp_earned) updateUserXP(result.xp_earned);

      // Celebrate on good score
      if (result.score >= 80) {
        setTimeout(() => {
          confetti({ particleCount: 180, spread: 90, origin: { y: 0.5 } });
        }, 300);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Nộp bài thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [user, test, answers, testId, updateUserXP]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ── Loading / Empty states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen notebook-paper-bg bg-repeat flex items-center justify-center p-4">
        <Loading message="Đang tải bài kiểm tra..." size="lg" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen notebook-paper-bg bg-repeat flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 max-w-md transform rotate-1">
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-4">
            Không tìm thấy bài!
          </h1>
          <p className="text-slate-600 font-medium mb-8">
            Bài kiểm tra này không tồn tại hoặc chưa được công bố.
          </p>
          <Button
            onClick={() => router.back()}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all px-8 py-3 text-lg w-full"
          >
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  if (test.questions.length === 0) {
    return (
      <div className="min-h-screen notebook-paper-bg bg-repeat flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 max-w-md transform -rotate-1">
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-4">
            Bài kiểm tra rỗng!
          </h1>
          <p className="text-slate-600 font-medium mb-8">
            Giáo viên chưa thêm bất kỳ câu hỏi nào. Vui lòng quay lại sau!
          </p>
          <Button
            onClick={() => router.back()}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all px-8 py-3 text-lg w-full"
          >
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  // ── Result Screen ─────────────────────────────────────────────────────────

  if (isSubmitted && submissionResult) {
    const { score } = submissionResult;
    const grade =
      score >= 80
        ? {
            label: "🎉 Xuất sắc!",
            color: "text-green-600",
            bg: "from-green-50 to-emerald-50",
            border: "border-green-400",
          }
        : score >= 50
          ? {
              label: "👍 Tốt lắm!",
              color: "text-amber-600",
              bg: "from-amber-50 to-yellow-50",
              border: "border-amber-400",
            }
          : {
              label: "💪 Cố lên nhé!",
              color: "text-red-600",
              bg: "from-red-50 to-rose-50",
              border: "border-red-400",
            };

    return (
      <div className="min-h-screen notebook-paper-bg bg-repeat text-slate-800 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Result Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-10 bg-gradient-to-br ${grade.bg} rounded-[2rem] p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 ${grade.border} transform rotate-1 relative overflow-hidden text-center`}
          >
            <h1
              className={`text-4xl font-black uppercase tracking-tight mb-2 ${grade.color}`}
            >
              {grade.label}
            </h1>
            <p className="text-xl font-bold text-slate-600">{test.title}</p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {[
              {
                label: "XP Nhận",
                value: `+${submissionResult.xp_earned || 0}`,
                color: "text-amber-500",
                bg: "bg-amber-100",
                icon: "✨",
                rotate: "-rotate-2",
              },
              {
                label: "Điểm số",
                value: `${score}%`,
                color: "text-green-500",
                bg: "bg-green-100",
                icon: "📊",
                rotate: "-rotate-2",
              },
              {
                label: "Câu đúng",
                value: String(submissionResult.correctAnswers),
                color: "text-blue-500",
                bg: "bg-blue-100",
                icon: "✅",
                rotate: "rotate-2",
              },
              {
                label: "Tổng câu",
                value: String(submissionResult.totalQuestions),
                color: "text-slate-800",
                bg: "bg-purple-100",
                icon: "📝",
                rotate: "-rotate-1",
              },
              {
                label: "Thời gian",
                value: `${Math.floor((test.settings.time_limit * 60 - timeLeft) / 60)}:${((test.settings.time_limit * 60 - timeLeft) % 60).toString().padStart(2, "0")}`,
                color: "text-orange-500",
                bg: "bg-orange-100",
                icon: "⏱️",
                rotate: "rotate-1",
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`bg-white rounded-3xl p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 transform ${stat.rotate}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black uppercase text-slate-500 mb-1">
                      {stat.label}
                    </p>
                    <p className={`text-4xl font-black ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center border-2 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform rotate-6`}
                  >
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Question Review */}
          <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 relative z-10">
            <h3 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-widest border-b-4 border-slate-800 pb-4 inline-block">
              Xem lại câu hỏi
            </h3>

            <div className="space-y-8">
              {submissionResult.questions.map((question, index) => {
                const userAnswer = submissionResult.answers.find(
                  (a) => a.question_id === question.id,
                );
                const isCorrect = userAnswer?.is_correct;
                const isEssay =
                  question.q_type?.toLowerCase() === "essay" ||
                  question.content?.type === "ESSAY";

                return (
                  <div
                    key={question.id}
                    className={`p-6 md:p-8 rounded-3xl border-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${
                      isCorrect
                        ? "border-green-400 bg-green-50/50"
                        : "border-red-400 bg-red-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-indigo-200 border-2 border-slate-800 px-4 py-1.5 rounded-xl text-slate-900 font-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] transform -rotate-2">
                            Câu {index + 1}
                          </span>
                          <span
                            className={`px-4 py-1.5 rounded-xl border-2 border-slate-800 font-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] transform rotate-2 ${
                              isCorrect
                                ? "bg-green-400 text-slate-900"
                                : "bg-red-400 text-white"
                            }`}
                          >
                            {isCorrect ? "Tuyệt vời ✓" : "Cần cố gắng ✗"}
                          </span>
                        </div>

                        <h4
                          className="text-xl font-bold text-slate-800 mb-6 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html:
                              question.content?.question ||
                              question.content?.questionText ||
                              (question.content as any)?.text ||
                              "Câu hỏi không có nội dung",
                          }}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300">
                            <p className="text-sm font-bold uppercase text-slate-500 mb-2">
                              Câu trả lời của bạn:
                            </p>
                            {isEssay ? (
                              <div className="p-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg whitespace-pre-wrap font-bold text-lg text-slate-800">
                                {userAnswer?.text_answer || (
                                  <span className="text-red-500 italic">
                                    Em đã không để lại câu trả lời
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="font-bold text-lg text-slate-800">
                                {userAnswer?.selected_option_index !==
                                undefined ? (
                                  <>
                                    {String.fromCharCode(
                                      65 + userAnswer.selected_option_index,
                                    )}
                                    .{" "}
                                    {(question.content.options || [])[
                                      userAnswer.selected_option_index
                                    ]?.text || "Lỗi dữ liệu"}
                                  </>
                                ) : (
                                  <span className="text-red-500 italic">
                                    Em đã không chọn đáp án
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {!isCorrect && !isEssay && (
                            <div className="bg-green-100 p-5 rounded-2xl border-2 border-green-400">
                              <p className="text-sm font-bold uppercase text-green-700 mb-2">
                                Đáp án đúng:
                              </p>
                              <p className="font-bold text-lg text-green-900">
                                {String.fromCharCode(
                                  65 + question.correct_option_index,
                                )}
                                .{" "}
                                {(question.content.options || [])[
                                  question.correct_option_index
                                ]?.text || ""}
                              </p>
                            </div>
                          )}
                          {!isCorrect && isEssay && (
                            <div className="bg-green-100 p-5 rounded-2xl border-2 border-green-400">
                              <p className="text-sm font-bold uppercase text-green-700 mb-2">
                                Gợi ý / Đáp án mẫu:
                              </p>
                              <p className="font-bold text-lg text-green-900 whitespace-pre-wrap">
                                {question.model_answer ||
                                  (question.content.options || [])[0]?.text ||
                                  "Không có gợi ý"}
                              </p>
                            </div>
                          )}
                        </div>

                        {!isEssay && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t-2 border-dashed border-slate-300">
                            {(question.content.options || []).map(
                              (option, optionIndex) => {
                                const isUserAnswer =
                                  optionIndex ===
                                  (userAnswer?.selected_option_index ?? -1);
                                const isCorrectOption =
                                  optionIndex === question.correct_option_index;

                                let optionClasses =
                                  "border-slate-300 bg-white text-slate-500";
                                if (isCorrectOption)
                                  optionClasses =
                                    "border-green-500 bg-green-100 text-green-900 shadow-[2px_2px_0_0_rgba(34,197,94,1)]";
                                else if (isUserAnswer && !isCorrectOption)
                                  optionClasses =
                                    "border-red-500 bg-red-100 text-red-900 shadow-[2px_2px_0_0_rgba(239,68,68,1)]";

                                return (
                                  <div
                                    key={optionIndex}
                                    className={`p-4 rounded-xl border-2 font-bold ${optionClasses} transition-all`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-black border-2 border-slate-800 ${
                                          isCorrectOption
                                            ? "bg-green-400 text-slate-900"
                                            : isUserAnswer && !isCorrectOption
                                              ? "bg-red-400 text-white"
                                              : "bg-slate-200 text-slate-700"
                                        }`}
                                      >
                                        {String.fromCharCode(65 + optionIndex)}
                                      </span>
                                      <span className="flex-1">
                                        {option.text}
                                      </span>
                                      {isCorrectOption && (
                                        <span className="text-xl">🌟</span>
                                      )}
                                      {isUserAnswer && !isCorrectOption && (
                                        <span className="text-xl">❌</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        )}

                        {(question.explanation ||
                          question.content?.explanation) && (
                          <div className="mt-6 bg-yellow-50 p-6 rounded-2xl border-4 border-yellow-400 shadow-[4px_4px_0_0_rgba(250,204,21,1)]">
                            <h5 className="flex items-center gap-2 text-lg font-black text-yellow-800 mb-3 uppercase">
                              <span className="text-2xl">💡</span> Giải thích
                              chi tiết
                            </h5>
                            <div
                              className="text-yellow-900 font-medium leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html:
                                  question.explanation ||
                                  question.content?.explanation ||
                                  "",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t-4 border-slate-800">
              <Button
                onClick={() => {
                  if (test?.class_id) router.back();
                  else router.push("/student");
                }}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-black px-8 py-4 text-xl rounded-xl border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all h-auto"
              >
                QUAY LẠI MÀN HÌNH CHÍNH
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 bg-white !text-slate-800 font-bold px-8 py-4 text-xl rounded-xl border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all h-auto"
              >
                THỬ LẠI LẦN NỮA
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Test Interface ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen notebook-paper-bg text-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* ── Time Warning Toast ── */}
        <AnimatePresence>
          {showTimeToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] font-black flex items-center gap-3"
            >
              <span className="text-2xl">⏰</span>
              Còn 1 phút! Bài sẽ tự động nộp.
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error Banner ── */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 bg-red-100 border-4 border-red-500 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-[4px_4px_0_0_rgba(239,68,68,1)]"
            >
              <div className="flex items-center gap-3 font-bold text-red-800">
                <span className="text-2xl">❌</span>
                {submitError}
              </div>
              <button
                onClick={() => setSubmitError(null)}
                className="text-red-600 hover:text-red-800 font-black text-xl leading-none"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test Info Header */}
        <div className="mb-10 bg-white rounded-[2rem] p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 transform rotate-1 relative overflow-hidden">
          <div className="absolute top-2 right-4 w-12 h-4 bg-red-200/80 border border-red-300 rounded-sm italic transform rotate-3" />
          <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tight mb-2">
            {test.title}
          </h1>
          <p className="text-slate-600 font-medium text-lg">
            {test.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6 text-sm font-bold text-slate-700">
            <span className="bg-indigo-200 border-2 border-slate-800 px-4 py-1.5 rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] transform -rotate-2">
              {test.type === "practice" ? "Luyện tập" : "Kiểm tra kỹ năng"}
            </span>
            <span className="bg-white border-2 border-slate-800 px-4 py-1.5 rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase">
              {totalQuestions} Câu hỏi
            </span>
            <span className="bg-white border-2 border-slate-800 px-4 py-1.5 rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase">
              {test.settings.time_limit} Phút
            </span>
            {isStarted && (
              <motion.span
                animate={timeWarning ? { scale: [1, 1.1, 1] } : {}}
                transition={{
                  repeat: timeWarning ? Infinity : 0,
                  duration: 0.6,
                }}
                className={`border-2 border-slate-800 px-4 py-1.5 rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-mono text-lg ${
                  timeWarning
                    ? "bg-red-400 text-white animate-pulse"
                    : timeLeft < 120
                      ? "bg-orange-200 text-orange-900"
                      : "bg-white"
                }`}
              >
                {formatTime(timeLeft)}
              </motion.span>
            )}
          </div>
        </div>

        {!isStarted ? (
          /* ── Start Screen ── */
          <div className="bg-white rounded-[2rem] p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 max-w-4xl mx-auto transform -rotate-1 text-center">
            <h2 className="text-3xl font-black mb-8 uppercase tracking-widest text-slate-800">
              Sẵn sàng bắt đầu?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
              <div className="bg-blue-50 p-6 rounded-2xl border-2 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform rotate-1">
                <h4 className="font-bold text-lg mb-3 uppercase text-slate-800">
                  Hướng dẫn
                </h4>
                <ul className="text-slate-600 font-medium space-y-2">
                  <li>• Đọc kỹ từng câu hỏi</li>
                  <li>• Chọn đáp án đúng nhất</li>
                  <li>• Có thể chuyển đổi các câu</li>
                  <li>• Nộp bài khi hoàn thành</li>
                </ul>
              </div>
              <div className="bg-green-50 p-6 rounded-2xl border-2 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-2">
                <h4 className="font-bold text-lg mb-3 uppercase text-slate-800">
                  Thời gian
                </h4>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Bạn có <strong>{test.settings.time_limit} phút</strong> để
                  hoàn thành. Thời gian bắt đầu đếm ngược khi nhấn Bắt đầu.
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-2xl border-2 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform rotate-2">
                <h4 className="font-bold text-lg mb-3 uppercase text-slate-800">
                  Điểm số
                </h4>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Điểm được tính dựa trên số câu đúng. Bạn cần ≥ 50% để hoàn
                  thành bài.
                </p>
              </div>
            </div>
            <Button
              onClick={handleStartTest}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-2xl border-4 border-slate-800 shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1.5 transition-all px-12 py-4 text-xl"
            >
              BẮT ĐẦU LÀM BÀI
            </Button>
          </div>
        ) : (
          /* ── Test Interface ── */
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
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 transform rotate-1 relative">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-300 rounded-full border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center font-black text-xl z-20 text-slate-800">
                  {currentQuestionIndex + 1}
                </div>

                <h3
                  className="text-2xl font-black mb-8 border-b-2 border-dashed border-slate-300 pb-6 leading-relaxed text-slate-800"
                  dangerouslySetInnerHTML={{
                    __html:
                      currentQuestion.content?.question ||
                      currentQuestion.content?.questionText ||
                      (currentQuestion.content as any)?.text ||
                      "Câu hỏi không có nội dung",
                  }}
                />

                <div className="space-y-4 mb-10">
                  {currentQuestion.q_type?.toLowerCase() === "essay" ||
                  currentQuestion.content.type === "ESSAY" ? (
                    <div className="space-y-4">
                      <label className="text-lg font-bold text-slate-700 block mb-2">
                        Câu trả lời của bạn:
                      </label>
                      <textarea
                        value={(answers[currentQuestion.id] as string) || ""}
                        onChange={(e) =>
                          handleAnswerChange(currentQuestion.id, e.target.value)
                        }
                        placeholder="Nhập câu trả lời của bạn tại đây..."
                        className="w-full min-h-[300px] p-6 text-lg font-medium border-4 border-slate-800 rounded-[2rem] bg-[#fffdf8] focus:bg-white focus:outline-none focus:ring-8 focus:ring-indigo-100 transition-all resize-none leading-relaxed"
                      />
                      <div className="flex items-center justify-between px-2">
                        <p className="text-sm text-slate-500 font-bold italic">
                          * Gợi ý: Hãy trình bày rõ ràng, đủ ý nhé!
                        </p>
                        <p className="text-xs font-black uppercase text-slate-400">
                          {
                            ((answers[currentQuestion.id] as string) || "")
                              .length
                          }{" "}
                          ký tự
                        </p>
                      </div>
                    </div>
                  ) : (
                    (currentQuestion.content.options || []).map(
                      (option, index) => {
                        const isSelected =
                          answers[currentQuestion.id] === index;
                        return (
                          <label
                            key={index}
                            className={`flex items-start gap-4 p-4 rounded-2xl border-4 cursor-pointer transition-all ${
                              isSelected
                                ? "bg-indigo-100 border-indigo-500 shadow-[4px_4px_0_0_rgba(99,102,241,1)] transform -rotate-1 scale-[1.02]"
                                : "bg-slate-50 border-slate-200 hover:border-slate-800 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1"
                            }`}
                          >
                            <div className="flex items-center h-6 mt-1">
                              <input
                                type="radio"
                                name={`question-${currentQuestion.id}`}
                                value={index}
                                checked={isSelected}
                                onChange={(e) =>
                                  handleAnswerChange(
                                    currentQuestion.id,
                                    parseInt(e.target.value),
                                  )
                                }
                                className="w-5 h-5 text-indigo-600 bg-white border-2 border-slate-800 focus:ring-indigo-500"
                              />
                            </div>
                            <span className="text-lg font-bold text-slate-800 leading-snug">
                              {String.fromCharCode(65 + index)}. {option.text}
                            </span>
                          </label>
                        );
                      },
                    )
                  )}
                </div>

                {/* Navigation + Submit */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-8 border-t-4 border-slate-800">
                  <div className="flex gap-4 w-full sm:w-auto">
                    <Button
                      onClick={handlePrevQuestion}
                      disabled={currentQuestionIndex === 0 || isSubmitting}
                      className="flex-1 sm:flex-none bg-white !text-slate-800 hover:bg-slate-100 font-bold border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:shadow-none disabled:translate-y-1 py-3 px-6 h-auto text-lg"
                      variant="outline"
                    >
                      BÀI TRƯỚC
                    </Button>
                    <Button
                      onClick={handleNextQuestion}
                      disabled={
                        currentQuestionIndex === totalQuestions - 1 ||
                        isSubmitting
                      }
                      className="flex-1 sm:flex-none bg-slate-800 text-white hover:bg-slate-900 font-bold border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:shadow-none disabled:translate-y-1 py-3 px-6 h-auto text-lg"
                    >
                      KẾ TIẾP
                    </Button>
                  </div>

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
        )}
      </div>

      {/* ── Submit Confirmation Modal ── */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full border-4 border-slate-800 shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-2xl font-black text-slate-800 uppercase mb-2">
                  Nộp bài?
                </h2>
                <p className="text-slate-600 font-medium">
                  Bạn đã trả lời{" "}
                  <strong className="text-indigo-600">
                    {answeredCount}/{totalQuestions}
                  </strong>{" "}
                  câu hỏi.
                </p>

                {unansweredCount > 0 && (
                  <div className="mt-4 bg-amber-50 border-2 border-amber-400 rounded-2xl p-4">
                    <p className="text-amber-800 font-bold">
                      ⚠️ Còn <strong>{unansweredCount} câu</strong> chưa trả
                      lời. Bạn có chắc muốn nộp không?
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-white !text-slate-800 font-black border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all py-3 h-auto text-lg"
                  variant="outline"
                >
                  Làm tiếp
                </Button>
                <Button
                  onClick={handleSubmitTest}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-slate-900 font-black border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all py-3 h-auto text-lg"
                >
                  Nộp bài ✓
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
