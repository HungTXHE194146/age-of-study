'use client';

import { useState } from 'react';
import { X, Upload, Loader2, FileText, AlertCircle, CheckCircle, FileUp, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { documentManagementService } from '@/lib/documentManagementService';
import { CurriculumNode } from '@/lib/curriculumService';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subjectId: number;
  subjectName: string;
  curriculumNodes: CurriculumNode[];
}

type UploadMode = 'file' | 'text';

export function DocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  subjectId,
  subjectName,
  curriculumNodes,
}: DocumentUploadModalProps) {
  const [mode, setMode] = useState<UploadMode>('text');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [chapter, setChapter] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Chỉ hỗ trợ file PDF hoặc DOCX');
      return;
    }

    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File không được vượt quá 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    
    // Auto-fill title from filename if empty
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (mode === 'file') {
      await handleFileUpload();
    } else {
      await handleTextUpload();
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError('⚠️ Vui lòng chọn file trước khi upload');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await documentManagementService.uploadDocument({
        file,
        subjectId,
        metadata: {
          title: title || file.name,
        },
      });

      // Show success message
      alert(`✅ ${result.message}\n\nĐã tạo ${result.document.chunksCreated} phần nội dung từ tài liệu.`);
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Upload error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi upload';
      setError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextUpload = async () => {
    if (!textContent.trim()) {
      setError('⚠️ Vui lòng nhập nội dung văn bản');
      return;
    }

    if (!title.trim()) {
      setError('⚠️ Vui lòng nhập tiêu đề tài liệu');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await documentManagementService.uploadTextContent({
        textContent: textContent.trim(),
        subjectId,
        metadata: {
          title: title.trim(),
          chapter: chapter.trim() || undefined,
        },
      });

      // Show success message
      alert(`✅ ${result.message}\n\nĐã tạo ${result.document.chunksCreated} phần nội dung từ văn bản.`);
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Text upload error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu văn bản';
      setError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTitle('');
    setTextContent('');
    setChapter('');
    setError(null);
    setShowAdvanced(false);
    setMode('text');
    onClose();
  };

  // Flatten curriculum tree for dropdown (unused but keep for future)
  const flattenNodes = (nodes: CurriculumNode[], level = 0): Array<{ node: CurriculumNode; level: number }> => {
    const result: Array<{ node: CurriculumNode; level: number }> = [];
    for (const node of nodes) {
      result.push({ node, level });
      if (node.children && node.children.length > 0) {
        result.push(...flattenNodes(node.children, level + 1));
      }
    }
    return result;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📚 Thêm Tài Liệu Mới
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Môn: <span className="font-semibold text-blue-600">{subjectName}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={() => setMode('text')}
            disabled={isUploading}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
              mode === 'text'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Type className="w-5 h-5" />
            Paste Text
          </button>
          <button
            onClick={() => setMode('file')}
            disabled={isUploading}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
              mode === 'file'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <FileUp className="w-5 h-5" />
            Upload File
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {mode === 'text' ? (
            <>
              {/* Text Content */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                    1
                  </div>
                  <Label htmlFor="text-content" className="text-base font-semibold text-gray-900 dark:text-white">
                    Nội dung văn bản *
                  </Label>
                </div>
                <Textarea
                  id="text-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  disabled={isUploading}
                  placeholder="Paste nội dung từ NotebookLM hoặc nguồn khác vào đây..."
                  className="min-h-[300px] text-base font-mono"
                  rows={15}
                />
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>💡 Paste nội dung đã tổng hợp từ NotebookLM</span>
                  <span>{textContent.length} ký tự</span>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                    2
                  </div>
                  <Label htmlFor="text-title" className="text-base font-semibold text-gray-900 dark:text-white">
                    Tiêu đề tài liệu *
                  </Label>
                </div>
                <Input
                  id="text-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                  placeholder="VD: Toán 5 - Chương 1: Số tự nhiên"
                  className="text-base h-12"
                />
              </div>

              {/* Chapter (Optional) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-sm">
                    3
                  </div>
                  <Label htmlFor="chapter" className="text-base font-semibold text-gray-900 dark:text-white">
                    Chương/Bài (tùy chọn)
                  </Label>
                </div>
                <Input
                  id="chapter"
                  type="text"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  disabled={isUploading}
                  placeholder="VD: Chương 1, Bài 3, Unit 5, v.v."
                  className="text-base h-12"
                />
              </div>
            </>
          ) : (
            <>
              {/* File Upload */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                    1
                  </div>
                  <Label className="text-base font-semibold text-gray-900 dark:text-white">
                    Chọn file tài liệu
                  </Label>
                </div>

                <div className="relative">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className={`
                      block w-full p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all
                      ${file 
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                      }
                      ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      {file ? (
                        <>
                          <CheckCircle className="w-12 h-12 text-green-500" />
                          <div>
                            <p className="text-base font-medium text-gray-900 dark:text-white">
                              {file.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                            ✓ Đã chọn file - Click để đổi file khác
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400" />
                          <div>
                            <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                              Click để chọn file
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              hoặc kéo thả file vào đây
                            </p>
                          </div>
                          <p className="text-xs text-gray-400">
                            Hỗ trợ: PDF, DOCX (tối đa 10MB)
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 2: Title (optional) */}
              {file && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                      2
                    </div>
                    <Label htmlFor="file-title" className="text-base font-semibold text-gray-900 dark:text-white">
                      Đặt tên tài liệu (tùy chọn)
                    </Label>
                  </div>
                  <Input
                    id="file-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isUploading}
                    placeholder={file.name.replace(/\.[^/.]+$/, '')}
                    className="text-base h-12"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    💡 Để trống sẽ dùng tên file gốc
                  </p>
                </div>
              )}
            </>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg animate-shake">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Có lỗi xảy ra</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success hint */}
          {((mode === 'file' && file) || (mode === 'text' && textContent.trim())) && !error && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">Sẵn sàng!</p>
                <p className="mt-1">
                  {mode === 'file' 
                    ? 'Hệ thống sẽ tự động đọc và phân tích nội dung tài liệu.' 
                    : 'Hệ thống sẽ tự động phân tích và chia nhỏ nội dung.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
            className="px-6"
          >
            Hủy
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              isUploading || 
              (mode === 'file' && !file) || 
              (mode === 'text' && (!textContent.trim() || !title.trim()))
            }
            className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                {mode === 'file' ? 'Tải lên' : 'Lưu nội dung'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
