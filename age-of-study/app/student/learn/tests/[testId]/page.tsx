"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { checkRoutePermission } from "@/lib/routeMiddleware";
import Loading from "@/components/ui/loading";
import { useAuthStore } from "@/store/useAuthStore";
import TestStartScreen from "@/components/student/Test/TestStartScreen";
import TestInterface from "@/components/student/Test/TestInterface";
import TestResultView from "@/components/student/Test/TestResultView";
import TestHeader from "@/components/student/Test/TestHeader";
import SubmitConfirmModal from "@/components/student/Test/SubmitConfirmModal";
import { useStudentTest } from "@/hooks/useStudentTest";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentTestPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const testId = params.testId as string;

  const {
    test,
    loading,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    handleAnswerChange,
    timeLeft,
    isStarted,
    isSubmitted,
    isSubmitting,
    submissionResult,
    isQuestionComplete,
    setIsQuestionComplete,
    friendlyMessage,
    setFriendlyMessage,
    isWobbling,
    setIsWobbling,
    submitError,
    setSubmitError,
    showConfirmModal,
    setShowConfirmModal,
    timeWarning,
    showTimeToast,
    handleStartTest,
    handleSubmitTest,
    handleNextQuestion,
    handlePrevQuestion,
    formatTime,
    totalQuestions,
    answeredCount,
    unansweredCount,
    wrongAttempts,
    handleWrongAttempt,
  } = useStudentTest(testId);

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

  // ── Result Screen ─────────────────────────────────────────────────────────

  if (isSubmitted && submissionResult) {
    return (
      <div className="min-h-screen notebook-paper-bg bg-repeat text-slate-800 p-4 md:p-8">
        <TestResultView
          test={test}
          submissionResult={submissionResult}
          timeLeft={timeLeft}
          onBackToMain={() => {
            if (test?.class_id) router.back();
            else router.push("/student");
          }}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen notebook-paper-bg text-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
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

        <TestHeader
          test={test}
          totalQuestions={totalQuestions}
          isStarted={isStarted}
          timeWarning={timeWarning}
          timeLeft={timeLeft}
          formatTime={formatTime}
        />

        {!isStarted ? (
          <TestStartScreen test={test} onStart={handleStartTest} />
        ) : (
          <TestInterface
            test={test}
            currentQuestionIndex={currentQuestionIndex}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
            answers={answers}
            handleAnswerChange={handleAnswerChange}
            isQuestionComplete={isQuestionComplete}
            setIsQuestionComplete={setIsQuestionComplete}
            friendlyMessage={friendlyMessage}
            setFriendlyMessage={setFriendlyMessage}
            isWobbling={isWobbling}
            setIsWobbling={setIsWobbling}
            timeLeft={timeLeft}
            timeWarning={timeWarning}
            formatTime={formatTime}
            isSubmitting={isSubmitting}
            handleSubmitClick={() => setShowConfirmModal(true)}
            handlePrevQuestion={handlePrevQuestion}
            handleNextQuestion={handleNextQuestion}
            wrongAttempts={wrongAttempts}
            handleWrongAttempt={handleWrongAttempt}
          />
        )}
      </div>

      <SubmitConfirmModal
        show={showConfirmModal}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        unansweredCount={unansweredCount}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSubmitTest}
      />
    </div>
  );
}
