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

  const handleHintChange = (value: string) => {
    setEditedQuestion(prev => ({ ...prev, hint: value }));
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

  const handleMetadataChange = (field: string, value: any) => {
    setEditedQuestion(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
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

    if (editedQuestion.type === 'WORD_ORDERING') {
      if (!editedQuestion.metadata?.orderedWords || editedQuestion.metadata.orderedWords.length < 2) {
        alert('Vui lòng nhập ít nhất 2 từ để sắp xếp');
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
              <p className="text-gray-800 font-bold mt-1">Câu {editedQuestion.number} - <span className="bg-yellow-200 px-2 py-0.5 border-2 border-black rounded shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-sm">{
                editedQuestion.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' :
                  editedQuestion.type === 'TRUE_FALSE' ? 'Đúng/Sai' :
                    editedQuestion.type === 'WORD_ORDERING' ? 'Sắp xếp từ' :
                      editedQuestion.type === 'MATCHING' ? 'Nối cặp' :
                        editedQuestion.type === 'FILL_IN_BLANKS' ? 'Điền trống' :
                          editedQuestion.type === 'CATEGORIZATION' ? 'Phân loại' :
                            editedQuestion.type === 'FIND_ERROR' ? 'Tìm lỗi sai' :
                              'Tự luận'
              }</span></p>
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
                Lời dẫn / Hướng dẫn làm bài
              </label>
              <textarea
                value={editedQuestion.questionText}
                onChange={(e) => handleQuestionTextChange(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-400 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-blue-50 text-lg font-medium transition-colors resize-none"
                placeholder="Nhập nội dung câu hỏi..."
              />
            </div>

            {/* Hint Content */}
            <div className="bg-indigo-50 p-4 rounded-xl border-2 border-indigo-200 shadow-[4px_4px_0_0_rgba(99,102,241,0.2)]">
              <label className="text-lg font-black text-indigo-900 mb-3 block uppercase tracking-tight flex items-center gap-2">
                <span>🦉 Gợi ý cho học sinh (Hint)</span>
                <span className="text-xs font-bold bg-indigo-200 px-2 py-0.5 rounded text-indigo-700 normal-case">Xuất hiện khi trả lời sai</span>
              </label>
              <textarea
                value={editedQuestion.hint || ''}
                onChange={(e) => handleHintChange(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border-2 border-dashed border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white text-base font-medium transition-colors resize-none"
                placeholder="Ví dụ: Hãy để ý kỹ vần của từ này nhé!..."
              />
            </div>

            {/* Explanation Content */}
            <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200 shadow-[4px_4px_0_0_rgba(254,240,138,0.2)]">
              <label className="text-lg font-black text-yellow-900 mb-3 block uppercase tracking-tight flex items-center gap-2">
                <span>🦉 Lời giải thích chi tiết (Explanation)</span>
                <span className="text-xs font-bold bg-yellow-200 px-2 py-0.5 rounded text-yellow-700 normal-case">Xuất hiện sau khi nộp bài</span>
              </label>
              <textarea
                value={editedQuestion.explanation || ''}
                onChange={(e) => setEditedQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border-2 border-dashed border-yellow-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:bg-white text-base font-medium transition-colors resize-none"
                placeholder="Giải thích vì sao đáp án này đúng..."
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
                    <div key={option.id} className={`p-4 rounded-xl border-2 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] space-y-3 ${option.isCorrect ? 'bg-green-50 border-green-600 ring-2 ring-green-600 ring-offset-1' : 'bg-gray-50 border-black'
                      }`}>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border-2 font-black flex items-center justify-center ${option.isCorrect ? "bg-green-500 text-white border-green-700" : "bg-white text-black border-black"
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

            {editedQuestion.type === 'WORD_ORDERING' && (
              <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <label className="text-xl font-black text-gray-900 mb-3 block uppercase tracking-tight pb-4 border-b-2 border-dashed border-gray-300">
                  Thứ tự từ đúng (Ngăn cách bằng dấu phẩy)
                </label>
                <input
                  value={editedQuestion.metadata?.orderedWords?.join(', ') || ''}
                  onChange={(e) => handleMetadataChange('orderedWords', e.target.value.split(',').map(s => s.trim()))}
                  className="w-full px-4 py-3 mt-4 border-2 border-dashed border-gray-400 rounded-lg focus:outline-none focus:border-black font-medium transition-colors"
                  placeholder="Ví dụ: Tôi, yêu, tiếng, Việt"
                />
              </div>
            )}

            {editedQuestion.type === 'MATCHING' && (
              <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <h3 className="text-xl font-black text-gray-900 mb-3 block uppercase tracking-tight pb-4 border-b-2 border-dashed border-gray-300">Các cặp nối</h3>
                <div className="space-y-4">
                  {(editedQuestion.metadata?.matchingPairs || []).map((pair, idx) => (
                    <div key={idx} className="flex gap-4">
                      <input
                        value={pair.left}
                        onChange={(e) => {
                          const newPairs = [...(editedQuestion.metadata?.matchingPairs || [])];
                          newPairs[idx].left = e.target.value;
                          handleMetadataChange('matchingPairs', newPairs);
                        }}
                        className="flex-1 px-3 py-2 border-2 border-dashed border-gray-400 rounded-lg"
                        placeholder="Vế trái"
                      />
                      <input
                        value={pair.right}
                        onChange={(e) => {
                          const newPairs = [...(editedQuestion.metadata?.matchingPairs || [])];
                          newPairs[idx].right = e.target.value;
                          handleMetadataChange('matchingPairs', newPairs);
                        }}
                        className="flex-1 px-3 py-2 border-2 border-dashed border-gray-400 rounded-lg"
                        placeholder="Vế phải"
                      />
                    </div>
                  ))}
                  <Button
                    onClick={() => handleMetadataChange('matchingPairs', [...(editedQuestion.metadata?.matchingPairs || []), { left: '', right: '' }])}
                    className="w-full bg-blue-50 text-blue-700 border-2 border-dashed border-blue-200"
                  >
                    Thêm cặp mới
                  </Button>
                </div>
              </div>
            )}

            {editedQuestion.type === 'FIND_ERROR' && (
              <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] space-y-4">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight pb-4 border-b-2 border-dashed border-gray-400">Nội dung làm bài (Câu chứa lỗi)</h3>
                <textarea
                  value={(editedQuestion.metadata as any)?.sentence || ''}
                  onChange={(e) => handleMetadataChange('sentence', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-400 rounded-lg focus:outline-none focus:border-black font-medium transition-colors bg-white"
                  placeholder="Nhập câu văn chứa lỗi sai tại đây..."
                />
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-500">Chọn từ sai trong câu dưới đây:</label>
                  <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-wrap gap-2">
                    {((editedQuestion.metadata as any)?.sentence || '').split(/(\s+)/).map((part: string, idx: number, arr: string[]) => {
                      if (part.trim().length === 0) return null;

                      // Tính toán index thực tế của từ này trong chuỗi gốc
                      let currentPos = 0;
                      for (let i = 0; i < idx; i++) {
                        currentPos += arr[i].length;
                      }

                      const isSelected =
                        editedQuestion.metadata?.errorPosition?.startIndex === currentPos &&
                        editedQuestion.metadata?.errorPosition?.endIndex === (currentPos + part.length - 1);

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            handleMetadataChange('errorPosition', {
                              ...editedQuestion.metadata?.errorPosition,
                              startIndex: currentPos,
                              endIndex: currentPos + part.length - 1
                            });
                          }}
                          className={`px-2 py-1 rounded-md border-2 font-bold transition-all ${isSelected
                            ? "bg-red-500 text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                            : "bg-white border-gray-300 hover:border-black"
                            }`}
                        >
                          {part}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-500 italic">* Nhấn vào từ chứa lỗi sai để đánh dấu</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500">Nội dung sửa lại đúng</label>
                  <input
                    value={editedQuestion.metadata?.errorPosition?.correctText || ''}
                    onChange={(e) => handleMetadataChange('errorPosition', { ...editedQuestion.metadata?.errorPosition, correctText: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-400 rounded-lg"
                    placeholder="Nhập từ đúng..."
                  />
                </div>
              </div>
            )}

            {editedQuestion.type === 'FILL_IN_BLANKS' && (
              <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] space-y-4">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight pb-4 border-b-2 border-dashed border-gray-400">Nội dung làm bài (Chứa ___)</h3>
                <textarea
                  value={(editedQuestion.metadata as any)?.sentence || ''}
                  onChange={(e) => handleMetadataChange('sentence', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-400 rounded-lg focus:outline-none focus:border-black font-medium transition-colors bg-white"
                  placeholder="Nhập văn bản với các dấu gạch dưới (VD: Tôi ___ đi học)..."
                />

                <h3 className="text-lg font-black text-gray-800 pt-4">Đáp án các ô trống</h3>
                {(editedQuestion.metadata?.blanks || []).map((blank: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <span className="font-black text-blue-600">Ô {blank.index + 1}</span>
                    <input
                      value={blank.answer}
                      onChange={(e) => {
                        const newBlanks = [...(editedQuestion.metadata?.blanks || [])];
                        newBlanks[idx].answer = e.target.value;
                        handleMetadataChange('blanks', newBlanks);
                      }}
                      className="flex-1 px-3 py-2 border-2 border-dashed border-gray-400 rounded-lg"
                      placeholder="Đáp án đúng..."
                    />
                    <button
                      onClick={() => {
                        const newBlanks = (editedQuestion.metadata?.blanks || []).filter((_: any, i: number) => i !== idx);
                        handleMetadataChange('blanks', newBlanks);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextIndex = (editedQuestion.metadata?.blanks || []).length;
                    handleMetadataChange('blanks', [...(editedQuestion.metadata?.blanks || []), { index: nextIndex, answer: '' }]);
                  }}
                  className="w-full border-2 border-black font-bold"
                >
                  Thêm ô trống
                </Button>
              </div>
            )}

            {editedQuestion.type === 'CATEGORIZATION' && (
              <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] space-y-4">
                <div className="flex justify-between items-center pb-4 border-b-2 border-dashed border-gray-400">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Các nhóm phân loại</h3>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => handleMetadataChange('categories', [...(editedQuestion.metadata?.categories || []), { name: '', items: [] }])}
                    className="border-2 border-black font-bold"
                  >
                    Thêm nhóm
                  </Button>
                </div>
                {(editedQuestion.metadata?.categories || []).map((cat: any, idx: number) => (
                  <div key={idx} className="p-4 bg-gray-50 border-2 border-black rounded-xl space-y-3">
                    <div className="flex gap-2">
                      <input
                        value={cat.name}
                        onChange={(e) => {
                          const newCats = [...(editedQuestion.metadata?.categories || [])];
                          newCats[idx].name = e.target.value;
                          handleMetadataChange('categories', newCats);
                        }}
                        className="flex-1 px-3 py-1 font-black bg-white border-2 border-black rounded"
                        placeholder="Tên nhóm..."
                      />
                      <button
                        onClick={() => handleMetadataChange('categories', (editedQuestion.metadata?.categories || []).filter((_: any, i: number) => i !== idx))}
                        className="text-red-500 font-bold"
                      >
                        Xóa nhóm
                      </button>
                    </div>
                    <textarea
                      value={cat.items.join(', ')}
                      onChange={(e) => {
                        const newCats = [...(editedQuestion.metadata?.categories || [])];
                        newCats[idx].items = e.target.value.split(',').map(s => s.trim()).filter(s => s !== "");
                        handleMetadataChange('categories', newCats);
                      }}
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-400 rounded-lg bg-white"
                      placeholder="Các mục (ngăn cách bằng dấu phẩy)..."
                    />
                  </div>
                ))}
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
}