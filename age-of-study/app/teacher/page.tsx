"use client";

import { Sidebar } from "@/components/teacher/Sidebar";
import { QuizGeneratorForm } from "@/components/teacher/QuizGeneratorForm";
import { QuizReviewList } from "@/components/teacher/QuizReviewList";
import { useState } from "react";
import { mockQuestions } from "@/constants/teacherMockData";
import { Question } from "@/types/teacher";

export default function TeacherDashboard() {
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = (data: {
    topic: string;
    difficulty: string;
    questionCount: number;
    file?: File | null;
  }) => {
    console.log("Generating questions with data:", data);
    setIsLoading(true);

    // Simulate AI generation delay
    setTimeout(() => {
      setIsLoading(false);
      // For now, just use the mock questions
      setQuestions(mockQuestions);
    }, 2000);
  };

  const handleSaveDraft = () => {
    console.log("Saving draft...");
    alert("Draft saved successfully!");
  };

  const handlePublish = () => {
    console.log("Publishing quiz...");
    alert("Quiz published successfully!");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Quizzes
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create and manage quizzes for your students
            </p>
          </div>

          {/* Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Generator Panel */}
            <div>
              <QuizGeneratorForm
                onGenerate={handleGenerate}
                isLoading={isLoading}
              />
            </div>

            {/* Review Panel */}
            <div>
              <QuizReviewList
                questions={questions}
                onPublish={handlePublish}
                onSaveDraft={handleSaveDraft}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
