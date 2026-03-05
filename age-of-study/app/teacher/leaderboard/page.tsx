"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getTeacherLeaderboardData } from "@/lib/leaderboardService";
import UserAvatar from "@/components/admin/UserAvatar";
import Loading, { LoadingInline } from "@/components/ui/loading";
import { Search, Filter, Download, TrendingUp } from "lucide-react";

interface StudentData {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  weekly_xp: number;
  current_streak: number;
  grade: number | null;
}

export default function TeacherLeaderboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState<number | "all">("all");

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "teacher")) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === "teacher") {
      loadData();
    }
  }, [isLoading, isAuthenticated, user]);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, gradeFilter, students]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getTeacherLeaderboardData();
      setStudents(data);
      setFilteredStudents(data);
    } catch (error) {
      console.error("Error loading teacher leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Grade filter
    if (gradeFilter !== "all") {
      filtered = filtered.filter((s) => s.grade === gradeFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(term) ||
          s.username?.toLowerCase().includes(term),
      );
    }

    setFilteredStudents(filtered);
  };

  const exportToCSV = () => {
    const escapeCSV = (value: string | number | null): string => {
      if (value === null) return "N/A";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      "Rank",
      "Name",
      "Username",
      "Grade",
      "Total XP",
      "Weekly XP",
      "Streak",
    ];
    const rows = filteredStudents.map((student, index) => [
      escapeCSV(index + 1),
      escapeCSV(student.full_name),
      escapeCSV(student.username),
      escapeCSV(student.grade),
      escapeCSV(student.total_xp),
      escapeCSV(student.weekly_xp),
      escapeCSV(student.current_streak),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leaderboard_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading || !isAuthenticated) {
    return <Loading message="Đang tải bảng xếp hạng..." size="lg" fullScreen />;
  }

  const avgXP =
    filteredStudents.length > 0
      ? Math.round(
          filteredStudents.reduce((acc, s) => acc + s.total_xp, 0) /
            filteredStudents.length,
        )
      : 0;

  const topStudent = filteredStudents[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          📊 Bảng Xếp Hạng Học Sinh
        </h1>
        <p className="text-gray-600">
          Theo dõi và phân tích hiệu suất của học sinh
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border-2 border-blue-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng Học Sinh</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredStudents.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-green-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Điểm TB</p>
              <p className="text-2xl font-bold text-gray-900">
                {avgXP.toLocaleString()} XP
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-yellow-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Học Sinh Xuất Sắc</p>
              <p className="text-lg font-bold text-gray-900">
                {topStudent?.full_name || topStudent?.username || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border-2 border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Grade Filter */}
          <div className="relative sm:min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={gradeFilter}
              onChange={(e) =>
                setGradeFilter(
                  e.target.value === "all" ? "all" : Number(e.target.value),
                )
              }
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors appearance-none bg-white cursor-pointer"
            >
              <option value="all">Tất cả lớp</option>
              <option value="1">Lớp 1</option>
              <option value="2">Lớp 2</option>
              <option value="3">Lớp 3</option>
              <option value="4">Lớp 4</option>
              <option value="5">Lớp 5</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="w-5 h-5" />
            Xuất CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Hạng
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Học Sinh
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Lớp
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tổng XP
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  XP Tuần
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Chuỗi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4">
                    <LoadingInline message="Đang tải dữ liệu học sinh..." />
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Không tìm thấy học sinh nào
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-lg text-gray-700">
                        {index === 0
                          ? "🥇"
                          : index === 1
                            ? "🥈"
                            : index === 2
                              ? "🥉"
                              : index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          avatarUrl={student.avatar_url}
                          name={student.full_name}
                          username={student.username}
                          size="md"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {student.full_name || "Chưa đặt tên"}
                          </p>
                          <p className="text-sm text-gray-500">
                            @
                            {student.username ||
                              `user_${student.id.slice(0, 8)}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Lớp {student.grade || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold text-gray-900">
                        {student.total_xp.toLocaleString()} XP
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold text-green-600">
                        +{student.weekly_xp.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span>🔥</span>
                        <span className="font-semibold text-orange-600">
                          {student.current_streak} ngày
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
