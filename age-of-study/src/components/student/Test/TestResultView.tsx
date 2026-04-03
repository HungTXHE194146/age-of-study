"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Question,
  TestWithQuestions,
  SubmissionResult,
  QuestionOption,
} from "@/types/test";
import { Button } from "@/components/ui/button";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

interface TestResultViewProps {
  test: TestWithQuestions;
  submissionResult: SubmissionResult;
  timeLeft: number;
  onBackToMain: () => void;
  onRetry: () => void;
}

export default function TestResultView({
  test,
  submissionResult,
  timeLeft,
  onBackToMain,
  onRetry,
}: TestResultViewProps) {
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
        <StatCard
          label="XP Nhận"
          value={`+${submissionResult.xp_earned || 0}`}
          color="text-amber-500"
          bg="bg-amber-100"
          icon="✨"
          rotate="-rotate-2"
        />
        <StatCard
          label="Điểm số"
          value={`${score}%`}
          color="text-green-500"
          bg="bg-green-100"
          icon="📊"
          rotate="-rotate-2"
        />
        <StatCard
          label="Câu đúng"
          value={String(submissionResult.correctAnswers)}
          color="text-blue-500"
          bg="bg-blue-100"
          icon="✅"
          rotate="rotate-2"
        />
        <StatCard
          label="Tổng câu"
          value={String(submissionResult.totalQuestions)}
          color="text-slate-800"
          bg="bg-purple-100"
          icon="📝"
          rotate="-rotate-1"
        />
        <StatCard
          label="Thời gian"
          value={`${Math.floor((test.settings.time_limit * 60 - timeLeft) / 60)}:${((test.settings.time_limit * 60 - timeLeft) % 60).toString().padStart(2, "0")}`}
          color="text-orange-500"
          bg="bg-orange-100"
          icon="⏱️"
          rotate="rotate-1"
        />
      </div>

      {/* Question Review */}
      <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 relative z-10">
        <h3 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-widest border-b-4 border-slate-800 pb-4 inline-block">
          Xem lại câu hỏi
        </h3>

        <div className="space-y-8">
          {submissionResult.questions.map((question, index) => (
            <QuestionReviewItem
              key={question.id}
              index={index}
              question={question}
              userAnswer={submissionResult.answers.find(
                (a) => a.question_id === question.id,
              )}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t-4 border-slate-800">
          <Button
            onClick={onBackToMain}
            className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-black px-8 py-4 text-xl rounded-xl border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all h-auto"
          >
            QUAY LẠI MÀN HÌNH CHÍNH
          </Button>
          <Button
            onClick={onRetry}
            className="flex-1 bg-white !text-slate-800 font-bold px-8 py-4 text-xl rounded-xl border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all h-auto"
          >
            THỬ LẠI LẦN NỮA
          </Button>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  bg: string;
  icon: string;
  rotate: string;
}

function StatCard({ label, value, color, bg, icon, rotate }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`bg-white rounded-3xl p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 transform ${rotate}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black uppercase text-slate-500 mb-1">
            {label}
          </p>
          <p className={`text-4xl font-black ${color}`}>{value}</p>
        </div>
        <div
          className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center border-2 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform rotate-6`}
        >
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </motion.div>
  );
}

function QuestionReviewItem({
  index,
  question,
  userAnswer,
}: {
  index: number;
  question: Question;
  userAnswer: SubmissionResult["answers"][number] | undefined;
}) {
  const isCorrect = userAnswer?.is_correct;
  const qType = (question.content?.type || question.q_type || "").toUpperCase();

  return (
    <div
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

          {question.content?.passage && (
            <blockquote className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl text-slate-600 text-sm font-medium leading-relaxed italic">
              {question.content.passage}
            </blockquote>
          )}

          <h4
            className="text-xl font-bold text-slate-800 mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(
                question.content?.question ||
                  question.content?.questionText ||
                  (question.content as any)?.text ||
                  "Câu hỏi không có nội dung",
              ),
            }}
          />

          <div className="grid grid-cols-1 gap-6 mb-6">
            <QuestionResultRenderer
              qType={qType}
              question={question}
              userAnswer={userAnswer}
              isCorrect={isCorrect}
            />
          </div>

          {(() => {
            const explanation =
              question.explanation ||
              question.content?.explanation ||
              (question.content as any)?.metadata?.explanation;

            if (!explanation) return null;

            return (
              <div className="mt-8 bg-amber-50 p-6 rounded-[2rem] border-4 border-amber-400 shadow-[6px_6px_0_0_rgba(251,191,36,1)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <span className="text-6xl">🎓</span>
                </div>
                <h5 className="flex items-center gap-2 text-xl font-black text-amber-800 mb-4 uppercase tracking-tight">
                  <span className="text-3xl">💡</span> Giải thích từ Giáo sư Cú
                </h5>
                <div
                  className="text-amber-900 font-bold leading-relaxed text-lg"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(explanation),
                  }}
                />
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

interface QuestionResultRendererProps {
  qType: string;
  question: Question;
  userAnswer: SubmissionResult["answers"][number] | undefined;
  isCorrect: boolean | undefined;
}

function QuestionResultRenderer({
  qType,
  question,
  userAnswer,
  isCorrect,
}: QuestionResultRendererProps) {
  switch (qType) {
    case "WORD_ORDERING":
      const studentWords = userAnswer?.text_answer
        ? userAnswer.text_answer.startsWith("[")
          ? JSON.parse(userAnswer.text_answer)
          : userAnswer.text_answer.split(" ")
        : [];
      const correctWords = question.content?.metadata?.orderedWords || [];
      return (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300">
            <p className="text-sm font-bold uppercase text-slate-500 mb-2">
              Câu trả lời của bạn:
            </p>
            <div className="flex flex-wrap gap-2">
              {studentWords.length > 0 ? (
                studentWords.map((word: string, i: number) => (
                  <span
                    key={i}
                    className={`px-3 py-1 rounded-lg border-2 font-bold ${
                      word === correctWords[i]
                        ? "bg-green-100 border-green-400 text-green-700"
                        : "bg-red-100 border-red-400 text-red-700"
                    }`}
                  >
                    {word}
                  </span>
                ))
              ) : (
                <span className="text-red-500 italic">
                  Em chưa sắp xếp câu này
                </span>
              )}
            </div>
          </div>
          {!isCorrect && (
            <div className="bg-green-50 p-5 rounded-2xl border-2 border-green-400">
              <p className="text-sm font-bold uppercase text-green-700 mb-2">
                Đáp án đúng:
              </p>
              <div className="flex flex-wrap gap-2">
                {correctWords.map((word: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-white rounded-lg border-2 border-green-200 text-green-800 font-bold"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case "MATCHING":
      const studentPairs = userAnswer?.text_answer
        ? (JSON.parse(userAnswer.text_answer) as Array<{
            left: string;
            right: string;
          }>)
        : [];
      const correctPairs = question.content?.metadata?.matchingPairs || [];
      return (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300">
            <p className="text-sm font-bold uppercase text-slate-500 mb-2">
              Các cặp em đã nối:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {studentPairs.length > 0 ? (
                studentPairs.map((pair, i) => {
                  const isMatchCorrect = correctPairs.some(
                    (cp: any) =>
                      cp.left === pair.left && cp.right === pair.right,
                  );
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border-2 flex items-center justify-between gap-2 font-bold ${
                        isMatchCorrect
                          ? "bg-green-50 border-green-300 text-green-700"
                          : "bg-red-50 border-red-300 text-red-700"
                      }`}
                    >
                      <span>{pair.left}</span>
                      <span>↔</span>
                      <span>{pair.right}</span>
                    </div>
                  );
                })
              ) : (
                <span className="text-red-500 italic">Em chưa nối cặp nào</span>
              )}
            </div>
          </div>
          {!isCorrect && (
            <div className="bg-green-50 p-5 rounded-2xl border-2 border-green-400">
              <p className="text-sm font-bold uppercase text-green-700 mb-2">
                Đáp án đúng:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {correctPairs.map((pair: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-white rounded-xl border-2 border-green-200 text-green-800 font-bold flex items-center justify-between gap-2"
                  >
                    <span>{pair.left}</span>
                    <span>↔</span>
                    <span>{pair.right}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case "FILL_IN_BLANKS":
      const studentBlanks = userAnswer?.text_answer?.split("|") || [];
      const correctBlanks = question.content?.metadata?.blanks || [];
      const textSegments = (
        question.content?.metadata?.sentence ||
        question.content?.questionText ||
        question.content?.question ||
        ""
      ).split(/_{3,}/);
      return (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 leading-loose text-lg font-medium">
            <p className="text-sm font-bold uppercase text-slate-500 mb-4">
              Bài làm của em:
            </p>
            {textSegments.map((segment: string, i: number) => (
              <span key={i}>
                {segment}
                {i < textSegments.length - 1 && (
                  <span
                    className={`mx-1 px-2 py-0.5 rounded border-b-2 font-bold ${
                      studentBlanks[i]?.trim().toLowerCase() ===
                      correctBlanks[i]?.answer.trim().toLowerCase()
                        ? "bg-green-100 border-green-500 text-green-700"
                        : "bg-red-100 border-red-500 text-red-700"
                    }`}
                  >
                    {studentBlanks[i] || "..."}
                  </span>
                )}
              </span>
            ))}
          </div>
          {!isCorrect && (
            <div className="bg-green-50 p-5 rounded-2xl border-2 border-green-400">
              <p className="text-sm font-bold uppercase text-green-700 mb-2">
                Đáp án đúng:
              </p>
              <div className="flex flex-wrap gap-4">
                {correctBlanks.map((blank: any, i: number) => (
                  <span key={i} className="font-bold text-green-800">
                    Ô {i + 1}:{" "}
                    <span className="bg-white px-2 py-1 rounded border border-green-300">
                      {blank.answer}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case "CATEGORIZATION":
      const studentCats = userAnswer?.text_answer
        ? (JSON.parse(userAnswer.text_answer) as Array<{
            name: string;
            items: string[];
          }>)
        : [];
      const correctCats = question.content?.metadata?.categories || [];
      return (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300">
            <p className="text-sm font-bold uppercase text-slate-500 mb-4">
              Phân loại của em:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentCats.length > 0 ? (
                studentCats.map((cat, i) => {
                  const correctCat = correctCats.find(
                    (cc: any) => cc.name === cat.name,
                  );
                  return (
                    <div
                      key={i}
                      className="p-4 rounded-xl border-2 border-slate-200"
                    >
                      <p className="font-black text-slate-700 mb-2 uppercase text-xs">
                        {cat.name}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cat.items.map((item, j) => {
                          const isItemInCat = correctCat?.items.includes(item);
                          return (
                            <span
                              key={j}
                              className={`px-2 py-1 rounded-lg border font-bold text-sm ${
                                isItemInCat
                                  ? "bg-green-100 border-green-400 text-green-700"
                                  : "bg-red-100 border-red-400 text-red-700"
                              }`}
                            >
                              {item}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <span className="text-red-500 italic">Em chưa phân loại</span>
              )}
            </div>
          </div>
          {!isCorrect && (
            <div className="bg-green-50 p-5 rounded-2xl border-2 border-green-400">
              <p className="text-sm font-bold uppercase text-green-700 mb-2">
                Đáp án đúng:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {correctCats.map((cat: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 bg-white rounded-xl border-2 border-green-200"
                  >
                    <p className="font-black text-green-800 mb-2 uppercase text-xs">
                      {cat.name}
                    </p>
                    <p className="text-green-900 font-bold">
                      {cat.items.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case "FIND_ERROR":
      const studentError = userAnswer?.text_answer || "";
      const errorInfo = question.content?.metadata?.errorPosition;
      const fullText =
        question.content?.metadata?.sentence ||
        question.content?.questionText ||
        question.content?.question ||
        "";

      // Decompose complex conditionals into meaningful variables
      const getSnappedStart = (start: number) => {
        let s = start;
        while (s > 0 && fullText[s - 1] !== " " && fullText[s - 1] !== "\n")
          s--;
        return s;
      };
      const getSnappedEnd = (end: number) => {
        let e = end;
        while (
          e < fullText.length - 1 &&
          fullText[e + 1] !== " " &&
          fullText[e + 1] !== "\n"
        )
          e++;
        return e;
      };

      const snappedStart = getSnappedStart(errorInfo?.startIndex || 0);
      const snappedEnd = getSnappedEnd(errorInfo?.endIndex || 0);
      const correctErrorPart = fullText.substring(snappedStart, snappedEnd + 1);

      return (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300">
            <p className="text-sm font-bold uppercase text-slate-500 mb-2">
              Lỗi em đã chọn:
            </p>
            {studentError ? (
              <p className="text-lg font-bold">
                <span
                  className={`px-2 py-1 rounded border-2 ${
                    isCorrect
                      ? "bg-green-100 border-green-400 text-green-700"
                      : "bg-red-100 border-red-400 text-red-700"
                  }`}
                >
                  {studentError}
                </span>
              </p>
            ) : (
              <span className="text-red-500 italic">Em chưa chọn lỗi nào</span>
            )}
          </div>
          {!isCorrect && (
            <div className="bg-green-50 p-5 rounded-2xl border-2 border-green-400">
              <p className="text-sm font-bold uppercase text-green-700 mb-2">
                Đáp án đúng:
              </p>
              <p className="text-lg font-bold">
                Sửa lỗi:{" "}
                <span className="text-red-600 line-through">
                  {correctErrorPart || "..."}
                </span>
                {" → "}
                <span className="text-green-700">{errorInfo?.correctText}</span>
              </p>
            </div>
          )}
        </div>
      );

    case "ESSAY":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300">
            <p className="text-sm font-bold uppercase text-slate-500 mb-2">
              Câu trả lời của bạn:
            </p>
            <div className="p-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg whitespace-pre-wrap font-bold text-lg text-slate-800">
              {userAnswer?.text_answer || (
                <span className="text-red-500 italic">
                  Em đã không để lại câu trả lời
                </span>
              )}
            </div>
          </div>
          <div className="bg-green-100 p-5 rounded-2xl border-2 border-green-400">
            <p className="text-sm font-bold uppercase text-green-700 mb-2">
              Gợi ý / Đáp án mẫu:
            </p>
            <p className="font-bold text-lg text-green-900 whitespace-pre-wrap">
              {question.model_answer || "Không có gợi ý"}
            </p>
          </div>
        </div>
      );

    default: // MULTIPLE_CHOICE or TRUE_FALSE
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-300">
              <p className="text-sm font-bold uppercase text-slate-500 mb-2">
                Câu trả lời của bạn:
              </p>
              <div className="font-bold text-lg text-slate-800">
                {userAnswer?.selected_option_index !== undefined ? (
                  <>
                    {String.fromCharCode(65 + userAnswer.selected_option_index)}
                    .{" "}
                    {(() => {
                      const opt = (question.content.options || [])[
                        userAnswer.selected_option_index
                      ];
                      return typeof opt === "string" ? opt : opt?.text;
                    })() || "Lỗi dữ liệu"}
                  </>
                ) : (
                  <span className="text-red-500 italic">
                    Em đã không chọn đáp án
                  </span>
                )}
              </div>
            </div>
            {!isCorrect && (
              <div className="bg-green-100 p-5 rounded-2xl border-2 border-green-400">
                <p className="text-sm font-bold uppercase text-green-700 mb-2">
                  Đáp án đúng:
                </p>
                <p className="font-bold text-lg text-green-900">
                  {String.fromCharCode(
                    65 + (question.correct_option_index ?? 0),
                  )}
                  .{" "}
                  {(() => {
                    const opt = (question.content.options || [])[
                      question.correct_option_index ?? 0
                    ];
                    return typeof opt === "string" ? opt : opt?.text;
                  })() || ""}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t-2 border-dashed border-slate-300">
            {(question.content.options || []).map(
              (option: string | QuestionOption, optionIndex: number) => {
                const isUserAnswer =
                  optionIndex === (userAnswer?.selected_option_index ?? -1);
                const isCorrectOption =
                  optionIndex === question.correct_option_index;

                let optionClasses = "border-slate-300 bg-white text-slate-500";
                if (isCorrectOption)
                  optionClasses =
                    "border-green-500 bg-green-100 text-green-900 shadow-[2px_2px_0_0_rgba(34,197,94,1)]";
                else if (isUserAnswer && !isCorrectOption)
                  optionClasses =
                    "border-red-500 bg-red-100 text-red-900 shadow-[2px_2px_0_0_rgba(239,68,68,1)]";

                const optionText =
                  typeof option === "string" ? option : option?.text || "";

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
                      <span className="flex-1">{optionText}</span>
                      {isCorrectOption && <span className="text-xl">🌟</span>}
                      {isUserAnswer && !isCorrectOption && (
                        <span className="text-xl">❌</span>
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      );
  }
}
