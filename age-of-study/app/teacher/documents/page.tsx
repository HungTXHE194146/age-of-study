"use client";

import { useState, useEffect } from "react";
import { FileText, Upload, Trash2, Eye, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  documentManagementService,
  Document,
} from "@/lib/documentManagementService";
import { curriculumService, CurriculumNode } from "@/lib/curriculumService";
import { subjectService } from "@/lib/subjectService";
import { DocumentUploadModal } from "@/components/teacher/DocumentUploadModal";

interface Subject {
  id: number;
  name: string;
  code: string;
  grade_level: string | null;
}

export default function DocumentManagementPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    null,
  );
  const [documents, setDocuments] = useState<Document[]>([]);
  const [curriculumNodes, setCurriculumNodes] = useState<CurriculumNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Load subjects on mount
  useEffect(() => {
    loadSubjects();
  }, []);

  // Load documents when subject changes
  useEffect(() => {
    if (selectedSubjectId) {
      loadDocuments();
      loadCurriculumNodes();
    }
  }, [selectedSubjectId]);

  const loadSubjects = async () => {
    try {
      const subjectList = await subjectService.getSubjects();
      setSubjects(subjectList);

      // Auto-select first subject
      if (subjectList.length > 0) {
        setSelectedSubjectId(subjectList[0].id);
      }
    } catch (error) {
      console.error("Failed to load subjects:", error);
    }
  };

  const loadDocuments = async () => {
    if (!selectedSubjectId) return;

    setIsLoading(true);
    try {
      const result = await documentManagementService.listDocuments({
        subjectId: selectedSubjectId,
        limit: 50,
      });
      setDocuments(result.documents);
    } catch (error) {
      console.error("Failed to load documents:", error);
      alert("Không thể tải danh sách tài liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurriculumNodes = async () => {
    if (!selectedSubjectId) return;

    try {
      const nodes =
        await curriculumService.getCurriculumTree(selectedSubjectId);
      const tree = curriculumService.buildTree(nodes);
      setCurriculumNodes(tree);
    } catch (error) {
      console.error("Failed to load curriculum nodes:", error);
    }
  };

  const handleDelete = async (documentId: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài liệu "${title}"?`)) {
      return;
    }

    try {
      await documentManagementService.deleteDocument(documentId);
      alert("Đã xóa tài liệu thành công");
      loadDocuments(); // Reload list
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert(error instanceof Error ? error.message : "Không thể xóa tài liệu");
    }
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Quản Lý Tài Liệu SGK
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload và quản lý tài liệu sách giáo khoa cho AI tạo câu hỏi
              </p>
            </div>
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              disabled={!selectedSubjectId}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Tài Liệu
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subject selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <Label
            htmlFor="subject-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Chọn Môn Học
          </Label>
          <select
            id="subject-select"
            value={selectedSubjectId || ""}
            onChange={(e) =>
              setSelectedSubjectId(
                e.target.value ? parseInt(e.target.value) : null,
              )
            }
            className="block w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">-- Chọn môn học --</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.code})
              </option>
            ))}
          </select>
        </div>

        {/* Documents list */}
        {selectedSubjectId && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Danh Sách Tài Liệu
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Chưa có tài liệu nào
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Bấm nút "Upload Tài Liệu" để thêm tài liệu SGK
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <div>
                            <h3 className="text-base font-medium text-gray-900 dark:text-white">
                              {doc.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {doc.file_name} · {doc.total_pages} trang
                              {doc.document_chunks &&
                                doc.document_chunks.length > 0 && (
                                  <> · {doc.document_chunks[0].count} chunks</>
                                )}
                            </p>
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                              Upload:{" "}
                              {new Date(doc.created_at).toLocaleDateString(
                                "vi-VN",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: View document details
                            alert("Xem chi tiết tài liệu (coming soon)");
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Xem
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(doc.id, doc.title)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {selectedSubject && (
        <DocumentUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={loadDocuments}
          subjectId={selectedSubject.id}
          subjectName={selectedSubject.name}
          curriculumNodes={curriculumNodes}
        />
      )}
    </div>
  );
}

// Label component (if not already imported)
function Label({
  htmlFor,
  children,
  className,
}: {
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  );
}
