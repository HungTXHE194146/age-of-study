import { useState, useReducer } from "react";
import { Question, QuestionType, DifficultyLevel } from "@/types/teacher";

interface ManualQuestionTabProps {
  questionsLength: number;
  onAddQuestion: (question: Question) => void;
}

// M-12: Using reducer for complex form state to avoid inline mutations and improve performance
type State = {
  type:
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE"
    | "ESSAY"
    | "WORD_ORDERING"
    | "MATCHING"
    | "FILL_IN_BLANKS"
    | "CATEGORIZATION"
    | "FIND_ERROR";
  text: string;
  difficulty: "Easy" | "Medium" | "Hard";
  options: { id: string; label: string; text: string; isCorrect: boolean }[];
  correctAnswer: string;
  trueFalseContent: { true: string; false: string };
  trueFalseCorrectAnswer: "TRUE" | "FALSE";
  essayHint: string;
  explanation: string;
  orderedWordsStr: string;
  matchingPairs: { left: string; right: string }[];
  blanksStr: string;
  blanksSentence: string;
  categories: { name: string; items: string }[];
  errorSentence: string;
  findErrorData: { startIndex: number; endIndex: number; correctText: string };
  showAdvanced: boolean;
};

type Action =
  | { type: "SET_FIELD"; field: keyof State; value: any }
  | { type: "UPDATE_OPTION"; index: number; text: string }
  | {
      type: "UPDATE_MATCHING_PAIR";
      index: number;
      field: "left" | "right";
      value: string;
    }
  | { type: "ADD_MATCHING_PAIR" }
  | { type: "REMOVE_MATCHING_PAIR"; index: number }
  | {
      type: "UPDATE_CATEGORY";
      index: number;
      field: "name" | "items";
      value: string;
    }
  | { type: "ADD_CATEGORY" }
  | { type: "REMOVE_CATEGORY"; index: number }
  | { type: "RESET_FORM" };

const initialState: State = {
  type: "MULTIPLE_CHOICE",
  text: "",
  difficulty: "Medium",
  options: [
    { id: "1", label: "A", text: "", isCorrect: false },
    { id: "2", label: "B", text: "", isCorrect: false },
    { id: "3", label: "C", text: "", isCorrect: false },
    { id: "4", label: "D", text: "", isCorrect: false },
  ],
  correctAnswer: "A",
  trueFalseContent: { true: "", false: "" },
  trueFalseCorrectAnswer: "TRUE",
  essayHint: "",
  explanation: "",
  orderedWordsStr: "",
  matchingPairs: [{ left: "", right: "" }],
  blanksStr: "",
  blanksSentence: "",
  categories: [{ name: "", items: "" }],
  errorSentence: "",
  findErrorData: { startIndex: 0, endIndex: 0, correctText: "" },
  showAdvanced: false,
};

function formReducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "UPDATE_OPTION": {
      const options = [...state.options];
      options[action.index] = { ...options[action.index], text: action.text };
      return { ...state, options };
    }
    case "UPDATE_MATCHING_PAIR": {
      const pairs = [...state.matchingPairs];
      pairs[action.index] = {
        ...pairs[action.index],
        [action.field]: action.value,
      };
      return { ...state, matchingPairs: pairs };
    }
    case "ADD_MATCHING_PAIR":
      return {
        ...state,
        matchingPairs: [...state.matchingPairs, { left: "", right: "" }],
      };
    case "REMOVE_MATCHING_PAIR":
      return {
        ...state,
        matchingPairs: state.matchingPairs.filter((_, i) => i !== action.index),
      };
    case "UPDATE_CATEGORY": {
      const categories = [...state.categories];
      categories[action.index] = {
        ...categories[action.index],
        [action.field]: action.value,
      };
      return { ...state, categories };
    }
    case "ADD_CATEGORY":
      return {
        ...state,
        categories: [...state.categories, { name: "", items: "" }],
      };
    case "REMOVE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter((_, i) => i !== action.index),
      };
    case "RESET_FORM":
      return { ...initialState, type: state.type }; // Keep type for convenience
    default:
      return state;
  }
}

