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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sửa câu hỏi</h2>
              <p className="text-gray-600 mt-1">Câu {editedQuestion.number} - {editedQuestion.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : editedQuestion.type === 'TRUE_FALSE' ? 'Đúng/Sai' : 'Tự luận'}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
                className="px-4 py-2"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </span>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Question Content */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Nội dung câu hỏi
            </Label>
            <Textarea
              value={editedQuestion.questionText}
              onChange={(e) => handleQuestionTextChange(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập nội dung câu hỏi..."
            />
          </div>

          {/* Difficulty */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Độ khó
            </Label>
            <select
              value={editedQuestion.difficulty}
              onChange={(e) => handleDifficultyChange(e.target.value as QuestionDifficulty)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Easy">Dễ</option>
              <option value="Medium">Trung bình</option>
              <option value="Hard">Khó</option>
            </select>
          </div>

          {/* Question Type Specific Content */}
          {editedQuestion.type === 'MULTIPLE_CHOICE' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900">Lựa chọn trả lời</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    disabled={editedQuestion.options.length >= 6}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm lựa chọn
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveOption(editedQuestion.options[editedQuestion.options.length - 1].id)}
                    disabled={editedQuestion.options.length <= 3}
                    className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa lựa chọn
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {editedQuestion.options.map((option, index) => (
                  <div key={option.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="block text-sm font-medium text-gray-700">
                        Lựa chọn {option.label}
                      </Label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) => handleOptionChange(option.id, 'isCorrect', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Đáp án đúng
                      </label>
                    </div>
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionChange(option.id, 'text', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Nhập lựa chọn ${option.label}...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {editedQuestion.type === 'TRUE_FALSE' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Nội dung Đúng/Sai</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Đáp án Đúng
                  </Label>
                  <Input
                    value={editedQuestion.options.find(opt => opt.label === 'A')?.text || ''}
                    onChange={(e) => handleTrueFalseContentChange('true', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập nội dung cho Đúng..."
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Đáp án Sai
                  </Label>
                  <Input
                    value={editedQuestion.options.find(opt => opt.label === 'B')?.text || ''}
                    onChange={(e) => handleTrueFalseContentChange('false', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập nội dung cho Sai..."
                  />
                </div>
              </div>
            </div>
          )}

          {editedQuestion.type === 'ESSAY' && (
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Gợi ý trả lời
              </Label>
              <Textarea
                value={editedQuestion.options[0]?.text || ''}
                onChange={(e) => handleEssayHintChange(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập gợi ý trả lời hoặc hướng dẫn chấm điểm..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}