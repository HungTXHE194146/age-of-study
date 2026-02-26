'use client';

import { useState } from 'react';
import { X, Upload, Loader2, FileText, AlertCircle } from 'lucide-react';
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

export function DocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  subjectId,
  subjectName,
  curriculumNodes,
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | undefined>();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!file) {
      setError('Vui lòng chọn file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await documentManagementService.uploadDocument({
        file,
        subjectId,
        nodeId: selectedNodeId,
        metadata: {
          title: title || file.name,
          author: author || undefined,
          description: description || undefined,
        },
      });

      alert(result.message);
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setSelectedNodeId(undefined);
    setTitle('');
    setAuthor('');
    setDescription('');
    setError(null);
    onClose();
  };

  // Flatten curriculum tree for dropdown
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

  const flatNodes = flattenNodes(curriculumNodes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Upload Tài Liệu SGK
          </h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Subject info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Môn học:</strong> {subjectName}
            </p>
          </div>

          {/* File upload */}
          <div>
            <Label htmlFor="file-upload" className="text-sm font-medium">
              Chọn file <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2">
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                disabled={isUploading}
                className="block w-full text-sm"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Hỗ trợ file PDF hoặc DOCX, tối đa 10MB
              </p>
            </div>

            {file && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <FileText className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Curriculum node selection */}
          <div>
            <Label htmlFor="node-select" className="text-sm font-medium">
              Chọn chương/bài học (optional)
            </Label>
            <select
              id="node-select"
              value={selectedNodeId || ''}
              onChange={(e) => setSelectedNodeId(e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={isUploading}
              className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">-- Chọn vị trí trong chương trình --</option>
              {flatNodes.map(({ node, level }) => (
                <option key={node.id} value={node.id}>
                  {'　'.repeat(level)}
                  {node.node_type === 'chapter' && '📚 '}
                  {node.node_type === 'lesson' && '📖 '}
                  {node.node_type === 'week' && '📅 '}
                  {node.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Chọn chapter/lesson để hệ thống tự động map nội dung tài liệu với chương trình học
            </p>
          </div>

          {/* Metadata */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Tiêu đề tài liệu
            </Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              placeholder="Nhập tiêu đề (mặc định dùng tên file)"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="author" className="text-sm font-medium">
              Tác giả
            </Label>
            <Input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              disabled={isUploading}
              placeholder="VD: Bộ Giáo dục và Đào tạo"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Mô tả
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              placeholder="Mô tả ngắn về tài liệu này..."
              rows={3}
              className="mt-2"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="min-w-[120px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang upload...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
