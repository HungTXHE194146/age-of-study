'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Question, QuestionType, QuestionDifficulty } from '@/types/teacher';

interface QuestionEditorProps {
  question: Question;
  onSave: (updatedQuestion: Question) => void;
  onCancel: () => void;
}

export function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [editedQuestion, setEditedQuestion] = useState<Question>(question);
  const [isSaving, setIsSaving] = useState(false);

  const handleQuestionTextChange = (value: string) => {
    setEditedQuestion(prev => ({ ...prev, questionText: value }));
  };

  const handleDifficultyChange = (value: QuestionDifficulty) => {
    setEditedQuestion(prev => ({ ...prev, difficulty: value }));
  };

  const handleOptionChange = (optionId: string, field: 'text' | 'isCorrect', value: string | boolean) => {
    setEditedQuestion(prev => ({
      ...prev,
      options: prev.options.map(opt => 
        opt.id === optionId 
          ? { ...opt, [field]: value }
          : opt
      )
    }));
  };

  const handleAddOption = () => {
    if (editedQuestion.options.length < 6) {
      const newOptionId = (editedQuestion.options.length + 1).toString();
      const newOptionLabel = String.fromCharCode(65 + editedQuestion.options.length);
      setEditedQuestion(prev => ({
        ...prev,
        options: [
          ...prev.options,
          {
            id: newOptionId,
            label: newOptionLabel,
            text: '',
            isCorrect: false
          }
        ]
      }));
    }
  };

  const handleRemoveOption = (optionId: string) => {
    if (editedQuestion.options.length > 3) {
      setEditedQuestion(prev => ({
        ...prev,
        options: prev.options.filter(opt => opt.id !== optionId)
      }));
    }
  };

  const handleTrueFalseContentChange = (field: 'true' | 'false', value: string) => {
    setEditedQuestion(prev => ({
      ...prev,
      options: prev.options.map(opt => 
        opt.label === 'A' && field === 'true'
          ? { ...opt, text: value }
          : opt.label === 'B' && field === 'false'
          ? { ...opt, text: value }
          : opt
      )
    }));
  };

  const handleEssayHintChange = (value: string) => {
    setEditedQuestion(prev => ({
      ...prev,
      options: prev.options.length > 0 
        ? [{ ...prev.options[0], text: value }]
        : [{ id: '1', label: 'A', text: value, isCorrect: false }]
    }));
  };

  const validateForm = (): boolean => {
    if (!editedQuestion.questionText.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi');
      return false;
    }

    if (editedQuestion.type === 'MULTIPLE_CHOICE') {
      const hasEmptyOptions = editedQuestion.options.some(opt => !opt.text.trim());
      if (hasEmptyOptions) {
        alert('Vui lòng nhập đầy đủ nội dung cho tất cả các lựa chọn');
        return false;
      }

      const hasCorrectAnswer = editedQuestion.options.some(opt => opt.isCorrect);
      if (!hasCorrectAnswer) {
        alert('Vui lòng chọn ít nhất một đáp án đúng');
        return false;
      }
    }

    if (editedQuestion.type === 'TRUE_FALSE') {
      const trueOption = editedQuestion.options.find(opt => opt.label === 'A');
      const falseOption = editedQuestion.options.find(opt => opt.label === 'B');
      
      if (!trueOption?.text.trim() || !falseOption?.text.trim()) {
        alert('Vui lòng nhập nội dung cho cả Đúng và Sai');
        return false;
      }
    }

    if (editedQuestion.type === 'ESSAY') {
      if (!editedQuestion.options[0]?.text.trim()) {
        alert('Vui lòng nhập gợi ý trả lời cho câu hỏi tự luận');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      onSave(editedQuestion);
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Lưu câu hỏi thất bại. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#fffdf8] border-4 border-black rounded-xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative">
        <div className="absolute top-0 inset-x-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmZmZmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjZTBlMGUwIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
        <div className="p-6 border-b-2 border-dashed border-gray-400 relative z-10 bg-[#fffdf8] sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-gray-900 font-handwritten tracking-tight">Sửa câu hỏi</h2>
              <p className="text-gray-800 font-bold mt-1">Câu {editedQuestion.number} - <span className="bg-yellow-200 px-2 py-0.5 border-2 border-black rounded shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-sm">{editedQuestion.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : editedQuestion.type === 'TRUE_FALSE' ? 'Đúng/Sai' : 'Tự luận'}</span></p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={isSaving}
                className="px-4 py-2 bg-white border-2 border-black text-black font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#ffde59] hover:bg-[#efce49] border-2 border-black text-black font-black px-6 py-2 rounded-lg transition-transform hover:-translate-y-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </span>
                ) : (
                  'Lưu thay đổi'
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 bg-[linear-gradient(transparent_95%,#e0f2fe_95%)] bg-[length:100%_2rem] relative">
          {/* Margin line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-red-300"></div>
          
          <div className="pl-6 space-y-8 relative z-10">
            {/* Question Content */}
            <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <label className="text-lg font-black text-gray-900 mb-3 block uppercase tracking-tight">
                Nội dung câu hỏi
              </label>
              <textarea
                value={editedQuestion.questionText}
                onChange={(e) => handleQuestionTextChange(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-400 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-blue-50 text-lg font-medium transition-colors resize-none"
                placeholder="Nhập nội dung câu hỏi..."
              />
            </div>

            {/* Difficulty */}
            <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <label className="text-lg font-black text-gray-900 mb-3 block uppercase tracking-tight">
                Độ khó
              </label>
              <select
                value={editedQuestion.difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value as QuestionDifficulty)}
                className="flex h-12 w-full items-center justify-between rounded-lg border-2 border-black bg-[#ffde59] px-4 py-2 text-lg font-bold text-black focus:outline-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-[#efce49] cursor-pointer"
              >
                <option value="Easy">Dễ</option>
                <option value="Medium">Trung bình</option>
                <option value="Hard">Khó</option>
              </select>
            </div>

            {/* Question Type Specific Content */}
            {editedQuestion.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-6 bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-2 border-dashed border-gray-300">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Lựa chọn trả lời</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleAddOption}
                      disabled={editedQuestion.options.length >= 6}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-green-100 border-2 border-black text-green-900 font-bold rounded-lg hover:bg-green-200 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm
                    </button>
                    <button
                      onClick={() => handleRemoveOption(editedQuestion.options[editedQuestion.options.length - 1].id)}
                      disabled={editedQuestion.options.length <= 3}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-red-100 border-2 border-black text-red-900 font-bold rounded-lg hover:bg-red-200 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {editedQuestion.options.map((option, index) => (
                    <div key={option.id} className={`p-4 rounded-xl border-2 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] space-y-3 ${
                      option.isCorrect ? 'bg-green-50 border-green-600 ring-2 ring-green-600 ring-offset-1' : 'bg-gray-50 border-black'
                    }`}>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border-2 font-black flex items-center justify-center ${
                             option.isCorrect ? "bg-green-500 text-white border-green-700" : "bg-white text-black border-black"
                          }`}>
                            {option.label}
                          </div>
                        </label>
                        <label className="flex items-center gap-2 text-sm font-bold cursor-pointer bg-white px-2 py-1 rounded border-2 border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={(e) => handleOptionChange(option.id, 'isCorrect', e.target.checked)}
                            className="w-4 h-4 rounded border-2 border-black text-green-600 focus:ring-green-500 cursor-pointer"
                          />
                          Đáp án đúng
                        </label>
                      </div>
                      <input
                        value={option.text}
                        onChange={(e) => handleOptionChange(option.id, 'text', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-dashed border-gray-400 rounded-lg focus:outline-none focus:border-black font-medium transition-colors bg-white"
                        placeholder={`Nhập lựa chọn ${option.label}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editedQuestion.type === 'TRUE_FALSE' && (
              <div className="space-y-6 bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight pb-4 border-b-2 border-dashed border-gray-300">Nội dung Đúng/Sai</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl border-2 border-black bg-green-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)] space-y-3">
                    <label className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-black font-black flex items-center justify-center bg-green-400 text-black">A</div>
                      <span className="font-bold text-gray-900">Đáp án ĐÚNG</span>
                    </label>
                    <input
                      value={editedQuestion.options.find(opt => opt.label === 'A')?.text || ''}
                      onChange={(e) => handleTrueFalseContentChange('true', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-400 rounded-lg focus:outline-none focus:border-black font-medium transition-colors bg-white"
                      placeholder="VD: Đúng"
                    />
                  </div>
                  <div className="p-4 rounded-xl border-2 border-black bg-red-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)] space-y-3">
                    <label className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-black font-black flex items-center justify-center bg-red-400 text-black">B</div>
                      <span className="font-bold text-gray-900">Đáp án SAI</span>
                    </label>
                    <input
                      value={editedQuestion.options.find(opt => opt.label === 'B')?.text || ''}
                      onChange={(e) => handleTrueFalseContentChange('false', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-400 rounded-lg focus:outline-none focus:border-black font-medium transition-colors bg-white"
                      placeholder="VD: Sai"
                    />
                  </div>
                </div>
              </div>
            )}

            {editedQuestion.type === 'ESSAY' && (
              <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <label className="text-xl font-black text-gray-900 mb-3 block uppercase tracking-tight pb-4 border-b-2 border-dashed border-gray-300">
                  Gợi ý trả lời
                </label>
                <textarea
                  value={editedQuestion.options[0]?.text || ''}
                  onChange={(e) => handleEssayHintChange(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 mt-4 border-2 border-dashed border-gray-400 rounded-lg focus:outline-none focus:border-black font-medium transition-colors resize-none bg-yellow-50"
                  placeholder="Nhập gợi ý trả lời hoặc hướng dẫn chấm điểm chi tiết..."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}