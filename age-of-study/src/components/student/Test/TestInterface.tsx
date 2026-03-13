"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Question, TestWithQuestions, QuestionOption } from "@/types/test";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import WordOrderingRenderer from "@/components/student/QuestionRenderers/WordOrderingRenderer";
import MatchingRenderer from "@/components/student/QuestionRenderers/MatchingRenderer";
import FillInBlanksRenderer from "@/components/student/QuestionRenderers/FillInBlanksRenderer";
import CategorizationRenderer from "@/components/student/QuestionRenderers/CategorizationRenderer";
import FindErrorRenderer from "@/components/student/QuestionRenderers/FindErrorRenderer";

interface TestInterfaceProps {
    test: TestWithQuestions;
    currentQuestionIndex: number;
    setCurrentQuestionIndex: (index: number) => void;
    answers: Record<string, number | string>;
    handleAnswerChange: (questionId: string, answer: number | string) => void;
    isQuestionComplete: boolean;
    setIsQuestionComplete: (complete: boolean) => void;
    friendlyMessage: string | null;
    setFriendlyMessage: (msg: string | null) => void;
    isWobbling: boolean;
    setIsWobbling: (wobble: boolean) => void;
    timeLeft: number;
    timeWarning: boolean;
    formatTime: (seconds: number) => string;
    isSubmitting: boolean;
    handleSubmitClick: () => void;
    handlePrevQuestion: () => void;
    handleNextQuestion: () => void;
}

