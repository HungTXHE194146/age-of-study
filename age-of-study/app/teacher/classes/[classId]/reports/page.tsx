"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getClassDetail } from "@/lib/classService";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import Loading from "@/components/ui/loading";
import { AlertCircle, ArrowLeft, Download, Share2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { NotebookCard, NotebookCardHeader, NotebookCardTitle, NotebookCardContent, NotebookButton } from "@/components/ui/notebook-card";

interface StudentData {
  student_id: string;
  profile: {
    full_name: string | null;
    username: string | null;
    total_xp: number;
    grade: number | null;
  };
}

export default function ReportsPage() {
  const { classId } = useParams();
  const { user } = useAuthStore();
  const [classData, setClassData] = useState<{
    id: number;
    name: string;
    school_year: string;
    students: Array<StudentData>;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

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

  const handleExportImage = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Tăng chất lượng ảnh
        backgroundColor: "#ffffff",
      } as any);

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Bao_Cao_Lop_${classData?.name || 'Class'}.png`;
      link.click();
    } catch (err) {
      console.error("Lỗi xuất ảnh:", err);
      alert("Không thể xuất ảnh lúc này. Vui lòng thử lại.");
    }
  };

  if (loading && !classData) {
    return <Loading message="Đang tạo báo cáo..." size="lg" fullScreen />;
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

  // Calculate some simple stats
  const totalStudents = classData?.students.length || 0;
  const avgXp = totalStudents > 0
    ? Math.round(classData!.students.reduce((acc, s) => acc + s.profile.total_xp, 0) / totalStudents)
    : 0;

  // Sort students by XP for "Top" list
  const topStudents = [...(classData?.students || [])]
    .sort((a, b) => b.profile.total_xp - a.profile.total_xp)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f4f4f9] py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 print:px-0">

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 print:hidden">
          <Link href={`/teacher/classes/${classId}`}>
            <NotebookButton
              className="flex items-center gap-2 bg-white text-black hover:bg-gray-100 w-full sm:w-auto h-12"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại
            </NotebookButton>
          </Link>
          <div className="flex gap-4 w-full sm:w-auto">
            <NotebookButton onClick={handleExportImage} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-300">
              <Download className="w-5 h-5" />
              Lưu Ảnh Báo Cáo
            </NotebookButton>
            <NotebookButton onClick={() => window.print()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-300">
              <Share2 className="w-5 h-5" />
              In Bản Giấy
            </NotebookButton>
          </div>
        </div>

        {/* Report Content - This part gets exported */}
        <div
          ref={reportRef}
          className="bg-white p-8 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] print:shadow-none print:border-none"
        >
          {/* Report Header */}
          <div className="text-center border-b-4 border-black pb-6 mb-6">
            <h1 className="text-4xl font-black uppercase text-blue-900 mb-2">
              Báo Cáo Tóm Tắt Lớp Học
            </h1>
            <h2 className="text-3xl font-bold">Lớp: {classData?.name}</h2>
            <p className="text-xl font-bold text-gray-600 mt-2">
              Năm học: {classData?.school_year} • Ngày xuất: {new Date().toLocaleDateString('vi-VN')}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="border-4 border-black rounded-xl p-6 bg-yellow-100 text-center">
              <div className="text-2xl font-bold mb-2">Tổng Sĩ Số</div>
              <div className="text-6xl font-black text-blue-900">{totalStudents}</div>
              <div className="text-lg font-bold mt-2">Học sinh</div>
            </div>
            <div className="border-4 border-black rounded-xl p-6 bg-purple-100 text-center">
              <div className="text-2xl font-bold mb-2">Điểm TB Lớp</div>
              <div className="text-6xl font-black text-purple-900">{avgXp}</div>
              <div className="text-lg font-bold mt-2">XP / Học sinh</div>
            </div>
          </div>

          {/* Top Students */}
          <div className="mb-8">
            <h3 className="text-2xl font-black bg-black text-white px-4 py-2 inline-block mb-4">
              Biểu Dương Học Tốt
            </h3>
            <div className="border-4 border-black rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-200 border-b-4 border-black text-xl">
                    <th className="p-4 font-black border-r-4 border-black w-24 text-center">Hạng</th>
                    <th className="p-4 font-black border-r-4 border-black">Họ và Tên</th>
                    <th className="p-4 font-black">Điểm XP</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.map((student, idx) => (
                    <tr key={student.student_id} className={`text-xl font-bold ${idx !== topStudents.length - 1 ? 'border-b-4 border-black' : ''}`}>
                      <td className="p-4 border-r-4 border-black text-center text-red-600">
                        #{idx + 1}
                      </td>
                      <td className="p-4 border-r-4 border-black">
                        {student.profile.full_name || student.profile.username}
                      </td>
                      <td className="p-4 text-green-700">
                        {student.profile.total_xp} XP
                      </td>
                    </tr>
                  ))}
                  {topStudents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-xl font-bold text-gray-500">
                        Chưa có dữ liệu học sinh
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center mt-12 pt-6 border-t-2 border-dashed border-gray-400">
            <p className="font-bold text-gray-500 italic">
              Báo cáo được tạo tự động bởi Hệ thống Quản lý Học tập Age of Study.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
