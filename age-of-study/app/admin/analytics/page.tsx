"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getClassComparisonData,
  exportClassDataToCSV,
  type ClassAnalytics,
  type ClassComparisonData,
} from "@/lib/analyticsService";
import Loading from "@/components/ui/loading";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  Download,
  FileSpreadsheet,
} from "lucide-react";

export default function ClassAnalyticsPage() {
  const [data, setData] = useState<ClassComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | "all">(5);
  const [sortBy, setSortBy] = useState<keyof ClassAnalytics>("averageScore");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getClassComparisonData();
      if (result.error) {
        setError(result.error);
      } else {
        setData(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const filteredSummary = useMemo(() => {
    if (!data) return null;
    if (selectedGrade === "all") return data.summary;

    const classes = data.classes.filter((c) => c.grade === selectedGrade);
    const totalStudents = classes.reduce(
      (sum, c) => sum + (c.studentCount || 0),
      0,
    );
    const avgScore =
      classes.length > 0
        ? classes.reduce((sum, c) => sum + (c.averageScore || 0), 0) /
          classes.length
        : 0;
    const avgCompletion =
      classes.length > 0
        ? classes.reduce((sum, c) => sum + (c.completionRate || 0), 0) /
          classes.length
        : 0;
    const totalActiveInGrade = classes.reduce(
      (sum, c) => sum + (c.activeStudents || 0),
      0,
    );
    const avgParticipation =
      totalStudents > 0 ? (totalActiveInGrade / totalStudents) * 100 : 0;

    const sortedByScore = [...classes].sort(
      (a, b) => b.averageScore - a.averageScore,
    );

    return {
      totalClasses: classes.length,
      totalStudents,
      averageScore: avgScore,
      averageCompletion: avgCompletion,
      averageParticipation: avgParticipation,
      highestPerformingClass:
        sortedByScore.length > 0 ? sortedByScore[0].className : null,
      lowestPerformingClass:
        sortedByScore.length > 0
          ? sortedByScore[sortedByScore.length - 1].className
          : null,
    };
  }, [data, selectedGrade]);

  const handleSort = (key: keyof ClassAnalytics) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
  };

  const sortedClasses = useMemo(() => {
    if (!data?.classes) return [];
    const filtered =
      selectedGrade === "all"
        ? data.classes
        : data.classes.filter((c) => c.grade === selectedGrade);

    return [...filtered].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const modifier = sortOrder === "asc" ? 1 : -1;

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * modifier;
      }
      return ((aVal as number) - (bVal as number)) * modifier;
    });
  }, [data, sortBy, sortOrder, selectedGrade]);

  const exportToExcel = async () => {
    if (!data?.classes) return;
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Phân tích lớp học");

    // Simple header
    sheet.columns = [
      { header: "Tên lớp", key: "className", width: 15 },
      { header: "Khối", key: "grade", width: 10 },
      { header: "Sĩ số", key: "studentCount", width: 10 },
      { header: "Điểm TB", key: "averageScore", width: 12 },
      { header: "Tiến độ (%)", key: "completionRate", width: 15 },
      { header: "Bài học HT", key: "completedNodes", width: 12 },
    ];

    data.classes.forEach((c) => {
      sheet.addRow({
        className: c.className,
        grade: c.grade,
        studentCount: c.studentCount,
        averageScore: parseFloat(c.averageScore.toFixed(1)),
        completionRate: parseFloat(c.completionRate.toFixed(1)),
        completedNodes: c.completedNodes,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `phan-tich-analytics.xlsx`;
    link.click();
  };

  const exportToCSV = () => {
    if (!data?.classes) return;
    const csv = exportClassDataToCSV(data.classes);
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "phan-tich-analytics.csv";
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading message="Đang tải dữ liệu báo cáo..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Lỗi tải dữ liệu:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header & Grade Filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              So sánh hiệu suất lớp học
            </h1>
            <p className="text-gray-600">
              Phân tích học tập và sự chuyên cần theo từng khối lớp
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-all flex items-center gap-2 border-2 border-gray-200"
            >
              <Download className="w-5 h-5" /> CSV
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all flex items-center gap-2 border-2 border-indigo-700 shadow-md"
            >
              <FileSpreadsheet className="w-5 h-5" /> Excel
            </button>
          </div>
        </div>

        {/* Grade Tabs */}
        <div className="flex overflow-x-auto bg-white p-1 rounded-2xl border-2 border-gray-200 max-w-fit mb-8 shadow-sm">
          {[5, 4, 3, 2, 1, "all"].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g as any)}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
                selectedGrade === g
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {g === "all" ? "Tất cả" : `Khối ${g}`}
            </button>
          ))}
        </div>
      </div>

      {filteredSummary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white rounded-2xl border-2 border-blue-100 p-6 shadow-sm">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                Điểm học tập TB
              </p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-black text-blue-600">
                  {(filteredSummary.averageScore ?? 0).toFixed(1)}
                </p>
                <p className="text-sm text-gray-400 mb-1 font-bold">/ 100</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-amber-100 p-6 shadow-sm">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                Tiến độ Chương trình
              </p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-black text-amber-600">
                  {(filteredSummary.averageCompletion ?? 0).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-emerald-100 p-6 shadow-sm">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                Tỷ lệ Hoạt động
              </p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-black text-emerald-600">
                  {(filteredSummary.averageParticipation ?? 0).toFixed(0)}%
                </p>
                <Users className="w-5 h-5 text-gray-300 mb-2" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl border-2 border-indigo-800 p-6 shadow-lg shadow-indigo-100">
              <p className="text-sm font-bold text-indigo-100 uppercase tracking-wider mb-2">
                Lớp xuất sắc nhất
              </p>
              <p className="text-3xl font-black text-white truncate">
                {filteredSummary.highestPerformingClass || "---"}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Award className="w-4 h-4 text-amber-300" />
                <span className="text-xs text-indigo-100 font-bold">
                  Hiệu suất dẫn đầu
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-xl mb-12">
            <div className="px-6 py-4 border-b-2 border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">
                Chi tiết so sánh lớp học
              </h3>
              <div className="text-xs font-bold text-gray-400">
                Sắp xếp theo:{" "}
                <span className="text-indigo-600 uppercase">{sortBy}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th
                      onClick={() => handleSort("className")}
                      className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      Lớp{" "}
                      {sortBy === "className" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-widest">
                      Sĩ số
                    </th>
                    <th
                      onClick={() => handleSort("averageScore")}
                      className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      Điểm TB{" "}
                      {sortBy === "averageScore" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("completionRate")}
                      className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      Tiến độ{" "}
                      {sortBy === "completionRate" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-widest">
                      Bài hoàn thành
                    </th>
                    <th
                      onClick={() => handleSort("activeStudents")}
                      className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      Hoạt động{" "}
                      {sortBy === "activeStudents" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100">
                  {sortedClasses.map((cls) => (
                    <tr
                      key={cls.classId}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center font-black text-indigo-700 text-sm border-2 border-indigo-200">
                            {cls.className.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-black text-gray-900">
                              {cls.className}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              Khối {cls.grade}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center font-black text-gray-600">
                        {cls.studentCount}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-sm font-black border-2 ${
                            cls.averageScore >= 80
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : cls.averageScore >= 50
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-red-50 text-red-700 border-red-100"
                          }`}
                        >
                          {cls.averageScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-sm font-black text-gray-900 w-12 text-right">
                            {cls.completionRate.toFixed(1)}%
                          </span>
                          <div className="w-24 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                cls.completionRate >= 80
                                  ? "bg-emerald-500"
                                  : cls.completionRate >= 40
                                    ? "bg-indigo-500"
                                    : "bg-rose-500"
                              }`}
                              style={{
                                width: `${Math.min(100, cls.completionRate)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="inline-flex bg-gray-50 px-3 py-1.5 rounded-xl border-2 border-gray-100 font-black text-gray-600 text-sm group-hover:border-indigo-200 transition-colors">
                          {(
                            cls.completedNodes / (cls.studentCount || 1)
                          ).toFixed(1)}{" "}
                          / {cls.curriculumNodes || 0}{" "}
                          <span className="text-[10px] text-gray-400 ml-1 mt-0.5">
                            BÀI
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-sm font-black ${
                              cls.activeStudents / cls.studentCount >= 0.8
                                ? "text-emerald-600"
                                : cls.activeStudents / cls.studentCount >= 0.5
                                  ? "text-indigo-600"
                                  : "text-rose-600"
                            }`}
                          >
                            {(
                              (cls.activeStudents / cls.studentCount) *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">
                            {cls.activeStudents} / {cls.studentCount} HS
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedClasses.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-20 text-center text-gray-400 font-bold italic"
                      >
                        Không có dữ liệu cho khối lớp học này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
