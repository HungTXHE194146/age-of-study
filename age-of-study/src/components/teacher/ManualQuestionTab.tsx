import { useState } from "react";
import { Question } from "@/types/teacher";

interface ManualQuestionTabProps {
    questionsLength: number;
    onAddQuestion: (question: Question) => void;
}

export function ManualQuestionTab({ questionsLength, onAddQuestion }: ManualQuestionTabProps) {
    const [manualQuestionType, setManualQuestionType] = useState<
        "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY"
    >("MULTIPLE_CHOICE");
    const [manualQuestionText, setManualQuestionText] = useState("");
    const [manualDifficulty, setManualDifficulty] = useState<
        "Easy" | "Medium" | "Hard"
    >("Easy");
    const [manualOptions, setManualOptions] = useState([
        { id: "1", label: "A", text: "", isCorrect: false },
        { id: "2", label: "B", text: "", isCorrect: false },
        { id: "3", label: "C", text: "", isCorrect: false },
        { id: "4", label: "D", text: "", isCorrect: false },
    ]);
    const [manualCorrectAnswer, setManualCorrectAnswer] = useState("A");
    const [manualTrueFalseContent, setManualTrueFalseContent] = useState({
        true: "",
        false: "",
    });
    const [manualTrueFalseCorrectAnswer, setManualTrueFalseCorrectAnswer] =
        useState<"TRUE" | "FALSE">("TRUE");
    const [manualEssayHint, setManualEssayHint] = useState("");
    const [manualExplanation, setManualExplanation] = useState("");

    const handleAddClick = () => {
        // Validate required fields
        if (!manualQuestionText.trim()) {
            alert("Vui lòng nhập nội dung câu hỏi");
            return;
        }

        if (manualQuestionType === "MULTIPLE_CHOICE") {
            const hasEmptyOptions = manualOptions.some((option) => !option.text.trim());
            if (hasEmptyOptions) {
                alert("Vui lòng nhập đầy đủ nội dung cho tất cả các lựa chọn");
                return;
            }
        }

        if (manualQuestionType === "TRUE_FALSE") {
            if (!manualTrueFalseContent.true.trim() || !manualTrueFalseContent.false.trim()) {
                alert("Vui lòng nhập nội dung cho cả Đúng và Sai");
                return;
            }
        }

        if (manualQuestionType === "ESSAY") {
            if (!manualEssayHint.trim()) {
                alert("Vui lòng nhập gợi ý trả lời cho câu hỏi tự luận");
                return;
            }
        }

        // Create question object
        const newQuestion: Question = {
            id: Date.now().toString(),
            createdAt: Date.now(),
            number: questionsLength + 1,
            type: manualQuestionType,
            questionText: manualQuestionText,
            options:
                manualQuestionType === "MULTIPLE_CHOICE"
                    ? manualOptions.map((option) => ({
                        ...option,
                        isCorrect: option.label === manualCorrectAnswer,
                    }))
                    : manualQuestionType === "TRUE_FALSE"
                        ? [
                            {
                                id: "1",
                                label: "A",
                                text: manualTrueFalseContent.true,
                                isCorrect: manualTrueFalseCorrectAnswer === "TRUE",
                            },
                            {
                                id: "2",
                                label: "B",
                                text: manualTrueFalseContent.false,
                                isCorrect: manualTrueFalseCorrectAnswer === "FALSE",
                            },
                        ]
                        : [],
            difficulty: manualDifficulty,
            explanation: manualExplanation || undefined,
        };

        onAddQuestion(newQuestion);

        // Reset form
        setManualQuestionText("");
        setManualOptions([
            { id: "1", label: "A", text: "", isCorrect: false },
            { id: "2", label: "B", text: "", isCorrect: false },
            { id: "3", label: "C", text: "", isCorrect: false },
            { id: "4", label: "D", text: "", isCorrect: false },
        ]);
        setManualCorrectAnswer("A");
        setManualTrueFalseContent({ true: "", false: "" });
        setManualEssayHint("");
        setManualExplanation("");
    };

    return (
        <div className="space-y-4">
            <div className="bg-yellow-100/50 border-2 border-dashed border-gray-300 p-4 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-1 uppercase text-sm">
                    Tạo câu hỏi thủ công
                </h3>
                <p className="text-sm font-bold text-gray-600">
                    Nhập thông tin câu hỏi và các lựa chọn trả lời
                </p>
            </div>

            <div className="grid gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                        Nội dung câu hỏi
                    </label>
                    <textarea
                        rows={3}
                        value={manualQuestionText}
                        onChange={(e) => setManualQuestionText(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 border-dashed"
                        placeholder="Nhập nội dung câu hỏi..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                            Loại câu hỏi
                        </label>
                        <select
                            value={manualQuestionType}
                            onChange={(e) =>
                                setManualQuestionType(
                                    e.target.value as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY"
                                )
                            }
                            className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer"
                        >
                            <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                            <option value="TRUE_FALSE">Đúng/Sai</option>
                            <option value="ESSAY">Tự luận</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                            Độ khó
                        </label>
                        <select
                            value={manualDifficulty}
                            onChange={(e) =>
                                setManualDifficulty(
                                    e.target.value as "Easy" | "Medium" | "Hard"
                                )
                            }
                            className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer"
                        >
                            <option value="Easy">Dễ</option>
                            <option value="Medium">Trung bình</option>
                            <option value="Hard">Khó</option>
                        </select>
                    </div>
                </div>

                {/* Multiple Choice Options */}
                {manualQuestionType === "MULTIPLE_CHOICE" && (
                    <div className="space-y-4 bg-gray-50 border-2 border-black rounded-lg p-4 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-black text-gray-900 uppercase">
                                Lựa chọn trả lời
                            </h4>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (manualOptions.length > 3) {
                                            setManualOptions((prev) => prev.slice(0, -1));
                                            if (
                                                manualCorrectAnswer ===
                                                String.fromCharCode(64 + manualOptions.length)
                                            ) {
                                                setManualCorrectAnswer(
                                                    String.fromCharCode(64 + manualOptions.length - 1)
                                                );
                                            }
                                        }
                                    }}
                                    disabled={manualOptions.length <= 3}
                                    className="px-3 py-1 font-bold text-sm bg-red-100 border-2 border-black text-red-900 rounded-md hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5"
                                >
                                    - Xóa
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (manualOptions.length < 6) {
                                            const newOption = {
                                                id: (manualOptions.length + 1).toString(),
                                                label: String.fromCharCode(65 + manualOptions.length),
                                                text: "",
                                                isCorrect: false,
                                            };
                                            setManualOptions((prev) => [...prev, newOption]);
                                        }
                                    }}
                                    disabled={manualOptions.length >= 6}
                                    className="px-3 py-1 font-bold text-sm bg-green-100 border-2 border-black text-green-900 rounded-md hover:bg-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5"
                                >
                                    + Thêm
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {manualOptions.map((option, index) => (
                                <div key={option.id} className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-800 uppercase">
                                        Lựa chọn {option.label}
                                    </label>
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => {
                                            const updatedOptions = [...manualOptions];
                                            updatedOptions[index] = {
                                                ...option,
                                                text: e.target.value,
                                            };
                                            setManualOptions(updatedOptions);
                                        }}
                                        className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5"
                                        placeholder={`Nhập lựa chọn ${option.label}...`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* True/False Options */}
                {manualQuestionType === "TRUE_FALSE" && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                                Đáp án Đúng
                            </label>
                            <input
                                type="text"
                                value={manualTrueFalseContent.true}
                                onChange={(e) =>
                                    setManualTrueFalseContent({
                                        ...manualTrueFalseContent,
                                        true: e.target.value,
                                    })
                                }
                                className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5"
                                placeholder="Nhập nội dung cho Đúng..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                                Đáp án Sai
                            </label>
                            <input
                                type="text"
                                value={manualTrueFalseContent.false}
                                onChange={(e) =>
                                    setManualTrueFalseContent({
                                        ...manualTrueFalseContent,
                                        false: e.target.value,
                                    })
                                }
                                className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5"
                                placeholder="Nhập nội dung cho Sai..."
                            />
                        </div>
                    </div>
                )}

                {/* Essay Question */}
                {manualQuestionType === "ESSAY" && (
                    <div className="p-4 bg-gray-50 border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                        <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                            Gợi ý trả lời
                        </label>
                        <textarea
                            rows={4}
                            value={manualEssayHint}
                            onChange={(e) => setManualEssayHint(e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 border-dashed"
                            placeholder="Nhập gợi ý trả lời hoặc hướng dẫn chấm điểm..."
                        />
                    </div>
                )}

                {/* Answers Setup Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Multiple Choice Answer */}
                    {manualQuestionType === "MULTIPLE_CHOICE" && (
                        <div>
                            <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                                Đáp án đúng
                            </label>
                            <select
                                value={manualCorrectAnswer}
                                onChange={(e) => setManualCorrectAnswer(e.target.value)}
                                className="w-full px-4 py-3 bg-blue-50 border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer"
                            >
                                {manualOptions.map((option) => (
                                    <option key={option.id} value={option.label}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* True/False Answer */}
                    {manualQuestionType === "TRUE_FALSE" && (
                        <div>
                            <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                                Đáp án đúng
                            </label>
                            <select
                                value={manualTrueFalseCorrectAnswer}
                                onChange={(e) =>
                                    setManualTrueFalseCorrectAnswer(e.target.value as "TRUE" | "FALSE")
                                }
                                className="w-full px-4 py-3 bg-blue-50 border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer"
                            >
                                <option value="TRUE">Đúng</option>
                                <option value="FALSE">Sai</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Explanation Field */}
                <div>
                    <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                        Giải thích <span className="text-gray-500 font-normal normal-case">(không bắt buộc)</span>
                    </label>
                    <textarea
                        rows={3}
                        value={manualExplanation}
                        onChange={(e) => setManualExplanation(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 border-dashed"
                        placeholder="Nhập giải thích cho câu hỏi..."
                    />
                </div>

                <button
                    onClick={handleAddClick}
                    className="w-full px-4 py-3 bg-green-400 text-green-950 font-black border-2 border-black rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:bg-green-300 transition-all uppercase tracking-wide flex justify-center mt-4"
                >
                    Thêm câu hỏi
                </button>
            </div>
        </div>
    );
}