export function ManualQuestionTab({
  questionsLength,
  onAddQuestion,
}: ManualQuestionTabProps) {
  const [state, dispatch] = useReducer(formReducer, initialState);

  const handleAddClick = () => {
    // Validate required fields
    if (!state.text.trim()) {
      alert("Vui lòng nhập nội dung câu hỏi");
      return;
    }

    if (state.type === "MULTIPLE_CHOICE") {
      const hasEmptyOptions = state.options
        .slice(0, 2)
        .some((option) => !option.text.trim());
      if (hasEmptyOptions) {
        alert("Vui lòng nhập đầy đủ nội dung cho ít nhất 2 phương án đầu tiên");
        return;
      }
    }
    // Create question object
    const newQuestion: Question = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      number: questionsLength + 1,
      type: state.type,
      questionText: state.text,
      options:
        state.type === "MULTIPLE_CHOICE"
          ? state.options.map((option) => ({
              ...option,
              isCorrect: option.label === state.correctAnswer,
            }))
          : state.type === "TRUE_FALSE"
            ? [
                {
                  id: "1",
                  label: "A",
                  text: state.trueFalseContent.true || "Đúng",
                  isCorrect: state.trueFalseCorrectAnswer === "TRUE",
                },
                {
                  id: "2",
                  label: "B",
                  text: state.trueFalseContent.false || "Sai",
                  isCorrect: state.trueFalseCorrectAnswer === "FALSE",
                },
              ]
            : [],
      difficulty: state.difficulty,
      explanation: state.explanation || undefined,
      hint:
        state.type === "ESSAY" && state.essayHint ? state.essayHint : undefined,
      metadata:
        state.type === "WORD_ORDERING"
          ? {
              orderedWords: state.orderedWordsStr
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }
          : state.type === "MATCHING"
            ? {
                matchingPairs: state.matchingPairs.filter(
                  (p) => p.left && p.right,
                ),
              }
            : state.type === "FILL_IN_BLANKS"
              ? {
                  sentence: state.blanksSentence,
                  blanks: state.blanksStr
                    .split(",")
                    .map((s, i) => ({ index: i, answer: s.trim() }))
                    .filter((b) => b.answer),
                }
              : state.type === "CATEGORIZATION"
                ? {
                    categories: state.categories
                      .map((c) => ({
                        name: c.name,
                        items: c.items
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }))
                      .filter((c) => c.name),
                  }
                : state.type === "FIND_ERROR"
                  ? {
                      sentence: state.errorSentence,
                      errorPosition: state.findErrorData,
                    }
                  : undefined,
    };

    onAddQuestion(newQuestion);

    // Reset form
    dispatch({ type: "RESET_FORM" });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
            Lời dẫn / Hướng dẫn làm bài (Câu {questionsLength + 1})
          </label>
          <textarea
            rows={2}
            value={state.text}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "text",
                value: e.target.value,
              })
            }
            className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5"
            placeholder="Ví dụ: Tìm lỗi sai trong câu sau, Sắp xếp các từ..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
              Loại câu hỏi
            </label>
            <select
              value={state.type}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "type",
                  value: e.target.value,
                })
              }
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <option value="MULTIPLE_CHOICE">Trắc nghiệm (4 lựa chọn)</option>
              <option value="TRUE_FALSE">Đúng / Sai</option>
              <option value="ESSAY">Tự luận / Trả lời ngắn</option>
              <option value="WORD_ORDERING">Sắp xếp từ</option>
              <option value="MATCHING">Nối cặp (Matching)</option>
              <option value="FILL_IN_BLANKS">Điền vào chỗ trống</option>
              <option value="CATEGORIZATION">Phân loại (Categorization)</option>
              <option value="FIND_ERROR">Tìm lỗi sai</option>
            </select>
          </div>

          {state.showAdvanced ? (
            <div>
              <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                Độ khó
              </label>
              <select
                value={state.difficulty}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "difficulty",
                    value: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <option value="Easy">Dễ</option>
                <option value="Medium">Trung bình</option>
                <option value="Hard">Khó</option>
              </select>
            </div>
          ) : (
            <div className="flex items-end pb-3">
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "showAdvanced",
                    value: true,
                  })
                }
                className="text-blue-600 font-bold text-sm hover:underline"
              >
                + Hiện thêm cài đặt (Độ khó, giải thích...)
              </button>
            </div>
          )}
        </div>

        {/* Multiple Choice Options */}
        {state.type === "MULTIPLE_CHOICE" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.options.map((option, index) => (
                <div key={option.id} className="relative">
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center font-black border-r-2 border-black ${state.correctAnswer === option.label ? "bg-green-400" : "bg-gray-100"}`}
                  >
                    {option.label}
                  </div>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_OPTION",
                        index,
                        text: e.target.value,
                      })
                    }
                    className={`w-full pl-16 pr-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all ${state.correctAnswer === option.label ? "border-green-600 bg-green-50" : ""}`}
                    placeholder={`Phương án ${option.label}...`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "SET_FIELD",
                        field: "correctAnswer",
                        value: option.label,
                      })
                    }
                    className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-black rounded border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] ${state.correctAnswer === option.label ? "bg-green-500 text-white" : "bg-white text-gray-400"}`}
                  >
                    ĐÚNG
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* True/False Options */}
        {state.type === "TRUE_FALSE" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["TRUE", "FALSE"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "trueFalseCorrectAnswer",
                    value: type,
                  })
                }
                className={`p-4 border-2 border-black rounded-xl font-black text-xl transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${state.trueFalseCorrectAnswer === type ? (type === "TRUE" ? "bg-green-400 translate-x-1 translate-y-1 shadow-none" : "bg-red-400 translate-x-1 translate-y-1 shadow-none") : "bg-white hover:-translate-y-1"}`}
              >
                {type === "TRUE" ? "👍 ĐÚNG" : "👎 SAI"}
              </button>
            ))}
          </div>
        )}

        {/* Essay Question */}
        {state.type === "ESSAY" && (
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-800 uppercase">
              Hướng dẫn / Đáp án mẫu
            </label>
            <textarea
              rows={3}
              value={state.essayHint}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "essayHint",
                  value: e.target.value,
                })
              }
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 border-dashed"
              placeholder="Nhập nội dung đáp án hoặc hướng dẫn chấm bài..."
            />
          </div>
        )}

        {/* Word Ordering */}
        {state.type === "WORD_ORDERING" && (
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-800 uppercase">
              Danh sách từ theo thứ tự đúng (Cách nhau bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={state.orderedWordsStr}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "orderedWordsStr",
                  value: e.target.value,
                })
              }
              placeholder="Con, mèo, trèo, cây, cau"
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold"
            />
          </div>
        )}

        {/* Matching Pairs */}
        {state.type === "MATCHING" && (
          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-800 uppercase">
              Các cặp nối (Cột trái - Cột phải)
            </label>
            {state.matchingPairs.map((pair, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={pair.left}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_MATCHING_PAIR",
                      index: idx,
                      field: "left",
                      value: e.target.value,
                    })
                  }
                  placeholder="Trái..."
                  className="flex-1 px-4 py-2 bg-white border-2 border-slate-800 rounded-lg font-bold"
                />
                <input
                  type="text"
                  value={pair.right}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_MATCHING_PAIR",
                      index: idx,
                      field: "right",
                      value: e.target.value,
                    })
                  }
                  placeholder="Phải..."
                  className="flex-1 px-4 py-2 bg-white border-2 border-slate-800 rounded-lg font-bold"
                />
                <button
                  onClick={() =>
                    dispatch({ type: "REMOVE_MATCHING_PAIR", index: idx })
                  }
                  className="text-red-500 font-black px-2"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => dispatch({ type: "ADD_MATCHING_PAIR" })}
              className="text-sm font-bold text-blue-600"
            >
              + Thêm cặp mới
            </button>
          </div>
        )}

        {/* Fill in Blanks */}
        {state.type === "FILL_IN_BLANKS" && (
          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-800 uppercase">
              Nội dung câu văn (Sử dụng ___ cho chỗ trống)
            </label>
            <textarea
              rows={2}
              value={state.blanksSentence}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "blanksSentence",
                  value: e.target.value,
                })
              }
              placeholder="Ví dụ: Bác Hồ sinh ngày ___ tháng ___ năm 1890."
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900"
            />
            <label className="block text-sm font-bold text-gray-800 uppercase mt-4">
              Đáp án các ô trống (Cách nhau bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={state.blanksStr}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "blanksStr",
                  value: e.target.value,
                })
              }
              placeholder="19, 5"
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold"
            />
            <p className="text-xs text-slate-500 italic">
              * Các đáp án sẽ được gán vào các ___ theo thứ tự từ trái sang
              phải.
            </p>
          </div>
        )}

        {/* Categorization */}
        {state.type === "CATEGORIZATION" && (
          <div className="space-y-6">
            {state.categories.map((cat, idx) => (
              <div
                key={idx}
                className="p-4 border-2 border-slate-800 rounded-xl space-y-3 bg-slate-50"
              >
                <div className="flex justify-between">
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_CATEGORY",
                        index: idx,
                        field: "name",
                        value: e.target.value,
                      })
                    }
                    placeholder="Tên nhóm (ví dụ: Danh từ)"
                    className="flex-1 px-4 py-2 bg-white border-2 border-slate-800 rounded-lg font-black"
                  />
                  <button
                    onClick={() =>
                      dispatch({ type: "REMOVE_CATEGORY", index: idx })
                    }
                    className="text-red-500 ml-4 font-black"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  value={cat.items}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_CATEGORY",
                      index: idx,
                      field: "items",
                      value: e.target.value,
                    })
                  }
                  placeholder="Các từ trong nhóm (cách nhau bằng dấu phẩy)"
                  className="w-full px-4 py-2 bg-white border-2 border-slate-300 rounded-lg font-bold"
                />
              </div>
            ))}
            <button
              onClick={() => dispatch({ type: "ADD_CATEGORY" })}
              className="text-sm font-bold text-blue-600"
            >
              + Thêm nhóm mới
            </button>
          </div>
        )}

        {/* Find Error */}
        {state.type === "FIND_ERROR" && (
          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-800 uppercase">
              Câu văn chứa lỗi sai
            </label>
            <textarea
              rows={2}
              value={state.errorSentence}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "errorSentence",
                  value: e.target.value,
                })
              }
              placeholder="Nhập câu văn chứa lỗi sai tại đây..."
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900"
            />
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-slate-500">
                Chọn từ sai trong câu dưới đây:
              </label>
              <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-wrap gap-2">
                {state.errorSentence.split(/(\s+)/).map((part, idx, arr) => {
                  if (part.trim().length === 0) return null;

                  let currentPos = 0;
                  for (let i = 0; i < idx; i++) {
                    currentPos += arr[i].length;
                  }

                  const isSelected =
                    state.findErrorData.startIndex === currentPos &&
                    state.findErrorData.endIndex ===
                      currentPos + part.length - 1;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        dispatch({
                          type: "SET_FIELD",
                          field: "findErrorData",
                          value: {
                            ...state.findErrorData,
                            startIndex: currentPos,
                            endIndex: currentPos + part.length - 1,
                          },
                        });
                      }}
                      className={`px-2 py-1 rounded-md border-2 font-bold transition-all ${
                        isSelected
                          ? "bg-red-500 text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                          : "bg-white border-gray-300 hover:border-black"
                      }`}
                    >
                      {part}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 italic font-medium">
                * Nhấn vào từ chứa lỗi sai để đánh dấu
              </p>
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-slate-500">
                Từ đúng (Để sửa lại)
              </label>
              <input
                type="text"
                value={state.findErrorData.correctText}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "findErrorData",
                    value: {
                      ...state.findErrorData,
                      correctText: e.target.value,
                    },
                  })
                }
                placeholder="Ví dụ: 'học' thay vì 'họck'..."
                className="w-full px-4 py-2 border-2 border-slate-800 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Advanced Explanation */}
        {state.showAdvanced && (
          <div className="pt-4 border-t-2 border-dashed border-gray-200">
            <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
              Giải thích chi tiết (Hiện sau khi học sinh nộp bài)
            </label>
            <textarea
              rows={2}
              value={state.explanation}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "explanation",
                  value: e.target.value,
                })
              }
              className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 border-dashed"
              placeholder="Vì sao đáp án này đúng? Giải thích ngắn gọn..."
            />
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: "SET_FIELD",
                  field: "showAdvanced",
                  value: false,
                })
              }
              className="mt-2 text-gray-500 text-xs font-bold hover:underline"
            >
              Thu gọn cài đặt nâng cao
            </button>
          </div>
        )}

        <button
          onClick={handleAddClick}
          className="w-full px-4 py-4 bg-green-500 text-white font-black border-2 border-black rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-green-400 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <span className="text-2xl">+</span> LƯU CÂU HỎI NÀY
        </button>
      </div>
    </div>
  );
}
