"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TestService } from "@/lib/testService";
import { useAuthStore } from "@/store/useAuthStore";
import type { Question, TestWithQuestions, SubmissionResult } from "@/types/test";
import { getTestWithQuestionsServer } from "@/actions/testActions";
import {
  calculateRemainingSeconds,
  shouldTriggerOneMinuteWarning,
} from "@/utils/testTimer";
import confetti from "canvas-confetti";

const testService = new TestService();

export function useStudentTest(testId: string) {
  const router = useRouter();
  const { user, updateUserXP } = useAuthStore();

  const [test, setTest] = useState<TestWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStartedAtMs, setTestStartedAtMs] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isQuestionComplete, setIsQuestionComplete] = useState(false);
  const [friendlyMessage, setFriendlyMessage] = useState<string | null>(null);
  const [isWobbling, setIsWobbling] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [timeWarning, setTimeWarning] = useState(false);
  const [showTimeToast, setShowTimeToast] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState<Record<string, number>>({});
  const [evaluatedQuestions, setEvaluatedQuestions] = useState<Record<string, boolean>>({});
  
  const [retryQueue, setRetryQueue] = useState<string[]>([]);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [firstAttemptAnswers, setFirstAttemptAnswers] = useState<Record<string, number | string>>({});
  
  // Phase 2: Progress Tracking
  const [correctlyAnswered, setCorrectlyAnswered] = useState<string[]>([]);

  const fetchTest = useCallback(async () => {
    setLoading(true);
    try {
      const { data: testWithQuestions, error } = await getTestWithQuestionsServer(testId);
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
  }, [testId, router]);

  useEffect(() => {
    if (testId) fetchTest();
  }, [testId, fetchTest]);

  const handleSubmitTest = useCallback(async () => {
    if (!user || !test || isSubmitted || isSubmitting) return;
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setSubmitError(null);

    const answersArray = Object.entries(firstAttemptAnswers).map(([questionId, value]) => ({
      question_id: questionId,
      selected_option_index: typeof value === "number" ? value : undefined,
      text_answer: typeof value === "string" ? value : undefined,
    }));

    try {
      const result = await testService.submitTest({ test_id: testId, answers: answersArray }, user.id, test.questions);

      setIsSubmitted(true);
      setSubmissionResult(result);

      if (result.xp_earned) updateUserXP(result.xp_earned);

      if (result.score >= 80) {
        setTimeout(() => {
          confetti({ particleCount: 180, spread: 90, origin: { y: 0.5 } });
        }, 300);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Nộp bài thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }, [user, test, answers, firstAttemptAnswers, testId, updateUserXP, isSubmitted, isSubmitting]);

  useEffect(() => {
    if (!isStarted || !test?.settings?.time_limit || isSubmitted || testStartedAtMs === null) {
      return;
    }

    const totalSeconds = test.settings.time_limit * 60;

    const syncRemainingTime = () => {
      const nextTimeLeft = calculateRemainingSeconds({
        limitSeconds: totalSeconds,
        startedAtMs: testStartedAtMs,
        nowMs: Date.now(),
      });

      setTimeLeft((prev) => {
        if (shouldTriggerOneMinuteWarning(prev, nextTimeLeft)) {
          setTimeWarning(true);
          setShowTimeToast(true);
          setTimeout(() => setShowTimeToast(false), 5000);
        }
        return nextTimeLeft;
      });

      if (nextTimeLeft <= 0) {
        handleSubmitTest();
      }
    };

    syncRemainingTime();
    const timer = setInterval(syncRemainingTime, 1000);
    document.addEventListener("visibilitychange", syncRemainingTime);
    window.addEventListener("focus", syncRemainingTime);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", syncRemainingTime);
      window.removeEventListener("focus", syncRemainingTime);
    };
  }, [isStarted, test, isSubmitted, testStartedAtMs, handleSubmitTest]);

  // Page exit warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStarted && !isSubmitted) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isStarted, isSubmitted]);

  const handleStartTest = () => {
    setTestStartedAtMs(Date.now());
    setIsStarted(true);
  };

  const currentQuestion = test?.questions[currentQuestionIndex];
  const totalQuestions = test?.questions.length || 0;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  const handleAnswerChange = (questionId: string, answer: number | string) => {
    if (evaluatedQuestions[questionId]) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    if (!isRetryMode) {
      setFirstAttemptAnswers((prev) => ({ ...prev, [questionId]: answer }));
    }
  };

  const handleWrongAttempt = (questionId: string) => {
    setWrongAttempts((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || 0) + 1,
    }));
  };

  const prepareNextRetryQuestion = (qId: string) => {
    const index = test?.questions.findIndex((q) => q.id === qId) || 0;
    setCurrentQuestionIndex(index);
    setEvaluatedQuestions((prev) => ({ ...prev, [qId]: false }));
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[qId];
      return newAnswers;
    });
  };

  const handleNextQuestion = () => {
    if (!isRetryMode) {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex((p) => p + 1);
      } else if (retryQueue.length > 0) {
        setIsRetryMode(true);
        prepareNextRetryQuestion(retryQueue[0]);
      }
    } else {
      // Retry Mode
      if (retryQueue.length > 0) {
        // Wait, if they just got it right, it's removed from retryQueue.
        // So retryQueue[0] is either the NEXT wrong question, or the SAME one if they got it wrong again.
        prepareNextRetryQuestion(retryQueue[0]);
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((p) => p - 1);
      setIsQuestionComplete(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return {
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
    evaluatedQuestions,
    setEvaluatedQuestions,
    retryQueue,
    setRetryQueue,
    isRetryMode,
    correctlyAnswered,
    setCorrectlyAnswered,
  };
}
