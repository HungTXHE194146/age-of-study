'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { CloudUpload, FileText, X, Loader2, AlertCircle } from "lucide-react";
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
  const [fileError, setFileError] = useState<string | null>(null);

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
    // Validate MIME type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!validTypes.includes(file.type)) {
      setFileError('Invalid file type. Please upload PDF or DOCX files only.');
      return;
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setFileError(`File size exceeds 10MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
      return;
    }
    
    // Clear any previous errors and set the file
    setFileError(null);
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleFileRemove = () => {
    setFormData((prev) => ({ ...prev, file: null }));
    setFileError(null);
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
    <div className="bg-[#fffdf8] rounded-xl border-2 border-black p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative mt-4">
      {/* Decorative inner pins */}
      <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-blue-200 border-2 border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)]"></div>
      <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-blue-200 border-2 border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)]"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dashed border-gray-300 ml-4 mr-4 mt-2">
        <h2 className="text-3xl font-black text-gray-900 font-handwritten tracking-tight">
          Tạo Câu Hỏi bằng AI
        </h2>
        <div className="flex items-center gap-2 font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
          <CloudUpload className="w-5 h-5" />
          <span className="text-sm">Trí tuệ nhân tạo</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 px-4">
        {/* File Upload Area */}
        <div>
          <div
            className={`border-4 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer relative overflow-hidden ${
              isDragging
                ? "border-blue-400 bg-blue-50"
                : fileError
                  ? "border-red-400 bg-red-50 relative"
                  : "border-gray-400 bg-white hover:bg-gray-50 hover:border-blue-400"
            }`}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
             onClick={() => document.getElementById('file-upload')?.click()}
          >
            {formData.file ? (
            <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <FileText className="w-10 h-10 text-blue-600" />
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-lg">
                    {formData.file.name}
                  </p>
                  <p className="font-bold text-gray-500">
                    {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFileRemove}
                className="p-2 border-2 border-black rounded-lg bg-red-100 hover:bg-red-200 text-red-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3 pointer-events-none">
              <CloudUpload className="w-14 h-14 mx-auto text-blue-500" />
              <div>
                <p className="font-bold text-gray-900 text-lg">
                  Click hoặc kéo thả tài liệu vào đây
                </p>
                <p className="font-bold text-gray-500">
                  PDF, DOCX (Tối đa 10MB)
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="file-upload"
              />
            </div>
          )}
          </div>
          {fileError && (
             <div className="mt-3 bg-red-100 border-2 border-black text-red-800 font-bold px-4 py-2 rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center gap-2 w-max">
               <AlertCircle className="w-5 h-5 flex-shrink-0" />
               {fileError}
             </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center my-8">
          <div className="flex-1 border-t-2 border-dashed border-gray-400"></div>
          <span className="px-4 font-black font-handwritten text-gray-500 text-2xl tracking-tight">
            HOẶC DÙNG GỢI Ý
          </span>
          <div className="flex-1 border-t-2 border-dashed border-gray-400"></div>
        </div>

        {/* Topic/Instructions */}
        <div className="space-y-2">
          <label
            htmlFor="topic"
            className="block text-xl font-black text-gray-800 font-handwritten tracking-tight"
          >
            Chủ đề & Yêu cầu cụ thể
          </label>
          <textarea
            id="topic"
            placeholder="Ví dụ: Tạo 10 câu hỏi trắc nghiệm tiếng Anh lớp 6 về Unit 1..."
            value={formData.topic}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, topic: e.target.value }))
            }
            className="w-full min-h-[140px] p-4 bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2rem] leading-8 border-2 border-black rounded-lg resize-y focus:outline-none focus:ring-4 focus:ring-blue-100 transition-shadow font-medium text-gray-900"
            required={!formData.file}
          />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="space-y-2">
            <label
              htmlFor="subject"
              className="block text-xl font-black text-gray-800 font-handwritten tracking-tight"
            >
              Môn học
            </label>
            <select
              id="subject"
              value={formData.subject || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  subject: e.target.value,
                }))
              }
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg font-bold text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-100 appearance-none shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              <option value="">Chọn môn học...</option>
              {isLoadingSubjects ? (
                <option disabled>Đang tải môn học...</option>
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
            <label
              htmlFor="difficulty"
              className="block text-xl font-black text-gray-800 font-handwritten tracking-tight"
            >
              Độ khó
            </label>
            <select
              id="difficulty"
              value={formData.difficulty}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  difficulty: e.target.value as DifficultyLevel,
                }))
              }
               className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg font-bold text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-100 appearance-none shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="questionCount"
              className="block text-xl font-black text-gray-800 font-handwritten tracking-tight"
            >
              Số lượng câu hỏi
            </label>
            <select
              id="questionCount"
              value={formData.questionCount.toString()}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  questionCount: parseInt(e.target.value),
                }))
              }
               className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg font-bold text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-100 appearance-none shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
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
        <div className="pt-8">
          <button
            type="submit"
            disabled={isLoading || (!formData.topic.trim() && !formData.file)}
            className="w-full flex items-center justify-center gap-3 bg-[#ffde59] hover:bg-[#efce49] border-2 border-black text-black font-black py-4 px-6 rounded-lg text-lg transition-transform hover:-translate-y-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)] uppercase disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isLoading ? (
               <><Loader2 className="w-6 h-6 animate-spin" /> Đang tạo câu hỏi bằng AI...</>
            ) : (
               <><span>✨</span> Bắt đầu Nhờ AI Tạo Câu Hỏi</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
