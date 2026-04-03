"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getTeacherClassAnalytics,
  TeacherClassAnalytics,
  ClassAnalytics,
} from "@/lib/analyticsService";
import Loading from "@/components/ui/loading";
import {
  NotebookCard,
  NotebookCardHeader,
  NotebookCardTitle,
  NotebookCardContent,
  NotebookBadge,
  NotebookButton,
} from "@/components/ui/notebook-card";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Download,
  Filter,
} from "lucide-react";
import Link from "next/link";

export default function TeacherAnalyticsPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<TeacherClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return;
      try {
        const result = await getTeacherClassAnalytics(user.id);
        if (result.error) setError(result.error);
        else setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.id]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { totalPages, currentClasses } = useMemo(() => {
    if (!data?.classes) return { totalPages: 1, currentClasses: [] };
    const totalPgs = Math.max(1, Math.ceil(data.classes.length / itemsPerPage));
    const startIdx = (currentPage - 1) * itemsPerPage;
    return {
      totalPages: totalPgs,
      currentClasses: data.classes.slice(startIdx, startIdx + itemsPerPage),
    };
  }, [data?.classes, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading)
    return <Loading message="Đang phân tích dữ liệu..." fullScreen />;

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 p-6 bg-blue-50/50 border-b-2 border-dashed border-blue-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 border-2 border-black rounded-lg flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] rotate-[-2deg]">
            <BarChart3 className="w-8 h-8 text-blue-900" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 font-handwritten tracking-tight">
              Thống kê học vụ
            </h1>
            <p className="text-gray-600 font-bold">
              Báo cáo hiệu quả giảng dạy và tiến độ học sinh
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <NotebookCard className="bg-yellow-50">
            <NotebookCardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-gray-600 font-bold uppercase text-xs">
                  Tổng số lớp
                </p>
                <BookOpen className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-black text-gray-900">
                {data.summary.totalClasses}
              </p>
            </NotebookCardContent>
          </NotebookCard>

          <NotebookCard className="bg-green-50">
            <NotebookCardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-gray-600 font-bold uppercase text-xs">
                  Tổng học sinh
                </p>
                <Users className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-black text-gray-900">
                {data.summary.totalStudents}
              </p>
            </NotebookCardContent>
          </NotebookCard>

          <NotebookCard className="bg-blue-50">
            <NotebookCardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-gray-600 font-bold uppercase text-xs">
                  Điểm TB
                </p>
                <Award className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-black text-gray-900">
                {data.summary.averageScore.toFixed(1)}
              </p>
            </NotebookCardContent>
          </NotebookCard>

          <NotebookCard className="bg-purple-50">
            <NotebookCardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-gray-600 font-bold uppercase text-xs">
                  Hoàn thành
                </p>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-black text-gray-900">
                {data.summary.averageCompletion.toFixed(1)}%
              </p>
            </NotebookCardContent>
          </NotebookCard>
        </div>
      )}

      {/* Classes Table */}
      <NotebookCard>
        <NotebookCardHeader>
          <NotebookCardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" /> Chi tiết từng lớp
          </NotebookCardTitle>
        </NotebookCardHeader>
        <NotebookCardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-black bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-black text-gray-700 uppercase text-sm">
                    Lớp
                  </th>
                  <th className="px-4 py-3 text-center font-black text-gray-700 uppercase text-sm">
                    Học sinh
                  </th>
                  <th className="px-4 py-3 text-center font-black text-gray-700 uppercase text-sm">
                    Điểm TB
                  </th>
                  <th className="px-4 py-3 text-center font-black text-gray-700 uppercase text-sm">
                    Hoàn thành
                  </th>
                  <th className="px-4 py-3 text-center font-black text-gray-700 uppercase text-sm">
                    XP
                  </th>
                  <th className="px-4 py-3 text-right font-black text-gray-700 uppercase text-sm">
                    Tác vụ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentClasses.map((cls: ClassAnalytics) => (
                  <tr
                    key={cls.classId}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="font-black text-gray-900">
                        {cls.className}
                      </div>
                      <div className="text-xs text-gray-500 font-bold">
                        Năm: {cls.schoolYear}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-bold">
                      {cls.studentCount}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-md border-2 border-black font-black ${
                          cls.averageScore >= 8
                            ? "bg-green-100 text-green-900"
                            : cls.averageScore >= 5
                              ? "bg-yellow-100 text-yellow-900"
                              : "bg-red-100 text-red-900"
                        }`}
                      >
                        {cls.averageScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1 border border-black max-w-[100px] mx-auto">
                        <div
                          className="bg-blue-600 h-2 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]"
                          style={{ width: `${cls.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold">
                        {cls.completionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-orange-600">
                      {cls.totalXP.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link href={`/teacher/classes/${cls.classId}`}>
                        <NotebookButton className="bg-white border-blue-900 text-blue-900 h-8 text-sm px-4 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                          Chi tiết <ChevronRight className="w-4 h-4 ml-1" />
                        </NotebookButton>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-6 border-t-2 border-dashed border-gray-200 mt-4">
              <NotebookButton
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 disabled:opacity-50 disabled:cursor-not-allowed bg-white border-gray-400"
              >
                <ChevronLeft className="w-6 h-6" />
              </NotebookButton>

              <div className="text-xl font-black text-gray-800 bg-white border-2 border-black px-6 py-2 rounded-md shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                {currentPage} / {totalPages}
              </div>

              <NotebookButton
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 disabled:opacity-50 disabled:cursor-not-allowed bg-white border-gray-400"
              >
                <ChevronRight className="w-6 h-6" />
              </NotebookButton>
            </div>
          )}
        </NotebookCardContent>
      </NotebookCard>
    </div>
  );
}
