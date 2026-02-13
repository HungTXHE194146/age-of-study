'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import { Question, SortOption } from "@/types/teacher";
import { sortOptions } from "@/constants/teacherConstants";
import { Check, ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";

interface QuizReviewListProps {
  questions: Question[];
  onRemoveQuestion?: (id: string) => void;
}

export function QuizReviewList({
  questions,
  onRemoveQuestion,
}: QuizReviewListProps) {
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  const sortedQuestions = [...questions].sort((a, b) => {
    switch (sortBy) {
      case "difficulty":
        const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3, Mixed: 4 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      case "date":
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      default:
        return a.number - b.number;
    }
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Review Questions
          </h2>
          <Badge
            variant="secondary"
            className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800"
          >
            {questions.length} Generated
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort questions by"
            className="w-[180px] flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                Sort by: {option.label}
              </option>
            ))}
          </select>        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Drag to reorder</span>
          <MoreHorizontal className="w-4 h-4" />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {sortedQuestions.map((question, index) => (
          <div
            key={question.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {question.number}
                </span>
                <Badge
                  variant="outline"
                  className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                >
                  {question.type}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800"
                >
                  {question.difficulty}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {question.topic}
                </span>
                {onRemoveQuestion && (
                  <button
                    onClick={() => onRemoveQuestion(question.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Xóa câu hỏi"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-6">
              <p className="text-gray-900 dark:text-white text-lg leading-relaxed">
                {question.questionText}
              </p>
            </div>

            {/* Answer Display */}
            {question.type === 'MULTIPLE_CHOICE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      option.isCorrect
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {option.label}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {option.text}
                        </span>
                      </div>
                      {option.isCorrect && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <Check className="w-5 h-5" />
                          <span className="text-sm font-medium">Correct</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {question.type === 'TRUE_FALSE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      option.isCorrect
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {option.label === 'A' ? 'TRUE' : 'FALSE'}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {option.text}
                        </span>
                      </div>
                      {option.isCorrect && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <Check className="w-5 h-5" />
                          <span className="text-sm font-medium">Correct</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {question.type === 'ESSAY' && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Essay Question
                  </span>
                  <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                    No specific answer
                  </Badge>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  This is an essay question. Students will need to provide a written response.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
