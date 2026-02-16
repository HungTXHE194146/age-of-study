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
    <div className="bg-white rounded-2xl p-8 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Điểm số câu hỏi
          </h3>
          <p className="text-sm text-gray-600">
            Nhấn vào số thứ tự để chọn câu hỏi, chỉnh sửa điểm ở ô bên dưới
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-blue-600">
            {questions.length}
          </span>
          <p className="text-sm text-gray-600">câu hỏi</p>
        </div>
      </div>

      {/* Points Input Section */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 mb-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Câu hỏi đang chọn
              </label>
              <div className="text-lg font-bold text-blue-600">
                {selectedQuestionId 
                  ? `Câu ${questions.find(q => q.id === selectedQuestionId)?.number || ''}`
                  : 'Chưa chọn'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Điểm hiện tại
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={editingPoints}
                  onChange={(e) => setEditingPoints(parseInt(e.target.value) || 0)}
                  className="w-24 text-center"
                  min="1"
                  max="100"
                  disabled={!selectedQuestionId}
                />
                <span className="text-sm text-gray-500">pts</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleUpdatePoints}
              disabled={!selectedQuestionId || editingPoints < 1 || editingPoints > 100}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Lưu điểm
            </Button>
            <Button
              onClick={() => {
                if (selectedQuestionId) {
                  setEditingPoints(points[selectedQuestionId] || 10);
                }
              }}
              variant="outline"
              disabled={!selectedQuestionId}
            >
              Đặt lại
            </Button>
          </div>
        </div>
      </div>

      <div className={`grid ${getGridColumns()} gap-3 mb-6`}>
        {questions.map((question, index) => (
          <div
            key={question.id}
            className={`relative group cursor-pointer transition-all duration-200 ${
              currentQuestionIndex === index
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : selectedQuestionId === question.id
                ? 'ring-2 ring-green-500 ring-offset-2'
                : 'hover:shadow-lg hover:-translate-y-1'
            }`}
            onClick={() => handleQuestionClick(question.id, index)}
          >
            <div className={`bg-gradient-to-br ${
              currentQuestionIndex === index
                ? 'from-blue-500 to-blue-600 text-white'
                : selectedQuestionId === question.id
                ? 'from-green-500 to-green-600 text-white'
                : 'from-gray-100 to-gray-200 text-gray-900'
            } rounded-lg p-4 min-h-[60px] flex flex-col items-center justify-center border-2 border-white shadow-sm`}>
              <div className="text-lg font-bold">
                {question.number}
              </div>
              <div className="text-xs opacity-80 mt-1">
                {getPointsForQuestion(question.id)} pts
              </div>
            </div>
            
            {/* Selection indicator */}
            {selectedQuestionId === question.id && (
              <div className="absolute top-1 right-1">
                <div className="w-3 h-3 bg-white rounded-full shadow-sm border-2 border-green-500"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Tổng điểm: {Object.values(points).reduce((sum, pts) => sum + pts, 0)} pts
        </span>
        <span>
          Trung bình: {questions.length > 0 ? Math.round(Object.values(points).reduce((sum, pts) => sum + pts, 0) / questions.length) : 0} pts/câu
        </span>
      </div>
    </div>
  );
}
