"use client";

import { useState } from "react";
import { X, Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface TeacherImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
  showToast: (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => void;
}

interface ParsedTeacher {
  username: string; // Mã định danh
  full_name: string; // Họ tên
  dob: string; // Ngày sinh
  gender: string; // Giới tính
  status: string; // Trạng thái
  ethnicity: string; // Dân tộc
  phone_number: string; // Điện thoại
  metadata: {
    vi_tri_viec_lam: string;
    nhom_chuc_vu: string;
    hinh_thuc_hop_dong: string;
    trinh_do_chuyen_mon: string;
    mon_day: string;
  };
  importStatus: "valid" | "skipped_status" | "invalid";
}

export default function TeacherImportModal({
  onClose,
  onSuccess,
  showToast,
}: TeacherImportModalProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedTeacher[]>([]);
  const [step, setStep] = useState<"upload" | "preview">("upload");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => {
      showToast("Không thể đọc file. Vui lòng thử lại.", "error");
    };
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // The data seems to start with headers. Let's read as array of arrays
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(20, data.length); i++) {
          const row = data[i];
          if (!row) continue;
          const rowStr = row
            .map((cell) => cell ?? "")
            .join("")
            .toLowerCase();
          if (rowStr.includes("họ tên") || rowStr.includes("mã định danh")) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          showToast(
            "Không tìm thấy dòng tiêu đề hợp lệ trong file Excel",
            "error",
          );
          return;
        }

        const teachers: ParsedTeacher[] = [];

        // Data starts from the row after headers
        for (let i = headerRowIdx + 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0 || !row[1]) continue; // Skip empty rows

          // Assuming columns based on image:
          // 0: STT, 1: Mã định danh, 2: Họ tên, 3: Ngày sinh, 4: Giới tính, 5: Trạng thái
          // 6: Dân tộc, 7: Điện thoại, 8: Vị trí việc làm, 9: Nhóm chức vụ
          // 10: Hình thức hợp đồng, 11: Trình độ chuyên môn, 12: Môn dạy

          const username = String(row[1] || "").trim();
          const full_name = String(row[2] || "").trim();

          if (!username && !full_name) continue;

          let dob = String(row[3] || "").trim();
          if (typeof row[3] === "number") {
            // Convert Excel serial date to DD/MM/YYYY
            const date = new Date(Math.round((row[3] - 25569) * 86400 * 1000));
            const day = String(date.getUTCDate()).padStart(2, "0");
            const month = String(date.getUTCMonth() + 1).padStart(2, "0");
            dob = `${day}/${month}/${date.getUTCFullYear()}`;
          }

          const statusRaw = String(row[5] || "").trim();
          const isSkipped = statusRaw.toLowerCase().includes("chuyển đi");

          const teacher: ParsedTeacher = {
            username,
            full_name,
            dob,
            gender: String(row[4] || "").trim(),
            status: statusRaw,
            ethnicity: String(row[6] || "").trim(),
            phone_number: String(row[7] || "").trim(),
            metadata: {
              vi_tri_viec_lam: String(row[8] || "").trim(),
              nhom_chuc_vu: String(row[9] || "").trim(),
              hinh_thuc_hop_dong: String(row[10] || "").trim(),
              trinh_do_chuyen_mon: String(row[11] || "").trim(),
              mon_day: String(row[12] || "").trim(),
            },
            importStatus: isSkipped
              ? "skipped_status"
              : !username || !full_name || !dob
                ? "invalid"
                : "valid",
          };
          teachers.push(teacher);
        }

        setParsedData(teachers);
        setStep("preview");
      } catch (err) {
        console.error("Lỗi đọc file:", err);
        showToast("Có lỗi xảy ra khi đọc file Excel", "error");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    const validTeachers = parsedData.filter((t) => t.importStatus === "valid");
    if (validTeachers.length === 0) {
      showToast("Không có dữ liệu hợp lệ để import", "error");
      return;
    }

    setLoading(true);
    setProgress(0);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        showToast("Phiên đăng nhập đã hết hạn", "error");
        setLoading(false);
        return;
      }

      // Chunk validTeachers into sizes of 50
      const CHUNK_SIZE = 50;
      let totalSuccess = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      const totalTeachers = validTeachers.length;

      for (let i = 0; i < totalTeachers; i += CHUNK_SIZE) {
        const chunk = validTeachers.slice(i, i + CHUNK_SIZE);

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!currentSession) {
          throw new Error("Phiên đăng nhập đã hết hạn trong quá trình import");
        }

        const response = await fetch("/api/admin/teachers/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentSession.access_token}`,
          },
          body: JSON.stringify({ teachers: chunk }),
        });

        if (!response.ok) {
          let errorMessage = "Có lỗi từ server";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // Response was not JSON
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        const res = data.results;

        totalSuccess += res.success || 0;
        totalSkipped += res.skipped || 0;
        totalErrors += res.errors || 0;

        // Update progress
        const processed = Math.min(i + CHUNK_SIZE, totalTeachers);
        setProgress(Math.round((processed / totalTeachers) * 100));
      }

      showToast(
        `Import hoàn tất! Thành công: ${totalSuccess}, Bỏ qua: ${totalSkipped}, Lỗi: ${totalErrors}`,
        totalSuccess > 0 ? "success" : "warning",
      );

      if (totalSuccess > 0) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Lỗi import:", err);
      showToast(`Lỗi: ${err.message}`, "error");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const validCount = parsedData.filter(
    (t) => t.importStatus === "valid",
  ).length;
  const skippedCount = parsedData.filter(
    (t) => t.importStatus === "skipped_status",
  ).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
            Nhập danh sách giáo viên
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-auto">
          {step === "upload" ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-12 bg-gray-50 text-center">
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tải lên file Excel (.xlsx)
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                File cần có các cột: Mã định danh Bộ GD&ĐT, Họ tên, Ngày sinh,
                Giới tính, Trạng thái...
              </p>
              <label className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold cursor-pointer">
                Chọn file
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                  <p className="font-semibold text-xl">{validCount}</p>
                  <p className="text-xs">Hợp lệ (Sẽ import)</p>
                </div>
                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg border border-orange-200">
                  <p className="font-semibold text-xl">{skippedCount}</p>
                  <p className="text-xs">Bỏ qua (Đã chuyển đi)</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Mã (Username)
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Họ tên
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">
                        Ngày sinh
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedData.slice(0, 100).map((t, idx) => (
                      <tr
                        key={idx}
                        className={
                          t.importStatus === "skipped_status"
                            ? "bg-gray-50 text-gray-400"
                            : t.importStatus === "invalid"
                              ? "bg-red-50 text-red-600"
                              : "hover:bg-blue-50/50"
                        }
                      >
                        <td className="px-4 py-3 font-medium">{t.username}</td>
                        <td className="px-4 py-3">{t.full_name}</td>
                        <td className="px-4 py-3">{t.dob}</td>
                        <td className="px-4 py-3 text-center">
                          {t.importStatus === "valid" ? (
                            <span className="text-green-600 font-medium">
                              Sẵn sàng
                            </span>
                          ) : t.importStatus === "skipped_status" ? (
                            <span>Bỏ qua</span>
                          ) : (
                            <span className="flex items-center justify-center gap-1">
                              <AlertCircle className="w-4 h-4" /> Lỗi dữ liệu
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 100 && (
                  <div className="p-3 text-center text-gray-500 text-sm bg-gray-50 border-t border-gray-200">
                    Đang hiển thị 100 dòng đầu tiên...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "preview" && (
          <div className="border-t border-gray-200 px-4 sm:px-6 py-4 flex flex-col gap-3 bg-gray-50 rounded-b-xl">
            {loading && (
              <div className="w-full">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Đang nhập dữ liệu...</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end mt-2">
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                disabled={loading}
              >
                Chọn file khác
              </button>
              <button
                onClick={handleImport}
                disabled={loading || validCount === 0}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "Đang xử lý..." : `Xác nhận Import (${validCount})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
