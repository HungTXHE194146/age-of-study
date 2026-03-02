"use client";

import { useEffect, useState } from "react";
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
import ExcelJS from "exceljs";

export default function ClassAnalyticsPage() {
  const [data, setData] = useState<ClassComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const handleSort = (key: keyof ClassAnalytics) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
  };

  const sortedClasses = data?.classes
    ? [...data.classes].sort((a, b) => {
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
      })
    : [];

  const exportToExcel = async () => {
    if (!data?.classes) return;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Age of Study Admin";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Phân tích lớp học");
    const COL_COUNT = 10;

    // ── Border helpers ─────────────────────────────────────────────────────
    type BS = ExcelJS.BorderStyle;
    const thin = (argb = "FFD1D5DB") => ({ style: "thin" as BS, color: { argb } });
    const medium = (argb = "FF9CA3AF") => ({ style: "medium" as BS, color: { argb } });
    const CELL_BORDER = { top: thin(), left: thin(), bottom: thin(), right: thin() };
    const OUTER_BORDER = { top: medium(), left: medium(), bottom: medium(), right: medium() };

    const applyBorders = (row: ExcelJS.Row, isLast = false) =>
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = isLast ? { ...CELL_BORDER, bottom: medium() } : CELL_BORDER;
      });

    // ── Title block (rows 1-2) ─────────────────────────────────────────────
    sheet.mergeCells(1, 1, 1, COL_COUNT);
    const titleCell = sheet.getCell("A1");
    titleCell.value = "BẢNG PHÂN TÍCH SO SÁNH LỚP HỌC";
    titleCell.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    titleCell.border = OUTER_BORDER;
    sheet.getRow(1).height = 34;

    sheet.mergeCells(2, 1, 2, COL_COUNT);
    const dateCell = sheet.getCell("A2");
    dateCell.value = `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}  |  Age of Study`;
    dateCell.font = { italic: true, size: 10, color: { argb: "FF374151" } };
    dateCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } };
    dateCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(2).height = 20;

    // ── Column widths ──────────────────────────────────────────────────────
    const colWidths = [18, 8, 12, 8, 12, 16, 13, 13, 13, 18];
    colWidths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

    // ── Header row (row 3) ─────────────────────────────────────────────────
    const headerRow = sheet.getRow(3);
    const headers = ["Tên lớp", "Khối", "Năm học", "Sĩ số", "Điểm TB", "Hoàn thành (%)", "HS hoạt động", "% Hoạt động", "HS không HĐ", "Tiến độ (HT/Tổng)"];
    headers.forEach((h, i) => { headerRow.getCell(i + 1).value = h; });
    headerRow.height = 30;
    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: medium("FF1E40AF"),
        left: thin("FF3B82F6"),
        bottom: medium("FF93C5FD"),
        right: thin("FF3B82F6"),
      };
    });

    // ── Color helpers ──────────────────────────────────────────────────────
    const getScoreColor = (score: number, hasData: boolean) => {
      if (!hasData) return "FFFAFAFA";
      if (score >= 80) return "FFDCFCE7";
      if (score >= 60) return "FFFEF9C3";
      return "FFFEE2E2";
    };
    const getRateColor = (rate: number) => {
      if (rate === 0) return "FFFAFAFA";
      if (rate >= 80) return "FFDCFCE7";
      if (rate >= 50) return "FFFEF9C3";
      return "FFFEE2E2";
    };

    // ── Data rows (start at row 4) ─────────────────────────────────────────
    const classes = data.classes;
    classes.forEach((c, idx) => {
      const hasScoreData = c.completedNodes > 0;
      const activeRate = c.studentCount > 0 ? (c.activeStudents / c.studentCount) * 100 : 0;
      const rowBg = idx % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";
      const isLast = idx === classes.length - 1;

      const row = sheet.getRow(idx + 4);
      const values = [
        c.className,
        c.grade,
        c.schoolYear,
        c.studentCount,
        hasScoreData ? parseFloat(c.averageScore.toFixed(1)) : "-",
        hasScoreData ? parseFloat(c.completionRate.toFixed(1)) : "-",
        c.activeStudents,
        parseFloat(activeRate.toFixed(1)),
        c.studentCount - c.activeStudents,
        `${c.completedNodes}/${c.totalAssignedNodes}`,
      ];
      values.forEach((v, i) => { row.getCell(i + 1).value = v as ExcelJS.CellValue; });
      row.height = 22;

      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
        cell.alignment = { vertical: "middle", horizontal: colNum === 1 ? "left" : "center" };
      });

      row.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: getScoreColor(c.averageScore, hasScoreData) } };
      row.getCell(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: getRateColor(c.completionRate) } };
      row.getCell(8).fill = { type: "pattern", pattern: "solid", fgColor: { argb: getRateColor(activeRate) } };

      applyBorders(row, isLast);
    });

    // ── Summary row ────────────────────────────────────────────────────────
    if (classes.length > 0) {
      const totalStudents = classes.reduce((s, c) => s + c.studentCount, 0);
      const totalActive = classes.reduce((s, c) => s + c.activeStudents, 0);
      const avgScore = classes.reduce((s, c) => s + c.averageScore, 0) / classes.length;
      const avgCompletion = classes.reduce((s, c) => s + c.completionRate, 0) / classes.length;
      const avgActiveRate = totalStudents > 0 ? (totalActive / totalStudents) * 100 : 0;
      const hasAnyScore = classes.some((c) => c.completedNodes > 0);

      const sumRow = sheet.getRow(classes.length + 4);
      const sumValues = [
        "TRUNG BÌNH TOÀN TRƯỜNG", "", "",
        totalStudents,
        hasAnyScore ? parseFloat(avgScore.toFixed(1)) : "-",
        hasAnyScore ? parseFloat(avgCompletion.toFixed(1)) : "-",
        totalActive,
        parseFloat(avgActiveRate.toFixed(1)),
        totalStudents - totalActive,
        "",
      ];
      sumValues.forEach((v, i) => { sumRow.getCell(i + 1).value = v as ExcelJS.CellValue; });
      sumRow.height = 24;
      sumRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
        cell.font = { bold: true };
        cell.alignment = { vertical: "middle", horizontal: colNum === 1 ? "left" : "center" };
        cell.border = { top: medium(), left: thin(), bottom: medium(), right: thin() };
      });
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `phan-tich-lop-hoc-${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (!data?.classes) return;

    const csv = exportClassDataToCSV(data.classes);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `phan-tich-lop-hoc-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <Loading />;
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

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Không có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            So sánh lớp học
          </h1>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          Phân tích và so sánh hiệu suất giữa các lớp học
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border-2 border-blue-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Tổng số lớp</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalClasses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-green-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Tổng học sinh</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-purple-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Điểm TB chung</p>
              <p className="text-2xl font-bold text-gray-900">
                {(data.summary.averageScore ?? 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-amber-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Hoàn thành TB</p>
              <p className="text-2xl font-bold text-gray-900">
                {(data.summary.averageCompletion ?? 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-emerald-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Lớp xuất sắc nhất</p>
              <p className="text-lg font-bold text-gray-900 truncate">
                {data.summary.highestPerformingClass || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-red-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Lớp cần cải thiện</p>
              <p className="text-lg font-bold text-gray-900 truncate">
                {data.summary.lowestPerformingClass || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th
                  onClick={() => handleSort("className")}
                  className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Tên lớp {sortBy === "className" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("grade")}
                  className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Khối {sortBy === "grade" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("studentCount")}
                  className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Sĩ số {sortBy === "studentCount" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("averageScore")}
                  className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Điểm TB {sortBy === "averageScore" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("completionRate")}
                  className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Hoàn thành {sortBy === "completionRate" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("averageXP")}
                  className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  XP TB {sortBy === "averageXP" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("activeStudents")}
                  className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  HS hoạt động {sortBy === "activeStudents" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedClasses.map((cls) => (
                <tr key={cls.classId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {cls.className}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    Khối {cls.grade}
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                    {cls.studentCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        cls.averageScore >= 80
                          ? "bg-green-100 text-green-800"
                          : cls.averageScore >= 60
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {cls.averageScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-gray-900">
                        {cls.completionRate.toFixed(1)}%
                      </span>
                      <div className="w-full max-w-[80px] h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${Math.min(cls.completionRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-semibold text-amber-600">
                    {cls.averageXP.toFixed(0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className="text-gray-900 font-medium">
                      {cls.activeStudents}
                    </span>
                    <span className="text-gray-500 text-xs">
                      /{cls.studentCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
