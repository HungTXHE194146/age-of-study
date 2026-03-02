"use client";

import { useEffect, useState } from "react";
import {
  getTeacherActivityReport,
  exportTeacherDataToCSV,
  type TeacherActivity,
  type TeacherActivityReport,
} from "@/lib/analyticsService";
import Loading from "@/components/ui/loading";
import UserAvatar from "@/components/admin/UserAvatar";
import {
  Users,
  UserCheck,
  UserX,
  UserCog,
  BookOpen,
  School,
  Calendar,
  Download,
  FileSpreadsheet,
  Mail,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function TeacherActivityPage() {
  const [data, setData] = useState<TeacherActivityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "never">("all");
  const [sortBy, setSortBy] = useState<keyof TeacherActivity>("lastActive");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await getTeacherActivityReport();
    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }
    setLoading(false);
  };

  const handleSort = (key: keyof TeacherActivity) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
  };

  const filteredTeachers = data?.teachers
    ? data.teachers.filter((t) => {
        if (filterStatus === "all") return true;
        return t.activityStatus === filterStatus;
      })
    : [];

  const sortedTeachers = [...filteredTeachers].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const modifier = sortOrder === "asc" ? 1 : -1;

    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;

    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal) * modifier;
    }
    if (Array.isArray(aVal) && Array.isArray(bVal)) {
      return (aVal.length - bVal.length) * modifier;
    }
    return ((aVal as number) - (bVal as number)) * modifier;
  });

  const exportToExcel = () => {
    if (!data?.teachers) return;

    const worksheet = XLSX.utils.json_to_sheet(
      data.teachers.map((t) => ({
        "Họ tên": t.fullName || t.username || "N/A",
        Email: t.email || "N/A",
        "Tổng lớp": t.totalClasses,
        "Lớp chủ nhiệm": t.homeroomClasses,
        "Lớp bộ môn": t.subjectClasses,
        "Tổng học sinh": t.totalStudents,
        "Môn giảng dạy": t.subjects.join("; ") || "Chưa có",
        "Trạng thái":
          t.activityStatus === "active"
            ? "Hoạt động"
            : t.activityStatus === "inactive"
            ? "Không hoạt động"
            : "Chưa đăng nhập",
        "Số ngày không hoạt động": t.daysInactive,
        "Lần cuối hoạt động": t.lastActive
          ? new Date(t.lastActive).toLocaleDateString("vi-VN")
          : "Chưa bao giờ",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hoạt động giáo viên");
    XLSX.writeFile(workbook, `hoat-dong-giao-vien-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportToCSV = () => {
    if (!data?.teachers) return;

    const csv = exportTeacherDataToCSV(data.teachers);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `hoat-dong-giao-vien-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "Hoạt động",
          className: "bg-green-100 text-green-800 border-green-200",
          icon: <UserCheck className="w-3 h-3" />,
        };
      case "inactive":
        return {
          label: "Không hoạt động",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <AlertCircle className="w-3 h-3" />,
        };
      default:
        return {
          label: "Chưa đăng nhập",
          className: "bg-gray-100 text-gray-600 border-gray-200",
          icon: <UserX className="w-3 h-3" />,
        };
    }
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
            Hoạt động giáo viên
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
          Theo dõi hoạt động và mức độ tham gia của giáo viên
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border-2 border-blue-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Tổng giáo viên</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalTeachers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-green-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.activeTeachers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-yellow-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Không hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.inactiveTeachers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
              <UserX className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Chưa đăng nhập</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.neverLoggedIn}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tất cả ({data.summary.totalTeachers})
          </button>
          <button
            onClick={() => setFilterStatus("active")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === "active"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Hoạt động ({data.summary.activeTeachers})
          </button>
          <button
            onClick={() => setFilterStatus("inactive")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === "inactive"
                ? "bg-yellow-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Không hoạt động ({data.summary.inactiveTeachers})
          </button>
          <button
            onClick={() => setFilterStatus("never")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === "never"
                ? "bg-gray-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Chưa đăng nhập ({data.summary.neverLoggedIn})
          </button>
        </div>
      </div>

      {/* Teacher Cards (Mobile-friendly) */}
      <div className="lg:hidden space-y-4">
        {sortedTeachers.map((teacher) => {
          const badge = getStatusBadge(teacher.activityStatus);
          return (
            <div key={teacher.teacherId} className="bg-white rounded-lg border-2 border-gray-200 p-4">
              <div className="flex items-start gap-3 mb-3">
                <UserAvatar
                  name={teacher.fullName || teacher.username || "?"}
                  avatarUrl={null}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {teacher.fullName || teacher.username}
                  </h3>
                  {teacher.email && (
                    <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {teacher.email}
                    </p>
                  )}
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${badge.className}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Lớp chủ nhiệm</p>
                  <p className="text-lg font-bold text-gray-900">{teacher.homeroomClasses}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Lớp bộ môn</p>
                  <p className="text-lg font-bold text-gray-900">{teacher.subjectClasses}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tổng học sinh</p>
                  <p className="text-lg font-bold text-gray-900">{teacher.totalStudents}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Không hoạt động</p>
                  <p className="text-lg font-bold text-gray-900">{teacher.daysInactive} ngày</p>
                </div>
              </div>

              {teacher.subjects.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Môn giảng dạy</p>
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.map((sub, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md font-medium"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Table (Desktop) */}
      <div className="hidden lg:block bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Giáo viên
                </th>
                <th
                  onClick={() => handleSort("activityStatus")}
                  className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Trạng thái {sortBy === "activityStatus" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("totalClasses")}
                  className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Tổng lớp {sortBy === "totalClasses" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("totalStudents")}
                  className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Học sinh {sortBy === "totalStudents" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Môn
                </th>
                <th
                  onClick={() => handleSort("daysInactive")}
                  className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Không hoạt động {sortBy === "daysInactive" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("lastActive")}
                  className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Lần cuối {sortBy === "lastActive" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedTeachers.map((teacher) => {
                const badge = getStatusBadge(teacher.activityStatus);
                return (
                  <tr key={teacher.teacherId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={teacher.fullName || teacher.username || "?"}
                          avatarUrl={null}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {teacher.fullName || teacher.username}
                          </p>
                          {teacher.email && (
                            <p className="text-xs text-gray-500 truncate">{teacher.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${badge.className}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-semibold">
                          CN: {teacher.homeroomClasses}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                          BM: {teacher.subjectClasses}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      {teacher.totalStudents}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects.length > 0 ? (
                          teacher.subjects.map((sub, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md font-medium"
                            >
                              {sub}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">Chưa có</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      {teacher.daysInactive} ngày
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {teacher.lastActive
                        ? new Date(teacher.lastActive).toLocaleString("vi-VN")
                        : "Chưa bao giờ"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sortedTeachers.length === 0 && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-8 text-center">
          <UserX className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Không tìm thấy giáo viên phù hợp</p>
        </div>
      )}
    </div>
  );
}
