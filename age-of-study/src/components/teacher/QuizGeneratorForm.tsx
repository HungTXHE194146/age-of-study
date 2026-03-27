"use client";

import { useState, useEffect } from "react";
import Loading from "@/components/ui/loading";
import { AIQuestionService } from "@/lib/aiQuestionService";

import {
  PlusCircle,
  FileText,
  Brain,
  Database,
  Wand2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import {
  NotebookBadge,
  NotebookButton,
  NotebookCard,
} from "@/components/ui/notebook-card";
import { Question } from "@/types/teacher";

interface QuizGeneratorFormProps {
  subjectId?: string;
  nodeId?: string;
  onQuestionsGenerated: (questions: Question[]) => void;
  onBankQuestionsSelected: (questions: Question[]) => void;
  bankQuestions?: Question[];
  isLoadingBank?: boolean;
}

export function QuizGeneratorForm({
  subjectId,
  nodeId,
  onQuestionsGenerated,
  onBankQuestionsSelected,
  bankQuestions = [],
  isLoadingBank = false,
}: QuizGeneratorFormProps) {
  const [source, setSource] = useState<"file" | "kb" | "topic">("topic");
  const [topic, setTopic] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Medium",
  );
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionTypesCount, setQuestionTypesCount] = useState<
    Record<string, number>
  >({
    MULTIPLE_CHOICE: 10,
    TRUE_FALSE: 0,
    ESSAY: 0,
    WORD_ORDERING: 0,
    MATCHING: 0,
    FILL_IN_BLANKS: 0,
    CATEGORIZATION: 0,
    FIND_ERROR: 0,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const aiService = new AIQuestionService();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
    }
  };

  const handleGenerate = async () => {
    if (source === "topic" && !topic.trim()) {
      alert("Vui lòng nhập chủ đề bài kiểm tra");
      return;
    }
    if (source === "file" && files.length === 0) {
      alert("Vui lòng chọn ít nhất một tệp tin");
      return;
    }

    setIsGenerating(true);
    try {
      const selectedTypes = Object.entries(questionTypesCount)
        .filter(([_, count]) => count > 0)
        .map(([type]) => type);

      const response = await aiService.generateQuestions({
        textPrompt: topic,
        questionCount: numQuestions,
        difficulty: difficulty,
        subject: subjectId,
        questionTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
        fromKnowledgeBase: source === "kb",
        onlyFromFile: source === "file",
        file: source === "file" ? files[0] : undefined,
      });

      if (response.questions && response.questions.length > 0) {
        // Map types to match teacher.ts Question interface
        const formattedQuestions = response.questions.map((q, idx) => ({
          ...q,
          id: `ai-${Date.now()}-${idx}`,
          createdAt: Date.now(),
          number: idx + 1,
          type: q.type as any,
          difficulty: q.difficulty as any,
        }));
        onQuestionsGenerated(formattedQuestions as any);
      } else {
        alert(
          "AI không tạo được câu hỏi nào. Vui lòng thử lại với yêu cầu khác.",
        );
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Đã có lỗi xảy ra khi tạo câu hỏi.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-blue-50 border-2 border-black p-4 rounded-2xl shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
          <h4 className="font-black text-blue-900 border-b-2 border-blue-200 pb-2 mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Nguồn học liệu đầu vào
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setSource("topic")}
              className={`p-3 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all ${source === "topic" ? "bg-white border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5" : "bg-transparent border-transparent text-gray-400 hover:bg-blue-100/50"}`}
            >
              <span className="text-2xl">📝</span>
              <span className="text-[10px] uppercase">Chủ đề</span>
            </button>
            <button
              onClick={() => setSource("file")}
              className={`p-3 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all ${source === "file" ? "bg-white border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5" : "bg-transparent border-transparent text-gray-400 hover:bg-blue-100/50"}`}
            >
              <span className="text-2xl">📁</span>
              <span className="text-[10px] uppercase">Tệp tin</span>
            </button>
            <button
              onClick={() => setSource("kb")}
              className={`p-3 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all ${source === "kb" ? "bg-white border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5" : "bg-transparent border-transparent text-gray-400 hover:bg-blue-100/50"}`}
            >
              <span className="text-2xl">🧠</span>
              <span className="text-[10px] uppercase">Học liệu</span>
            </button>
          </div>
        </div>

        {source === "topic" && (
          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
              Nhập nội dung/yêu cầu
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl focus:ring-0 shadow-[4px_4px_0_0_rgba(0,0,0,1)] font-bold text-gray-900"
              placeholder="Ví dụ: Tạo trắc nghiệm về danh từ, động từ, tính từ..."
            />
          </div>
        )}

        {source === "file" && (
          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
              Kéo thả tài liệu (.pdf, .docx)
            </label>
            <div className="border-2 border-dashed border-black rounded-2xl p-8 bg-white flex flex-col items-center gap-4 hover:bg-blue-50 cursor-pointer relative transition-colors shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-black text-gray-900">Chọn tệp từ máy tính</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                  Hỗ trợ PDF, DOCX tối đa 10MB
                </p>
              </div>
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="px-3 py-1 bg-blue-100 border-2 border-black rounded-lg text-xs font-black flex items-center gap-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                  >
                    {f.name}
                    <button
                      onClick={() =>
                        setFiles(files.filter((_, idx) => idx !== i))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
              Số lượng câu hỏi
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="w-12 h-10 flex items-center justify-center bg-white text-indigo-900 font-black rounded-xl border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                {numQuestions}
              </span>
            </div>
          </div>

          <div className="flex items-end pb-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-indigo-600 font-black text-xs uppercase tracking-wider flex items-center gap-1 hover:underline"
            >
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showAdvanced ? "Cài đặt cơ bản" : "Cài đặt nâng cao"}
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-indigo-900 uppercase tracking-wider">
                Mức độ khó của đề
              </label>
              <div className="flex gap-2">
                {(["Easy", "Medium", "Hard"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-lg border-2 font-black text-[10px] uppercase tracking-tighter transition-all ${difficulty === d ? "bg-indigo-600 text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] -translate-y-0.5" : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"}`}
                  >
                    {d === "Easy" ? "Dễ" : d === "Medium" ? "Vừa" : "Khó"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3 text-left">
              <label className="block text-[10px] font-black text-indigo-900 uppercase tracking-wider">
                Các loại câu hỏi muốn tạo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "MULTIPLE_CHOICE", label: "Trắc nghiệm" },
                  { id: "TRUE_FALSE", label: "Đúng/Sai" },
                  { id: "WORD_ORDERING", label: "Sắp xếp từ" },
                  { id: "MATCHING", label: "Nối cặp" },
                  { id: "FILL_IN_BLANKS", label: "Điền trống" },
                  { id: "CATEGORIZATION", label: "Phân loại" },
                  { id: "FIND_ERROR", label: "Tìm lỗi sai" },
                  { id: "ESSAY", label: "Tự luận" },
                ].map((type) => (
                  <label
                    key={type.id}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div
                      onClick={() => {
                        setQuestionTypesCount((prev) => ({
                          ...prev,
                          [type.id]: prev[type.id] > 0 ? 0 : 1,
                        }));
                      }}
                      className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-all ${questionTypesCount[type.id] > 0 ? "bg-indigo-500" : "bg-white"}`}
                    >
                      {questionTypesCount[type.id] > 0 && (
                        <div className="w-2 h-2 bg-white rounded-sm" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase tracking-tighter">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 font-bold italic mt-2">
                * AI sẽ cố gắng điều phối tỷ lệ câu hỏi phù hợp.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-5 bg-indigo-600 text-white font-black border-2 border-black rounded-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:bg-indigo-500 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-[0.2em] disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isGenerating ? (
            <>
              <Loading size="sm" message="ĐANG PHÂN TÍCH..." />
            </>
          ) : (
            <>✨ BẮT ĐẦU TẠO ĐỀ</>
          )}
        </button>
      </div>
    </div>
  );
}