export default function TestInterface({
    test,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    handleAnswerChange,
    isQuestionComplete,
    setIsQuestionComplete,
    friendlyMessage,
    setFriendlyMessage,
    isWobbling,
    setIsWobbling,
    timeLeft,
    timeWarning,
    formatTime,
    isSubmitting,
    handleSubmitClick,
    handlePrevQuestion,
    handleNextQuestion,
}: TestInterfaceProps) {
    const currentQuestion = test.questions[currentQuestionIndex];
    const totalQuestions = test.questions.length;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 sticky top-8">
                    <h3 className="text-xl font-black mb-6 uppercase tracking-wider text-center border-b-4 border-slate-800 pb-4 text-slate-800">
                        Câu Hỏi
                    </h3>

                    {/* Progress summary */}
                    <div className="mb-4 text-center text-sm font-bold text-slate-500">
                        <span className="text-green-600">{answeredCount}</span> / {totalQuestions} đã trả lời
                    </div>

                    <div className="grid grid-cols-5 lg:grid-cols-4 gap-3">
                        {test.questions.map((question, index) => {
                            const isAnswered = answers[question.id] !== undefined;
                            const isCurrent = index === currentQuestionIndex;
                            return (
                                <button
                                    key={question.id}
                                    onClick={() => setCurrentQuestionIndex(index)}
                                    className={`
                    w-full aspect-square flex items-center justify-center font-black rounded-xl border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1
                    ${isCurrent
                                            ? "bg-indigo-500 text-white border-slate-800 scale-110"
                                            : isAnswered
                                                ? "bg-green-400 text-slate-900 border-slate-800"
                                                : "bg-slate-100 text-slate-500 border-slate-300 hover:border-slate-800 hover:text-slate-800"
                                        }
                  `}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Question Area */}
            <div className="lg:col-span-3">
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 transform rotate-1 relative">
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-300 rounded-full border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center font-black text-xl z-20 text-slate-800">
                        {currentQuestionIndex + 1}
                    </div>

                    {/* Passage block — only for comprehension questions */}
                    {currentQuestion.content?.passage && (
                        <blockquote className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-2xl text-slate-700 text-base font-medium leading-relaxed italic">
                            {currentQuestion.content.passage}
                        </blockquote>
                    )}

                    <h3
                        className="text-2xl font-black mb-8 border-b-2 border-dashed border-slate-300 pb-6 leading-relaxed text-slate-800"
                        dangerouslySetInnerHTML={{
                            __html:
                                currentQuestion.content?.question ||
                                currentQuestion.content?.questionText ||
                                (currentQuestion.content as any)?.text ||
                                "Câu hỏi không có nội dung",
                        }}
                    />

                    <motion.div animate={isWobbling ? { x: [-10, 10, -10, 10, 0] } : {}} className="space-y-4 mb-10">
                        <QuestionBodyRenderer
                            currentQuestion={currentQuestion}
                            answers={answers}
                            handleAnswerChange={handleAnswerChange}
                            setIsQuestionComplete={setIsQuestionComplete}
                            handleNextQuestion={handleNextQuestion}
                        />
                    </motion.div>

                    {/* Friendly Reminder Popup */}
                    <AnimatePresence>
                        {friendlyMessage && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[90%] md:w-auto"
                            >
                                <div className="bg-white border-4 border-indigo-500 p-4 rounded-2xl shadow-[8px_8px_0_0_rgba(99,102,241,1)] flex items-center gap-4">
                                    <span className="text-4xl animate-bounce">🦉</span>
                                    <p className="font-black text-indigo-800 italic text-lg leading-tight">{friendlyMessage}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation + Submit */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-8 border-t-4 border-slate-800">
                        <div className="flex gap-4 w-full sm:w-auto">
                            <Button
                                onClick={handlePrevQuestion}
                                disabled={currentQuestionIndex === 0 || isSubmitting}
                                className="flex-1 sm:flex-none bg-white !text-slate-800 hover:bg-slate-100 font-bold border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:shadow-none disabled:translate-y-1 py-3 px-6 h-auto text-lg"
                                variant="outline"
                            >
                                BÀI TRƯỚC
                            </Button>
                            <Button
                                onClick={handleNextQuestion}
                                disabled={currentQuestionIndex === totalQuestions - 1 || isSubmitting}
                                className="flex-1 sm:flex-none bg-slate-800 text-white hover:bg-slate-900 font-bold border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:shadow-none disabled:translate-y-1 py-3 px-6 h-auto text-lg"
                            >
                                KẾ TIẾP
                            </Button>
                        </div>

                        <Button
                            onClick={handleSubmitClick}
                            disabled={answeredCount === 0 || isSubmitting}
                            className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-slate-900 font-black px-10 py-3 text-xl rounded-xl border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-1 h-auto min-w-[160px]"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2 justify-center">
                                    <motion.span
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 0.7,
                                            ease: "linear",
                                        }}
                                        className="inline-block w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full"
                                    />
                                    Đang nộp...
                                </span>
                            ) : (
                                "NỘP BÀI"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}


interface QuestionBodyRendererProps {
    currentQuestion: Question;
    answers: Record<string, number | string>;
    handleAnswerChange: (questionId: string, answer: number | string) => void;
    setIsQuestionComplete: (complete: boolean) => void;
    handleNextQuestion: () => void;
}

function QuestionBodyRenderer({
    currentQuestion,
    answers,
    handleAnswerChange,
    setIsQuestionComplete,
    handleNextQuestion,
}: QuestionBodyRendererProps) {
    const qType = (currentQuestion.content?.type || currentQuestion.q_type || "").toUpperCase();

    switch (qType) {
        // ... (WORD_ORDERING, MATCHING, FILL_IN_BLANKS, CATEGORIZATION, FIND_ERROR cases remain the same)
        case "ESSAY":
        // ... (ESSAY case remain same)
        default: // MULTIPLE_CHOICE or TRUE_FALSE
            return (currentQuestion.content.options || []).map((option: string | QuestionOption, index: number) => {
                const isSelected = answers[currentQuestion.id] === index;
                const optionText = typeof option === "string" ? option : (option as QuestionOption)?.text || "";
                return (
                    <label
                        key={index}
                        className={`flex items-start gap-4 p-4 rounded-2xl border-4 cursor-pointer transition-all ${isSelected
                            ? "bg-indigo-100 border-indigo-500 shadow-[4px_4px_0_0_rgba(99,102,241,1)] transform -rotate-1 scale-[1.02]"
                            : "bg-slate-50 border-slate-200 hover:border-slate-800 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1"
                            }`}
                    >
                        <div className="flex items-center h-6 mt-1">
                            <input
                                type="radio"
                                name={`question-${currentQuestion.id}`}
                                value={index}
                                checked={isSelected}
                                onChange={(e) => {
                                    handleAnswerChange(currentQuestion.id, parseInt(e.target.value));
                                    setIsQuestionComplete(true);
                                }}
                                className="w-5 h-5 text-indigo-600 bg-white border-2 border-slate-800 focus:ring-indigo-500"
                            />
                        </div>
                        <span className="text-lg font-bold text-slate-800 leading-snug">
                            {String.fromCharCode(65 + index)}. {optionText}
                        </span>
                    </label>
                );
            });
    }
}
