"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getClassDetail } from "@/lib/classService";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import Loading from "@/components/ui/loading";
import { AlertCircle, ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { NotebookCard, NotebookCardTitle, NotebookButton } from "@/components/ui/notebook-card";

interface StudentData {
  student_id: string;
  profile: {
    full_name: string | null;
    username: string | null;
  };
}

export default function QRCodesPage() {
  const { classId } = useParams();
  const { user } = useAuthStore();
  const [classData, setClassData] = useState<{
    id: number;
    name: string;
    students: Array<StudentData>;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!classId || !user?.id) return;

      try {
        setLoading(true);
        const classResult = await getClassDetail(Number(classId));
        if (classResult.error) {
          setError(classResult.error);
          return;
        }
        setClassData(classResult.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [classId, user?.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading && !classData) {
    return <Loading message="Đang tạo mã QR..." size="lg" fullScreen />;
  }

  if (error) {
    return (
      <div className="p-8">
        <NotebookCard className="max-w-xl mx-auto border-red-900 border-4">
          <div className="bg-red-100 p-6 border-b-2 border-red-900">
            <AlertCircle className="w-10 h-10 text-red-600 mb-2" />
            <NotebookCardTitle className="text-red-900">
              Lỗi Tải Dữ Liệu
            </NotebookCardTitle>
          </div>
          <div className="p-6">
            <p className="font-bold text-xl">{error}</p>
          </div>
        </NotebookCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f9] py-8 print:bg-white print:py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:px-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href={`/teacher/classes/${classId}`}>
            <Button
              variant="outline"
              size="lg"
              className="flex items-center gap-2 border-2 border-black font-bold text-lg hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại Sổ Lớp
            </Button>
          </Link>
          <NotebookButton onClick={handlePrint} className="flex items-center gap-2 bg-blue-300">
            <Printer className="w-6 h-6" />
            In Mã QR Cho Cả Lớp
          </NotebookButton>
        </div>

        <div className="mb-8 text-center print:mt-8">
          <h1 className="text-4xl font-black text-black uppercase tracking-tight">
            Thẻ Đăng Nhập Lớp {classData?.name}
          </h1>
          <p className="text-xl font-bold text-gray-600 mt-2 print:hidden">
            Cắt ra và phát cho từng học sinh để các em tự quét mã vào học.
          </p>
        </div>

        {/* Lưới in: 3 cột trên máy tính/giấy, 1 cột trên mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 print:gap-4 print:grid-cols-3">
          {classData?.students.map((student) => {
            // Chuỗi dữ liệu cho QR code: Định dạng chứa action login, username và password
            const qrData = JSON.stringify({
              action: "qr_login_v1",
              classId: classId,
              studentId: student.student_id,
              username: student.profile.username,
              password: "12345678"
            });

            return (
              <div 
                key={student.student_id} 
                className="bg-white border-4 border-black border-dashed rounded-xl p-6 flex flex-col items-center text-center print:break-inside-avoid print:shadow-none shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
              >
                <div className="text-2xl font-black text-blue-900 mb-1 max-w-full truncate px-2">
                  {student.profile.full_name || student.profile.username}
                </div>
                <div className="text-lg font-bold text-gray-600 mb-6">
                  {student.profile.username}
                </div>
                
                <div className="p-4 border-4 border-black rounded-lg bg-white inline-block">
                  <QRCodeSVG 
                    value={qrData} 
                    size={160}
                    level="H" // High error correction, dễ quét ngay cả khi giấy in mờ
                  />
                </div>
                
                <div className="mt-6 text-sm font-bold text-gray-500 uppercase">
                  Quét mã để vào học
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
