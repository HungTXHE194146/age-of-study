"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading";
import type { ClassWithCount } from "@/types/class";

interface TeacherProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  role: string;
}

interface HomeroomImportModalProps {
  classes: ClassWithCount[];
  teachers: TeacherProfile[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  className: string;
  teacherName: string;
  matchedClassId?: number;
  matchedTeacherId?: string;
  grade?: number;
  status: "valid" | "create_class" | "invalid_teacher" | "missing_data";
}

export default function HomeroomImportModal({
  classes,
  teachers,
  onClose,
  onSuccess,
}: HomeroomImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validCount = parsedData.filter(
    (r) => r.status === "valid" || r.status === "create_class",
  ).length;
  const invalidCount = parsedData.length - validCount;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);
    setError(null);
    setParsedData([]);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Fix missing rows issue common in generated Excel files (broken !ref)
      let range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
      let maxRow = range.e.r;
      let maxCol = range.e.c;
      for (const key in worksheet) {
        if (key[0] === "!") continue; // skip metadata
        const cellAddress = XLSX.utils.decode_cell(key);
        if (cellAddress.r > maxRow) maxRow = cellAddress.r;
        if (cellAddress.c > maxCol) maxCol = cellAddress.c;
      }
      worksheet["!ref"] = XLSX.utils.encode_range({
        s: range.s,
        e: { r: maxRow, c: maxCol },
      });

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      }) as any[][];

      let headerRowIndex = -1;
      let classColIndex = -1;
      let teacherColIndex = -1;
      let gradeColIndex = -1;

      // Find the header row
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const rowStr = row.map((c) =>
          String(c || "")
            .trim()
            .toLowerCase(),
        );

        const possibleClassCols = rowStr
          .map((val, idx) => (val === "lớp" ? idx : -1))
          .filter((idx) => idx !== -1);
        const possibleTeacherCols = rowStr
          .map((val, idx) =>
            val.includes("giáo viên chủ nhiệm") && !val.includes("kiêm nhiệm")
              ? idx
              : -1,
          )
          .filter((idx) => idx !== -1);
        const possibleGradeCols = rowStr
          .map((val, idx) => (val === "khối" ? idx : -1))
          .filter((idx) => idx !== -1);

        if (possibleClassCols.length > 0 && possibleTeacherCols.length > 0) {
          headerRowIndex = i;
          classColIndex = possibleClassCols[0];
          teacherColIndex = possibleTeacherCols[0];
          if (possibleGradeCols.length > 0) {
            gradeColIndex = possibleGradeCols[0];
          }
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error(
          "Không tìm thấy cột 'Lớp' và 'Giáo viên chủ nhiệm' trong file Excel. Vui lòng kiểm tra lại định dạng.",
        );
      }

      const extractedData: ParsedRow[] = [];

      let currentGrade: number | undefined = undefined;

      // Parse data rows
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        // If 'Khối' column exists and has a value, update currentGrade (handles merged cells vertically)
        if (gradeColIndex !== -1 && row[gradeColIndex]) {
          const gradeMatch = String(row[gradeColIndex]).match(/\d+/);
          if (gradeMatch) {
            currentGrade = parseInt(gradeMatch[0]);
          }
        }

        const classNameRaw = String(row[classColIndex] || "").trim();
        const teacherNameRaw = String(row[teacherColIndex] || "").trim();

        // Skip completely empty rows
        if (!classNameRaw && !teacherNameRaw) continue;

        if (!classNameRaw || !teacherNameRaw) {
          extractedData.push({
            className: classNameRaw || "(Trống)",
            teacherName: teacherNameRaw || "(Trống)",
            status: "missing_data",
          });
          continue;
        }

        // Match Class
        const matchedClass = classes.find(
          (c) => c.name.trim().toLowerCase() === classNameRaw.toLowerCase(),
        );

        // Match Teacher
        const matchedTeacher = teachers.find(
          (t) =>
            t.full_name?.trim().toLowerCase() === teacherNameRaw.toLowerCase(),
        );

        let status: ParsedRow["status"] = "valid";
        let grade = currentGrade;

        if (!matchedTeacher) {
          status = "invalid_teacher";
        } else if (!matchedClass) {
          status = "create_class";
          if (!grade) {
            const m = classNameRaw.match(/\d+/);
            if (m) grade = parseInt(m[0]);
            else grade = 1; // Default fallback
          }
        }

        extractedData.push({
          className: classNameRaw,
          teacherName: teacherNameRaw,
          matchedClassId: matchedClass?.id,
          matchedTeacherId: matchedTeacher?.id,
          grade,
          status,
        });
      }

      if (extractedData.length === 0) {
        throw new Error("Không tìm thấy dữ liệu hợp lệ nào dưới dòng tiêu đề.");
      }

      setParsedData(extractedData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi đọc file Excel.");
      setFile(null);
    } finally {
      setIsParsing(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    const validAssignments = parsedData
      .filter(
        (r) =>
          (r.status === "valid" || r.status === "create_class") &&
          r.matchedTeacherId,
      )
      .map((r) => ({
        class_id: r.matchedClassId, // Could be undefined if creating class
        class_name: r.className,
        teacher_id: r.matchedTeacherId,
        grade: r.grade,
      }));

    if (validAssignments.length === 0) {
      setError("Không có phân công hợp lệ nào để nhập.");
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Phiên đăng nhập đã hết hạn");
        setIsImporting(false);
        return;
      }

      const CHUNK_SIZE = 50;
      let totalSuccess = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      let totalClassesCreated = 0;
      const totalAssignments = validAssignments.length;

      for (let i = 0; i < totalAssignments; i += CHUNK_SIZE) {
        const chunk = validAssignments.slice(i, i + CHUNK_SIZE);

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!currentSession) {
          throw new Error("Phiên đăng nhập đã hết hạn trong quá trình import");
        }

        const response = await fetch("/api/admin/classes/import-homeroom", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentSession.access_token}`,
          },
          body: JSON.stringify({ assignments: chunk }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Lỗi khi lưu dữ liệu");
        }

        const res = result.results;
        totalSuccess += res?.success || 0;
        totalClassesCreated += res?.classesCreated || 0;
        totalErrors += res?.errors || 0;

        const processed = Math.min(i + CHUNK_SIZE, totalAssignments);
        setProgress(Math.round((processed / totalAssignments) * 100));
      }

      alert(
        `Import hoàn tất! Thành công: ${totalSuccess}, Tạo lớp: ${totalClassesCreated}, Lỗi: ${totalErrors}`,
      );
      if (totalSuccess > 0) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi hệ thống.");
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-teal-600" />
              Nhập phân công GVCN từ Excel
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Hệ thống sẽ tìm các cột &quot;Lớp&quot; và &quot;Giáo viên chủ
              nhiệm&quot; (không bao gồm kiêm nhiệm).
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {!file ? (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors hover:bg-gray-50 hover:border-teal-400 cursor-pointer border-gray-300`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-teal-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Click để chọn file Excel
              </p>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Hỗ trợ định dạng .xlsx, .xls. Đảm bảo tên lớp và tên giáo viên
                khớp với tên trong hệ thống.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{file.name}</h3>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setParsedData([]);
                    setError(null);
                  }}
                  disabled={isImporting}
                  className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium border border-red-200"
                >
                  Chọn file khác
                </button>
              </div>

              {isParsing ? (
                <div className="py-12 text-center">
                  <div className="flex justify-center mb-4">
                    <LoadingSpinner size="lg" />
                  </div>
                  <p className="text-gray-600">Đang đọc dữ liệu Excel...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-green-800 font-medium">
                          Hợp lệ (Sẵn sàng nhập)
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {validCount}
                        </p>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-red-800 font-medium">
                          Bị lỗi (Sẽ bỏ qua)
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {invalidCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="bg-white border text-sm rounded-lg overflow-hidden flex flex-col max-h-80">
                    <div className="overflow-x-auto overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                          <tr>
                            <th className="py-3 px-4 font-semibold text-gray-600 border-b">
                              Lớp
                            </th>
                            <th className="py-3 px-4 font-semibold text-gray-600 border-b">
                              Giáo viên chủ nhiệm
                            </th>
                            <th className="py-3 px-4 font-semibold text-gray-600 border-b">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {parsedData.map((row, idx) => (
                            <tr
                              key={idx}
                              className={
                                row.status === "valid" ||
                                row.status === "create_class"
                                  ? "bg-white"
                                  : "bg-red-50/50"
                              }
                            >
                              <td className="py-3 px-4">
                                <span
                                  className={
                                    row.status === "create_class"
                                      ? "text-blue-600 font-bold"
                                      : "text-gray-900 font-medium"
                                  }
                                >
                                  {row.className}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={
                                    row.status === "invalid_teacher"
                                      ? "text-red-500 font-bold"
                                      : "text-gray-900"
                                  }
                                >
                                  {row.teacherName}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {row.status === "valid" ? (
                                  <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full border border-green-200">
                                    <CheckCircle2 className="w-3 h-3" /> Hợp lệ
                                  </span>
                                ) : row.status === "create_class" ? (
                                  <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                                    <CheckCircle2 className="w-3 h-3" /> Sẽ tạo
                                    lớp
                                  </span>
                                ) : row.status === "invalid_teacher" ? (
                                  <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-full border border-red-200">
                                    <AlertCircle className="w-3 h-3" /> Không
                                    tìm thấy GV
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-full border border-red-200">
                                    <AlertCircle className="w-3 h-3" /> Thiếu dữ
                                    liệu
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-3 flex-shrink-0 rounded-b-xl">
          {isImporting && (
            <div className="w-full">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Đang xử lý phân công...</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-teal-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-gray-500">
              {parsedData.length > 0 &&
                `Sẽ nhập ${validCount} lớp, bỏ qua ${invalidCount} dòng lỗi.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isImporting}
                className="px-6 py-2.5 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors font-medium disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || !file || validCount === 0}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors font-semibold shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <LoadingSpinner size="sm" /> Đang xử lý...
                  </>
                ) : (
                  <>Xác nhận phân công</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
