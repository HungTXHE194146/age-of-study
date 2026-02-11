"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { TestService } from "@/lib/testService";
import { Button } from "@/components/ui/button";

interface Question {
  id: string;
  content: {
    question: string;
    options: string[];
  };
  correct_option_index: number;
}

interface Test {
  id: string;
  title: string;
  description: string;
  type: string;
  settings: {
    time_limit: number;
  };
  questions: Question[];
}

interface SubmissionResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  questions: Question[];
  answers: {
    question_id: string;
    selected_option_index: number;
    is_correct: boolean;
  }[];
}

const testService = new TestService();

export default function StudentTestPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const testId = params.testId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);

  useEffect(() => {
    if (testId) {
      fetchTest();
    }
  }, [testId]);

  useEffect(() => {
    if (isStarted && test?.settings?.time_limit && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isStarted, test, isSubmitted]);

  const fetchTest = async () => {
    setLoading(true);
    try {
      const testWithQuestions = await testService.getTestWithQuestions(testId);
      if (!testWithQuestions) {
        router.push("/learn");
        return;
      }
      setTest(testWithQuestions);
      setTimeLeft(testWithQuestions.settings.time_limit * 60); // Convert to seconds
    } catch (error) {
      console.error("Error fetching test:", error);
      router.push("/learn");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!user) return;

    try {
      // For now, just set started to true since we don't have test_submissions table
      setIsStarted(true);
    } catch (error) {
      console.error("Error starting test:", error);
      alert("Failed to start test");
    }
  };

  const handleAnswerChange = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (test?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (!user) return;

    const answersArray = Object.entries(answers).map(
      ([questionId, selectedOptionIndex]) => ({
        question_id: questionId,
        selected_option_index: selectedOptionIndex,
      }),
    );

    try {
      const result = await testService.submitTest(
        {
          test_id: testId,
          answers: answersArray,
        },
        user.id,
      );

      setIsSubmitted(true);
      setSubmissionResult(result);
    } catch (error) {
      console.error("Error submitting test:", error);
      alert("Failed to submit test");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Test not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            The test you are looking for does not exist or is not published.
          </p>
          <Button onClick={() => router.push("/learn")} className="mt-4">
            Back to Learn
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;

  if (isSubmitted && submissionResult) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-6">
                Test Completed!
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Score
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {submissionResult.score}%
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Correct
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {submissionResult.correctAnswers}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total
                    </div>
                    <div className="text-2xl font-bold text-gray-600">
                      {submissionResult.totalQuestions}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Time
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.floor(
                        (test.settings.time_limit * 60 - timeLeft) / 60,
                      )}
                      :
                      {((test.settings.time_limit * 60 - timeLeft) % 60)
                        .toString()
                        .padStart(2, "0")}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Question Review</h3>
                  {submissionResult.questions.map((question, index) => {
                    const userAnswer = submissionResult.answers.find(
                      (a) => a.question_id === question.id,
                    );
                    const isCorrect = userAnswer?.is_correct;
                    return (
                      <div
                        key={question.id}
                        className={`p-4 rounded-lg ${isCorrect ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">
                            {index + 1}. {question.content.question}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${isCorrect ? "bg-green-200 dark:bg-green-800" : "bg-red-200 dark:bg-red-800"}`}
                          >
                            {isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Your answer:{" "}
                          {
                            question.content.options[
                              userAnswer?.selected_option_index || 0
                            ]
                          }
                          {isCorrect
                            ? ""
                            : ` | Correct: ${question.content.options[question.correct_option_index]}`}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => router.push("/learn")}>
                    Back to Learn
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/learn/tests/${testId}`)}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Test Info */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {test.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {test.description}
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {test.type === "practice" ? "Luyện tập" : "Kiểm tra kỹ năng"}
              </span>
              <span>{totalQuestions} câu hỏi</span>
              <span>{test.settings.time_limit} phút</span>
              {isStarted && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-mono">
                  {formatTime(timeLeft)}
                </span>
              )}
            </div>
          </div>

          {!isStarted ? (
            /* Start Screen */
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Ready to Start?</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Instructions</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Read each question carefully</li>
                      <li>• Select the best answer</li>
                      <li>• You can navigate between questions</li>
                      <li>• Submit when you&apos;re done</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Time Limit</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You have {test.settings.time_limit} minutes to complete
                      this test. The timer will start when you begin.
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Scoring</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your score will be calculated based on the number of
                      correct answers. Review your results after submission.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={handleStartTest}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3"
                  >
                    Start Test
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Test Interface */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Questions List */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Questions</h3>
                  <div className="space-y-2">
                    {test.questions.map((question, index) => {
                      const isAnswered = answers[question.id] !== undefined;
                      const isCurrent = index === currentQuestionIndex;
                      return (
                        <Button
                          key={question.id}
                          variant={isCurrent ? "primary" : "outline"}
                          size="sm"
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`w-full justify-start text-left ${isAnswered ? "border border-green-500" : ""}`}
                        >
                          <span className="mr-2 font-medium">{index + 1}</span>
                          <span className="flex-1 truncate">
                            {question.content.question}
                          </span>
                          {isAnswered && (
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Current Question */}
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {isStarted && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-mono">
                          {formatTime(timeLeft)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="text-lg font-medium">
                      {currentQuestion.content.question}
                    </div>

                    <div className="space-y-3">
                      {currentQuestion.content.options.map((option, index) => (
                        <label
                          key={index}
                          className="flex items-center space-x-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={index}
                            checked={answers[currentQuestion.id] === index}
                            onChange={(e) =>
                              handleAnswerChange(
                                currentQuestion.id,
                                parseInt(e.target.value),
                              )
                            }
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-900 dark:text-white">
                            {String.fromCharCode(65 + index)}. {option}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className="flex justify-between">
                      <div className="flex gap-2">
                        <Button 
                          onClick={handlePrevQuestion}
                          disabled={currentQuestionIndex === 0}
                          variant="secondary"
                        >
                          Previous
                        </Button>
                        <Button 
                          onClick={handleNextQuestion}
                          disabled={currentQuestionIndex === totalQuestions - 1}
                          variant="secondary"
                        >
                          Next
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleSubmitTest}
                          disabled={Object.keys(answers).length === 0}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Submit Test
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
