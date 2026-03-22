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

    const answersArray = Object.entries(answers).map(([questionId, value]) => ({
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
  }, [user, test, answers, testId, updateUserXP, isSubmitted, isSubmitting]);

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

  const handleStartTest = () => {
    setTestStartedAtMs(Date.now());
    setIsStarted(true);
  };

  const currentQuestion = test?.questions[currentQuestionIndex];
  const totalQuestions = test?.questions.length || 0;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  const handleAnswerChange = (questionId: string, answer: number | string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleWrongAttempt = (questionId: string) => {
    setWrongAttempts((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || 0) + 1,
    }));
  };

  const handleNextQuestion = () => {
    if (!isQuestionComplete && !answers[currentQuestion?.id || ""]) {
      setIsWobbling(true);
      setFriendlyMessage("Ôi, hiệp sĩ ơi! Còn một chút xíu nữa thôi, mình hoàn thành nốt nhé!");
      setTimeout(() => {
        setIsWobbling(false);
        setFriendlyMessage(null);
      }, 3000);
      return;
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((p) => p + 1);
      setIsQuestionComplete(false);
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
  };
}
