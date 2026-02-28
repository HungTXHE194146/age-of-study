import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileDown, CheckCircle, AlertCircle, Users, UserPlus, Edit3 } from "lucide-react";
import * as xlsx from "xlsx";
import Loading, { LoadingSpinner } from "@/components/ui/loading";
import { motion, AnimatePresence } from "framer-motion";

interface ParsedStudent {
  username: string; // Mã định danh
  full_name: string; // Họ tên
  dob?: string;
  gender?: string;
  ethnicity?: string;
  phone_number?: string;
  enroll_status?: string;
  sessions_per_week?: string;
}

interface AddStudentFromExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  onSuccess: () => void;
}

export function AddStudentFromExcelModal({
  isOpen,
  onClose,
  classId,
  onSuccess,
}: AddStudentFromExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    successCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setSuccessResult(null);
    parseExcel(selectedFile);
  };

  const parseExcel = async (file: File) => {
    setIsParsing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON array of arrays to find header row dynamically
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (jsonData.length < 2) {
        throw new Error("File không có dữ liệu hợp lệ.");
      }

      // Try to find columns intuitively
      let usernameColIdx = -1;
      let nameColIdx = -1;
      let dobColIdx = -1;
      let genderColIdx = -1;
      let ethnicityColIdx = -1;
      let phoneColIdx = -1;
      let statusColIdx = -1;
      let sessionsColIdx = -1;
      
      let headerRowIdx = -1;

      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        if (!row || !Array.isArray(row)) continue;

        for (let j = 0; j < row.length; j++) {
          const cellStr = String(row[j] || "").toLowerCase().replace(/\s+/g, '');
          if (cellStr.includes('mãđịnhdanh') || cellStr.includes('madinhdanh') || cellStr === 'username') {
            usernameColIdx = j;
            headerRowIdx = i;
          }
          if (cellStr.includes('họvàtên') || cellStr.includes('họtên') || cellStr.includes('hovaten') || cellStr === 'hoten') {
            nameColIdx = j;
            if (headerRowIdx === -1) headerRowIdx = i;
          }
          if (cellStr.includes('ngàysinh') || cellStr.includes('ngaysinh')) dobColIdx = j;
          if (cellStr === 'giớitính' || cellStr === 'gioitinh' || cellStr.includes('giới')) genderColIdx = j;
          if (cellStr.includes('dântộc') || cellStr.includes('dantoc')) ethnicityColIdx = j;
          if (cellStr.includes('sđt') || cellStr.includes('sdt') || cellStr.includes('điệnthoại')) phoneColIdx = j;
          if (cellStr.includes('trạngthái') || cellStr.includes('trangthai')) statusColIdx = j;
          if (cellStr.includes('sốbuổihọc') || cellStr.includes('sobuoihoc')) sessionsColIdx = j;
        }
        if (usernameColIdx !== -1 && nameColIdx !== -1) break;
      }

      if (usernameColIdx === -1 || nameColIdx === -1) {
        throw new Error("Không tìm thấy cột 'Mã định danh' hoặc 'Họ tên' trong file. Vui lòng kiểm tra lại định dạng.");
      }

      const students: ParsedStudent[] = [];
      const usedUsernames = new Set<string>();

      // Read data starts from headerRow + 1
      for (let i = headerRowIdx + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || !row.length) continue;

        const rawUsername = row[usernameColIdx];
        const rawName = row[nameColIdx];

        if (!rawUsername || !rawName) continue; // Skip empty rows

        const cleanUsername = String(rawUsername).trim().toLowerCase();
        const cleanName = String(rawName).trim();
        const cleanDob = dobColIdx !== -1 && row[dobColIdx] ? String(row[dobColIdx]).trim() : undefined;
        const cleanGender = genderColIdx !== -1 && row[genderColIdx] ? String(row[genderColIdx]).trim() : undefined;
        const cleanEthnicity = ethnicityColIdx !== -1 && row[ethnicityColIdx] ? String(row[ethnicityColIdx]).trim() : undefined;
        const cleanPhone = phoneColIdx !== -1 && row[phoneColIdx] ? String(row[phoneColIdx]).trim() : undefined;
        const cleanStatus = statusColIdx !== -1 && row[statusColIdx] ? String(row[statusColIdx]).trim() : undefined;
        const cleanSessions = sessionsColIdx !== -1 && row[sessionsColIdx] ? String(row[sessionsColIdx]).trim() : undefined;

        if (cleanUsername && cleanName && !usedUsernames.has(cleanUsername)) {
          students.push({
            username: cleanUsername,
            full_name: cleanName,
            dob: cleanDob,
            gender: cleanGender,
            ethnicity: cleanEthnicity,
            phone_number: cleanPhone,
            enroll_status: cleanStatus,
            sessions_per_week: cleanSessions
          });
          usedUsernames.add(cleanUsername);
        }
      }

      if (students.length === 0) {
        throw new Error("Không tìm thấy dữ liệu học sinh hợp lệ nào từ các cột đã chọn.");
      }

      setParsedData(students);
    } catch (err: any) {
      setError(err.message || "Lỗi đọc file Excel.");
      setParsedData([]);
    } finally {
      setIsParsing(false);
    }
  };

  const downloadTemplate = () => {
    const ws = xlsx.utils.json_to_sheet([
      { 
        "STT": 1, 
        "Mã định danh Bộ GD&ĐT": "0123456789", 
        "Họ tên": "Nguyễn Văn A",
        "Ngày sinh": "01/01/2015",
        "Giới tính": "Nam",
        "Dân tộc": "Kinh",
        "Trạng thái": "Đang học",
        "SĐT liên hệ": "0912345678",
        "Số buổi học trên tuần": "9 buổi/tuần"
      },
      { 
        "STT": 2, 
        "Mã định danh Bộ GD&ĐT": "0987654321", 
        "Họ tên": "Trần Thị B",
        "Ngày sinh": "15/06/2015",
        "Giới tính": "Nữ",
        "Dân tộc": "Tày",
        "Trạng thái": "Đang học",
        "SĐT liên hệ": "0987654321",
        "Số buổi học trên tuần": "9 buổi/tuần"
      }
    ]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "HocSinh");
    xlsx.writeFile(wb, "danh_sach_mau.xlsx");
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;

    setIsUploading(true);
    setError(null);
    setSuccessResult(null);

    try {
      const response = await fetch("/api/teacher/students/batch-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          class_id: classId,
          students: parsedData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Lỗi hệ thống khi tạo tài khoản hàng loạt.");
      }

      setSuccessResult({
        successCount: result.details.successCount,
        failedCount: result.details.failedCount,
        errors: result.details.errors,
      });

      if (result.details.successCount > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setError(null);
    setSuccessResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white text-gray-900 rounded-2xl shadow-xl overflow-hidden p-0 gap-0 border-0">
        <DialogHeader className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-blue-900">
            <Users className="w-6 h-6" /> Nhập danh sách từ Excel
          </DialogTitle>
          <DialogDescription className="text-blue-700/80 text-sm mt-1">
            Tự động tạo tài khoản học sinh hàng loạt với tên đăng nhập từ Mã định danh và mật khẩu mặc định là <strong className="text-blue-900 font-mono bg-blue-100 px-1 rounded">12345678</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {successResult ? (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
               <div className="text-center py-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Hoàn Tất Tiến Trình!</h3>
                  <div className="mt-4 flex justify-center gap-6">
                    <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                      <span className="block text-2xl font-black text-green-600">{successResult.successCount}</span>
                      <span className="text-xs text-green-700 font-medium">Thành công</span>
                    </div>
                    {successResult.failedCount > 0 && (
                      <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                        <span className="block text-2xl font-black text-red-600">{successResult.failedCount}</span>
                        <span className="text-xs text-red-700 font-medium">Thất bại</span>
                      </div>
                    )}
                  </div>
               </div>

               {successResult.errors.length > 0 && (
                 <div className="bg-red-50 border border-red-100 p-4 rounded-xl max-h-40 overflow-y-auto mt-4">
                    <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4"/> Chi tiết lỗi:
                    </h4>
                    <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                      {successResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                 </div>
               )}

               <div className="flex justify-end gap-3 pt-4">
                 <Button variant="outline" onClick={handleClose}>Đóng</Button>
               </div>
             </motion.div>
          ) : (
            <div className="space-y-6">
              {/* File Upload Area */}
              {!file ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                  <p className="text-gray-900 font-medium text-lg mb-1">Nhấn để chọn file Excel (.xlsx, .xls)</p>
                  <p className="text-gray-500 text-sm mb-4">Hoặc kéo thả file vào đây</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".xlsx, .xls, .csv" 
                    className="hidden" 
                  />
                  
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); downloadTemplate(); }} className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                      <FileDown className="w-4 h-4" /> Tải file mẫu
                    </Button>
                  </div>
                </div>
              ) : (
                 <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 text-blue-600 rounded-lg shadow-sm border border-blue-100">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900 text-sm">{file.name}</p>
                        <p className="text-xs text-blue-600">
                          {isParsing ? "Đang đọc dữ liệu..." : `Tìm thấy ${parsedData.length} học sinh hợp lệ`}
                        </p>
                      </div>
                    </div>
                    {!isUploading && (
                      <button onClick={resetState} className="text-sm font-medium text-blue-600 hover:underline">
                        Chọn lại
                      </button>
                    )}
                 </div>
              )}

              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200 text-sm flex items-start gap-2">
                       <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                       <span className="font-medium">{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preview Table */}
              {parsedData.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden mt-4 shadow-sm">
                  <div className="max-h-[250px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 bg-gray-50 sticky top-0 uppercase font-bold">
                        <tr>
                          <th className="px-4 py-3">STT</th>
                          <th className="px-4 py-3">Mã định danh</th>
                          <th className="px-4 py-3">Họ và tên</th>
                          <th className="px-4 py-3 hidden md:table-cell">Ngày sinh</th>
                          <th className="px-4 py-3 hidden md:table-cell">Giới tính</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {parsedData.slice(0, 50).map((row, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/50">
                            <td className="px-4 py-2 text-gray-500 w-12">{idx + 1}</td>
                            <td className="px-4 py-2 font-mono font-medium text-blue-700">{row.username}</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{row.full_name}</td>
                            <td className="px-4 py-2 text-gray-600 hidden md:table-cell">{row.dob || '-'}</td>
                            <td className="px-4 py-2 text-gray-600 hidden md:table-cell">{row.gender || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.length > 50 && (
                    <div className="bg-gray-50 text-center py-2 text-xs font-semibold text-gray-500 border-t border-gray-200">
                      Hiển thị 50 / {parsedData.length} kết quả
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {!successResult && (
          <DialogFooter className="p-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="outline" onClick={handleClose} disabled={isUploading} className="font-semibold text-gray-600">
              Hủy bỏ
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || isParsing || parsedData.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md gap-2"
            >
              {isUploading ? <><LoadingSpinner size="sm" /> Đang tạo...</> : "Tải lên Dữ liệu"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  onSuccess: () => void;
}

export function AddStudentModal({
  isOpen,
  onClose,
  classId,
  onSuccess,
}: AddStudentModalProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setFullName("");
    setUsername("");
    setDob("");
    setGender("");
    setPhone("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/teacher/students/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          username: username.trim().toLowerCase(),
          dob: dob.trim(),
          gender: gender.trim(),
          phone_number: phone.trim(),
          class_id: classId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Có lỗi xảy ra khi tạo học sinh");
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-transparent border-0 shadow-none p-0">
        <div className="bg-[#fffdf8] border-2 border-black rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,1)] overflow-hidden relative">
          {/* Notebook Header */}
          <div className="bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2rem] p-6 border-b-2 border-dashed border-gray-400">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 border-2 border-black rounded-full flex items-center justify-center -rotate-6 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <UserPlus className="w-5 h-5 text-blue-800" />
              </div>
              <DialogTitle className="text-3xl font-black font-handwritten text-gray-900 drop-shadow-sm">
                Thêm Học Sinh Mới
              </DialogTitle>
            </div>
            <DialogDescription className="text-gray-700 font-bold mt-2 font-handwritten text-lg ml-14">
              Mật khẩu mặc định: <span className="bg-yellow-200 px-2 border border-black rounded-md">12345678</span>
            </DialogDescription>
          </div>

          <form onSubmit={handleSubmit} className="p-6 relative">
             {/* Margin line */}
             <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-red-300"></div>
             
             <div className="space-y-4 pl-6">
                {error && (
                  <div className="bg-red-50 border-2 border-dashed border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm font-bold flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider font-handwritten text-lg">
                      Họ và Tên *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-transparent border-b-2 border-dashed border-gray-400 focus:border-blue-500 focus:outline-none transition-colors font-medium text-gray-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider font-handwritten text-lg">
                      Tên đăng nhập *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: nguyenvana1A"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-transparent border-b-2 border-dashed border-gray-400 focus:border-blue-500 focus:outline-none transition-colors font-mono font-bold text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider font-handwritten text-lg">
                      Ngày sinh
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-transparent border-b-2 border-dashed border-gray-400 focus:border-blue-500 focus:outline-none transition-colors font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider font-handwritten text-lg">
                      Giới tính
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-transparent border-b-2 border-dashed border-gray-400 focus:border-blue-500 focus:outline-none transition-colors font-medium text-gray-900"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider font-handwritten text-lg">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      placeholder="SDT Phụ huynh / Học sinh"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-transparent border-b-2 border-dashed border-gray-400 focus:border-blue-500 focus:outline-none transition-colors font-medium text-gray-900"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t-2 border-dashed border-gray-300">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-white border-2 border-black text-gray-800 font-bold rounded hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-[#ffde59] border-2 border-black text-black font-black rounded hover:bg-[#efce49] transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? <><LoadingSpinner size="sm" /> Đang lưu...</> : "Tạo mới"}
                  </button>
                </div>
             </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any | null; // Student data
  onSuccess: () => void;
}

export function EditStudentModal({
  isOpen,
  onClose,
  student,
  onSuccess,
}: EditStudentModalProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student && isOpen) {
      setFullName(student.profile?.full_name || "");
      setUsername(student.profile?.username || "");
      setDob(student.profile?.dob || "");
      setGender(student.profile?.gender || "");
      setPhone(student.profile?.phone_number || "");
      setError(null);
    }
  }, [student, isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !student) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/teacher/students/${student.student_id}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          username: username.trim().toLowerCase(),
          dob: dob.trim(),
          gender: gender.trim(),
          phone_number: phone.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Có lỗi xảy ra khi cập nhật học sinh");
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-transparent border-0 shadow-none p-0">
        <div className="bg-[#fffdf8] border-2 border-black rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,1)] overflow-hidden relative">
          {/* Notebook Header */}
          <div className="bg-[linear-gradient(transparent_95%,#e0f2fe_95%)] bg-[length:100%_2rem] p-6 border-b-2 border-dashed border-gray-400">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 border-2 border-black rounded-full flex items-center justify-center -rotate-6 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <Edit3 className="w-5 h-5 text-blue-800" />
              </div>
              <DialogTitle className="text-3xl font-black font-handwritten text-gray-900 drop-shadow-sm">
                Sửa Thông Tin Học Sinh
              </DialogTitle>
            </div>
            <DialogDescription className="text-gray-700 font-bold mt-2 font-handwritten text-lg ml-14">
              Cập nhật hồ sơ cho <span className="text-blue-700">{student?.profile?.username}</span>
            </DialogDescription>
          </div>

          <form onSubmit={handleSubmit} className="p-6 relative">
             {/* Margin line */}
             <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-red-300"></div>
             
             <div className="space-y-4 pl-6">
                {error && (
                  <div className="bg-red-50 border-2 border-dashed border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm font-bold flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider font-handwritten text-lg">
                      Họ và Tên *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-transparent border-b-2 border-dashed border-gray-400 focus:border-blue-500 focus:outline-none transition-colors font-medium text-gray-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider font-handwritten text-lg">
                      Tên đăng nhập *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: nguyenvana1A"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-transparent border-b-2 border-dashed border-gray-400 focus:border-blue-500 focus:outline-none transition-colors font-mono font-bold text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider font-handwritten text-lg">
                      Ngày sinh
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-transparent border-b-2 border-dashed border-gray-400 focus:border-blue-500 focus:outline-none transition-colors font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider font-handwritten text-lg">
                      Giới tính
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-transparent border-b-2 border-dashed border-gray-400 focus:border-blue-500 focus:outline-none transition-colors font-medium text-gray-900"
                    >
                      <option value="">Chọn</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider font-handwritten text-lg">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      placeholder="SDT Phụ huynh / Học sinh"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-transparent border-b-2 border-dashed border-gray-400 focus:border-blue-500 focus:outline-none transition-colors font-medium text-gray-900"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t-2 border-dashed border-gray-300">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-white border-2 border-black text-gray-800 font-bold rounded hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-[#ffde59] border-2 border-black text-black font-black rounded hover:bg-[#efce49] transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? <><LoadingSpinner size="sm" /> Đang lưu...</> : "Cập nhật"}
                  </button>
                </div>
             </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
