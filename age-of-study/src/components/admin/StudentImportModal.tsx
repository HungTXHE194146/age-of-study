"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  Info,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading";

interface ClassInfo {
  id: number;
  name: string;
  grade: number;
}

interface StudentImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
  classes: ClassInfo[];
}

export interface ParsedStudent {
  username?: string; // Mã định danh
  fullName?: string; // Họ tên
  dob?: string; // Ngày sinh
  gender?: string; // Giới tính
  ethnicity?: string; // Dân tộc
  phone?: string; // Điện thoại
  status?: string; // Trạng thái
  className?: string; // Lớp
  grade?: number; // Khối
  matchedClassId?: number; // matched with DB
  rowIdx: number;
  rowStatus: "valid" | "create_class" | "missing_data" | "error";
  errorMsg?: string;
}

export default function StudentImportModal({
  onClose,
  onSuccess,
  classes,
}: StudentImportModalProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setParsedData([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Recalculate dimensions
      let range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
      let maxRow = range.e.r;
      let maxCol = range.e.c;
      for (const key in worksheet) {
        if (key[0] === "!") continue;
        const cell = XLSX.utils.decode_cell(key);
        if (cell.r > maxRow) maxRow = cell.r;
        if (cell.c > maxCol) maxCol = cell.c;
      }
      worksheet["!ref"] = XLSX.utils.encode_range({
        s: range.s,
        e: { r: maxRow, c: maxCol },
      });

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      }) as any[][];

      let headerRowIndex = -1;
      let colMap: Record<string, number> = {};

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        const rowStr = row.map((c) =>
          String(c || "")
            .trim()
            .toLowerCase(),
        );

        let foundCols = 0;
        let pMap: Record<string, number> = {};

        rowStr.forEach((cell, idx) => {
          if (cell.includes("mã định danh") || cell === "mã học sinh")
            pMap.username = idx;
          else if (cell.includes("họ và tên") || cell.includes("họ tên"))
            pMap.fullName = idx;
          else if (cell.includes("ngày sinh")) pMap.dob = idx;
          else if (cell.includes("giới tính")) pMap.gender = idx;
          else if (cell.includes("dân tộc")) pMap.ethnicity = idx;
          else if (cell.includes("điện thoại") || cell.includes("sđt"))
            pMap.phone = idx;
          else if (
            cell.includes("trạng thái học") ||
            cell.includes("trạng thái")
          )
            pMap.status = idx;
          else if (cell.includes("lớp")) pMap.className = idx;
          else if (cell.includes("khối")) pMap.grade = idx;
        });

        if (pMap.username !== undefined || pMap.fullName !== undefined) {
          headerRowIndex = i;
          colMap = pMap;
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error(
          "Không tìm thấy dòng tiêu đề (cần cột Mã định danh, Họ tên...)",
        );
      }

      const extracted: ParsedStudent[] = [];

      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const val = (idx: number | undefined) =>
          idx !== undefined ? String(row[idx] || "").trim() : "";

        const username = val(colMap.username);
        const fullName = val(colMap.fullName);
        const dob = val(colMap.dob);
        const gender = val(colMap.gender);
        const ethnicity = val(colMap.ethnicity);
        const phone = val(colMap.phone);
        const status = val(colMap.status);
        const className = val(colMap.className);
        let grade = parseInt(val(colMap.grade), 10);

        // Required field validation
        if (!username && !fullName) continue; // Skip empty rows

        let rowStatus: ParsedStudent["rowStatus"] = "valid";
        let errorMsg = "";

        if (!username || !fullName || !dob || !className) {
          rowStatus = "missing_data";
          errorMsg = "Thiếu định danh, tên, ngày sinh, hoặc lớp";
        }

        // Class matching logic
        let matchedClassId: number | undefined = undefined;
        if (className) {
          const matched = classes.find(
            (c) => c.name.toLowerCase() === className.toLowerCase(),
          );
          if (matched) {
            matchedClassId = matched.id;
            if (!grade) grade = matched.grade;
          } else {
            rowStatus = "create_class"; // Class not found, we will create it

            // Try inferring grade if it wasn't provided directly
            if (!grade && className.length > 0) {
              const firstChar = className.charAt(0);
              if (!isNaN(parseInt(firstChar))) {
                grade = parseInt(firstChar);
              } else {
                grade = 1; // Default
              }
            }
          }
        }

        extracted.push({
          username,
          fullName,
          dob,
          gender,
          ethnicity,
          phone,
          status,
          className,
          grade: isNaN(grade) ? 1 : grade,
          matchedClassId,
          rowIdx: i + 1,
          rowStatus,
          errorMsg,
        });
      }

      setParsedData(extracted);
      setStep("preview");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi đọc file");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    // Both valid (existing class) or create_class are eligible to be processed
    const validStudents = parsedData.filter(
      (r) => r.rowStatus === "valid" || r.rowStatus === "create_class",
    );

    if (validStudents.length === 0) return;

    setLoading(true);
    setProgress(0);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Phiên đăng nhập đã hết hạn");
        setLoading(false);
        return;
      }

      // Chunk requests
      const CHUNK_SIZE = 50;
      let totalSuccess = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      let totalClassesCreated = 0;
      const totalCount = validStudents.length;

      for (let i = 0; i < totalCount; i += CHUNK_SIZE) {
        const chunk = validStudents.slice(i, i + CHUNK_SIZE);

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!currentSession) {
          throw new Error("Phiên đăng nhập đã hết hạn trong quá trình import");
        }

        const response = await fetch("/api/admin/students/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentSession.access_token}`,
          },
          body: JSON.stringify({ students: chunk }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Có lỗi khi import");
        }

        const data = await response.json();
        const res = data.results;

        totalSuccess += res.success || 0;
        totalSkipped += res.skipped || 0;
        totalErrors += res.errors || 0;
        totalClassesCreated += res.classesCreated || 0;

        const processed = Math.min(i + CHUNK_SIZE, totalCount);
        setProgress(Math.round((processed / totalCount) * 100));
      }

      alert(
        `Import hoàn tất!\nThành công: ${totalSuccess}\nTạo lớp: ${totalClassesCreated}\nLỗi/Bỏ qua: ${totalErrors + totalSkipped}`,
      );

      if (totalSuccess > 0) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const validCount = parsedData.filter((r) => r.rowStatus === "valid").length;
  const createClassCount = parsedData.filter(
    (r) => r.rowStatus === "create_class",
  ).length;
  const errorCount = parsedData.length - validCount - createClassCount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
              Nhập học sinh từ Excel
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Hệ thống sẽ dùng [Mã định danh] làm Username và [Ngày sinh
              DDMMYYYY] làm Mật khẩu khởi tạo.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "upload" ? (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm space-y-2">
                  <p className="font-semibold">
                    Lưu ý định dạng file Excel (.xlsx):
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      File cần có dòng tiêu đề chứa các cột:{" "}
                      <strong>
                        Mã định danh, Họ tên, Ngày sinh, Giới tính, Dân tộc,
                        Trạng thái, Lớp, Khối...
                      </strong>
                    </li>
                    <li>
                      Ngày sinh phải chuẩn (vd: 15/08/2012 hoặc 15-08-2012).
                    </li>
                    <li>
                      Nếu cột Lớp không tồn tại trong hệ thống, hệ thống sẽ{" "}
                      <strong>tự động tạo lớp mới</strong>.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-green-300 bg-green-50 hover:bg-green-100 transition-colors rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Chọn file Excel"
                />
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <Upload className="w-8 h-8 text-green-500" />
                </div>
                {loading ? (
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="md" />
                    <p className="font-medium text-gray-600">
                      Đang đọc file...
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Kéo thả file Excel hoặc click để chọn
                    </h3>
                    <p className="text-sm text-gray-500">
                      Hỗ trợ định dạng .xlsx, .xls
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="bg-gray-100 rounded-lg p-3 px-4 flex-1 min-w-[120px]">
                  <p className="text-sm text-gray-500">Tổng số dòng</p>
                  <p className="text-xl font-bold">{parsedData.length}</p>
                </div>
                <div className="bg-green-50 text-green-700 rounded-lg p-3 px-4 flex-1 min-w-[120px]">
                  <p className="text-sm">Hợp lệ (Lớp đã có)</p>
                  <p className="text-xl font-bold">{validCount}</p>
                </div>
                <div className="bg-blue-50 text-blue-700 rounded-lg p-3 px-4 flex-1 min-w-[120px]">
                  <p className="text-sm">Hợp lệ (Tạo lớp mới)</p>
                  <p className="text-xl font-bold">{createClassCount}</p>
                </div>
                <div className="bg-red-50 text-red-700 rounded-lg p-3 px-4 flex-1 min-w-[120px]">
                  <p className="text-sm">Lỗi / Thiếu</p>
                  <p className="text-xl font-bold">{errorCount}</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-sm text-left align-middle border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="py-3 px-4 font-semibold text-gray-600 w-[60px]">
                          Dòng
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-600 min-w-[120px]">
                          Định danh
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-600 min-w-[150px]">
                          Họ tên
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-600 min-w-[100px]">
                          Ngày sinh
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-600 min-w-[80px]">
                          Lớp
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-600 min-w-[150px]">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {parsedData.map((row, idx) => (
                        <tr
                          key={idx}
                          className={
                            row.rowStatus === "error" ||
                            row.rowStatus === "missing_data"
                              ? "bg-red-50"
                              : row.rowStatus === "create_class"
                                ? "bg-blue-50/50"
                                : ""
                          }
                        >
                          <td className="py-3 px-4 text-gray-500">
                            {row.rowIdx}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {row.username || "-"}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {row.fullName || "-"}
                          </td>
                          <td className="py-3 px-4">{row.dob || "-"}</td>
                          <td className="py-3 px-4">
                            {row.className}
                            {row.rowStatus === "create_class" && (
                              <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded uppercase font-bold tracking-wider">
                                Mới
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {row.rowStatus === "valid" ? (
                              <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                              </span>
                            ) : row.rowStatus === "create_class" ? (
                              <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Sẽ tạo
                                lớp
                              </span>
                            ) : (
                              <span className="inline-flex flex-col gap-0.5 text-red-600 text-xs font-medium">
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                                </span>
                                <span className="text-[11px] font-normal text-red-500 opacity-80">
                                  {row.errorMsg}
                                </span>
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

        {/* Footer */}
        {step === "preview" && (
          <div className="border-t border-gray-200 px-4 sm:px-6 py-4 flex flex-col gap-3 bg-gray-50 rounded-b-xl flex-shrink-0">
            {loading && (
              <div className="w-full">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Đang nhập dữ liệu...</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-green-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end mt-2">
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Trở về / Chọn file khác
              </button>
              <button
                onClick={handleImport}
                disabled={loading || validCount + createClassCount === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {loading
                  ? "Đang xử lý..."
                  : `Xác nhận Import (${validCount + createClassCount} hs)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
