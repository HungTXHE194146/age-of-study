'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { CloudUpload, FileText, X, Loader2 } from "lucide-react";
import { GeneratorFormState, DifficultyLevel, Subject } from "@/types/teacher";
import { subjectService } from "@/lib/subjectService";
import {
  difficultyOptions,
  questionCountOptions,
} from "@/constants/teacherConstants";

interface QuizGeneratorFormProps {
  onGenerate: (data: GeneratorFormState) => void;
  isLoading?: boolean;
}

export function QuizGeneratorForm({
  onGenerate,
  isLoading = false,
}: QuizGeneratorFormProps) {
  const [formData, setFormData] = useState<GeneratorFormState>({
    topic: "",
    difficulty: "Easy",
    questionCount: 10,
    file: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  // Fetch subjects from Supabase
  useEffect(() => {
    async function fetchSubjects() {
      try {
        setIsLoadingSubjects(true);
        const subjectList = await subjectService.getSubjects();
        setSubjects(subjectList);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      } finally {
        setIsLoadingSubjects(false);
      }
    }

    fetchSubjects();
  }, []);

  const handleFileUpload = (file: File) => {
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleFileRemove = () => {
    setFormData((prev) => ({ ...prev, file: null }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Generate Content
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <CloudUpload className="w-4 h-4" />
          <span>AI-Powered</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {formData.file ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.file.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFileRemove}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <CloudUpload className="w-12 h-12 mx-auto text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  PDF, DOCX up to 10MB
                </p>
              </div>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
              >
                Choose File
              </label>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center">
          <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
          <span className="px-4 text-sm text-gray-500 dark:text-gray-400">
            OR USE PROMPT
          </span>
          <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
        </div>

        {/* Topic/Instructions */}
        <div className="space-y-2">
          <Label
            htmlFor="topic"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Topic/Instructions
          </Label>
          <Textarea
            id="topic"
            placeholder="Enter specific topics, key concepts, or instructions for the AI to generate questions..."
            value={formData.topic}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, topic: e.target.value }))
            }
            className="min-h-[120px] resize-none"
            required
          />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="subject"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Subject
            </Label>
            <select
              id="subject"
              value={formData.subject || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  subject: e.target.value,
                }))
              }
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Select a subject...</option>
              {isLoadingSubjects ? (
                <option disabled>Loading subjects...</option>
              ) : (
                subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="difficulty"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Difficulty
            </Label>
            <select
              id="difficulty"
              value={formData.difficulty}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  difficulty: e.target.value as DifficultyLevel,
                }))
              }
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="questionCount"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Question Count
            </Label>
            <select
              id="questionCount"
              value={formData.questionCount.toString()}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  questionCount: parseInt(e.target.value),
                }))
              }
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {questionCountOptions.map((option) => (
                <option key={option.value} value={option.value.toString()}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isLoading || (!formData.topic.trim() && !formData.file)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              <span>✨</span>
              {isLoading ? "Generating..." : "Generate Questions with AI"}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}
