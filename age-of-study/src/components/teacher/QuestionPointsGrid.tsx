'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface QuestionPointsGridProps {
  questions: Array<{
    id: string;
    number: number;
    questionText: string;
  }>;
  onPointsChange: (questionId: string, points: number) => void;
  onNavigateToQuestion: (questionIndex: number) => void;
  currentQuestionIndex: number;
  points: { [questionId: string]: number };
}

export function QuestionPointsGrid({
  questions,
  onPointsChange,
  onNavigateToQuestion,
  currentQuestionIndex,
  points
}: QuestionPointsGridProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [editingPoints, setEditingPoints] = useState<number>(10);

  const handleQuestionClick = (questionId: string, index: number) => {
    setSelectedQuestionId(questionId);
    setEditingPoints(points[questionId] || 10);
    onNavigateToQuestion(index);
  };

  const handleUpdatePoints = () => {
    if (selectedQuestionId && editingPoints > 0 && editingPoints <= 100) {
      onPointsChange(selectedQuestionId, editingPoints);
    }
  };

  const getGridColumns = () => {
    return 'grid-cols-5';
  };

  const getPointsForQuestion = (questionId: string) => {
    return points[questionId] || 10;
  };

  return (
    <div className="bg-[#fffdf8] border-2 border-black rounded-xl p-8 shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative mt-4">
      {/* Decorative tape */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-blue-200/50 -translate-y-2.5 rotate-[2deg] border border-blue-300"></div>

      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dashed border-gray-300">
        <div>
          <h3 className="text-3xl font-black text-gray-900 mb-2 font-handwritten tracking-tight">
            Phân Bổ Điểm Số
          </h3>
          <p className="text-sm font-bold text-gray-600">
            Nhấn vào số thứ tự để chọn câu hỏi, chỉnh sửa điểm ở ô bên dưới
          </p>
        </div>
        <div className="text-right">
          <span className="text-4xl font-black text-blue-700 font-handwritten">
            {questions.length}
          </span>
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">câu hỏi</p>
        </div>
      </div>

      {/* Points Input Section */}
      <div className="bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2rem] border-2 border-black rounded-xl p-6 mb-8 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Câu hỏi đang chọn
              </label>
              <div className="text-2xl font-black text-blue-700 font-handwritten tracking-tight mt-1">
                {selectedQuestionId 
                  ? `Câu ${questions.find(q => q.id === selectedQuestionId)?.number || ''}`
                  : 'Chưa chọn'}
              </div>
            </div>
            <div className="w-0.5 h-12 bg-gray-300 hidden md:block"></div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Điểm hiện tại
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={editingPoints}
                  onChange={(e) => setEditingPoints(parseInt(e.target.value) || 0)}
                  className="w-24 text-center px-3 py-2 border-2 border-black rounded-lg font-black text-lg focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 shadow-inner"
                  min="1"
                  max="100"
                  disabled={!selectedQuestionId}
                />
                <span className="text-lg font-bold text-gray-600 font-handwritten">pts</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap mt-4 md:mt-0">
             <button
              onClick={() => {
                if (selectedQuestionId) {
                  setEditingPoints(points[selectedQuestionId] || 10);
                }
              }}
              disabled={!selectedQuestionId}
              className="px-4 py-2 bg-white border-2 border-black text-black font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50"
            >
              Đặt lại
            </button>
            <button
              onClick={handleUpdatePoints}
              disabled={!selectedQuestionId || editingPoints < 1 || editingPoints > 100}
              className="px-6 py-2 bg-[#ffde59] border-2 border-black text-black font-black rounded-lg hover:bg-[#efce49] transition-transform hover:-translate-y-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:hover:translate-y-0"
            >
              Lưu điểm
            </button>
          </div>
        </div>
      </div>

      <div className={`grid ${getGridColumns()} gap-4 mb-8 bg-gray-50/50 p-6 rounded-xl border-2 border-dashed border-gray-300`}>
        {questions.map((question, index) => (
          <div
            key={question.id}
            className={`relative group cursor-pointer transition-all duration-200 ${
              currentQuestionIndex === index
                ? 'ring-4 ring-blue-400 ring-offset-2 rounded-xl scale-105 z-10'
                : selectedQuestionId === question.id
                ? 'ring-4 ring-green-400 ring-offset-2 rounded-xl scale-105 z-10'
                : 'hover:scale-105 hover:z-10'
            }`}
            onClick={() => handleQuestionClick(question.id, index)}
          >
            <div className={`aspect-square sm:aspect-auto sm:h-20 ${
              currentQuestionIndex === index
                ? 'bg-blue-100 text-blue-900 border-black'
                : selectedQuestionId === question.id
                ? 'bg-green-100 text-green-900 border-black'
                : 'bg-white text-gray-800 border-black hover:bg-yellow-50 hover:text-yellow-900'
            } rounded-xl p-2 flex flex-col items-center justify-center border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]`}>
              <div className="text-2xl font-black font-handwritten">
                {question.number}
              </div>
              <div className="text-sm font-bold mt-1 opacity-80 border-t-2 border-dashed border-current pt-1 w-full text-center">
                {getPointsForQuestion(question.id)} pts
              </div>
            </div>
            
            {/* Selection indicator */}
            {selectedQuestionId === question.id && (
              <div className="absolute -top-2 -right-2 z-20">
                <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-black flex items-center justify-center shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center text-lg font-black font-handwritten tracking-tight pt-4 border-t-2 border-dashed border-gray-400">
        <span className="text-red-700">
          Tổng điểm: {Object.values(points).reduce((sum, pts) => sum + pts, 0)} pts
        </span>
        <span className="text-blue-700">
          Trung bình: {questions.length > 0 ? Math.round(Object.values(points).reduce((sum, pts) => sum + pts, 0) / questions.length) : 0} pts/câu
        </span>
      </div>
    </div>
  );
}
