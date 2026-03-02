"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import StatsCard from "@/components/admin/StatsCard";
import UserAvatar from "@/components/admin/UserAvatar";
import Loading from "@/components/ui/loading";
import {
  Users, GraduationCap, UserCog, Activity,
  TrendingUp, UserPlus, Clock, BarChart3, FileDown,
} from "lucide-react";

interface UserStats {
  totalUsers: number;
  students: number;
  teachers: number;
  admins: number;
  activeToday: number;
  activeThisWeek: number;
  newThisWeek: number;
}

interface RecentUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  total_xp: number;
  last_active_at: string | null;
}

// --- Helpers ---
function isActiveWithin(lastActive: string | null, hours: number): boolean {
  if (!lastActive) return false;
  const threshold = Date.now() - hours * 60 * 60 * 1000;
  return new Date(lastActive).getTime() > threshold;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Chưa hoạt động";
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

function getStatusBadge(lastActive: string | null) {
  if (isActiveWithin(lastActive, 0.25)) {
    // Active within 15 minutes → "Online"
    return {
      label: "Đang online",
      className: "bg-green-100 text-green-700 border-green-200",
      dot: "bg-green-500",
    };
  }
  if (isActiveWithin(lastActive, 24)) {
    // Active within 24 hours → "Active today"
    return {
      label: "Hôm nay",
      className: "bg-blue-100 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
    };
  }
  if (isActiveWithin(lastActive, 168)) {
    // Active within 7 days → "This week"
    return {
      label: "Tuần này",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
      dot: "bg-yellow-500",
    };
  }
  // Inactive
  return {
    label: "Không hoạt động",
    className: "bg-gray-100 text-gray-500 border-gray-200",
    dot: "bg-gray-400",
  };
}

// --- Daily activity data (last 7 days) ---
interface DailyActivity {
  date: string; // YYYY-MM-DD
  label: string; // "T2", "T3", etc.
  count: number;
}

function getLast7DaysActivity(
  users: Array<{ last_active_at: string | null }>
): DailyActivity[] {
  const days: DailyActivity[] = [];
  const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    // Use local date formatting to match local day boundaries
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    const count = users.filter((u) => {
      if (!u.last_active_at) return false;
      const t = new Date(u.last_active_at).getTime();
      return t >= d.getTime() && t < nextDay.getTime();
    }).length;

    days.push({
      date: dateStr,
      label: dayLabels[d.getDay()],
      count,
    });
  }  return days;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AdminDashboard() {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    students: 0,
    teachers: 0,
    admins: 0,
    activeToday: 0,
    activeThisWeek: 0,
    newThisWeek: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const supabase = getSupabaseBrowserClient();

      // Load all user profiles with last_active_at
      const { data: allUsers, error: usersError } = await supabase
        .from("profiles")
        .select("id, role, last_active_at, created_at");

      if (usersError) throw usersError;

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      type ProfileRow = { id: string; role: string; last_active_at: string | null; created_at: string };
      const users: ProfileRow[] = allUsers || [];

      const students = users.filter((u) => u.role === "student");
      const teachers = users.filter((u) => u.role === "teacher");
      const admins = users.filter((u) => u.role === "system_admin");

      const activeToday = users.filter(
        (u) => u.last_active_at && new Date(u.last_active_at) > oneDayAgo
      ).length;

      const activeThisWeek = users.filter(
        (u) => u.last_active_at && new Date(u.last_active_at) > oneWeekAgo
      ).length;

      const newThisWeek = users.filter(
        (u) => new Date(u.created_at) > oneWeekAgo
      ).length;

      setStats({
        totalUsers: users.length,
        students: students.length,
        teachers: teachers.length,
        admins: admins.length,
        activeToday,
        activeThisWeek,
        newThisWeek,
      });

      // Compute 7-day activity chart
      setDailyActivity(getLast7DaysActivity(users));

      // Load recent users (last 8) with last_active_at
      const { data: recent, error: recentError } = await supabase
        .from("profiles")
        .select(
          "id, username, full_name, avatar_url, role, created_at, total_xp, last_active_at"
        )
        .order("created_at", { ascending: false })
        .limit(8);

      if (recentError) throw recentError;
      setRecentUsers(recent || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "system_admin":
        return "bg-red-100 text-red-700 border-red-200";
      case "teacher":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "student":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "system_admin":
        return "Quản trị";
      case "teacher":
        return "Giáo viên";
      case "student":
        return "Học sinh";
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <Loading message="Đang tải bảng điều khiển..." size="lg" fullScreen />
    );
  }

  const maxDailyCount = Math.max(...dailyActivity.map((d) => d.count), 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Tổng quan
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Xem tổng quan hoạt động của hệ thống Age of Study
        </p>
      </div>

      {/* Row 1: Core stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <StatsCard
          title="Tổng người dùng"
          value={stats.totalUsers}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          bgColor="bg-white border-blue-100"
          iconBgColor="bg-blue-50"
          textColor="text-gray-900"
        />
        <StatsCard
          title="Học sinh"
          value={stats.students}
          icon={<GraduationCap className="w-6 h-6 text-green-600" />}
          bgColor="bg-white border-green-100"
          iconBgColor="bg-green-50"
          textColor="text-gray-900"
        />
        <StatsCard
          title="Giáo viên"
          value={stats.teachers}
          icon={<UserCog className="w-6 h-6 text-teal-600" />}
          bgColor="bg-white border-teal-100"
          iconBgColor="bg-teal-50"
          textColor="text-gray-900"
        />
        <StatsCard
          title="Hoạt động hôm nay"
          value={stats.activeToday}
          icon={<Activity className="w-6 h-6 text-orange-600" />}
          bgColor="bg-white border-orange-100"
          iconBgColor="bg-orange-50"
          textColor="text-gray-900"
        />
      </div>

      {/* Quick Access to New Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <a
          href="/admin/analytics"
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5 hover:shadow-lg transition-all transform hover:-translate-y-1"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">So sánh lớp học</h3>
              <p className="text-xs text-blue-600">Phân tích hiệu suất</p>
            </div>
          </div>
          <p className="text-sm text-blue-700">
            Xem điểm TB, tỷ lệ hoàn thành và so sánh giữa các lớp →
          </p>
        </a>

        <a
          href="/admin/teachers"
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-5 hover:shadow-lg transition-all transform hover:-translate-y-1"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <UserCog className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900">Hoạt động GV</h3>
              <p className="text-xs text-purple-600">Theo dõi giáo viên</p>
            </div>
          </div>
          <p className="text-sm text-purple-700">
            Xem giáo viên nào tích cực / chưa sử dụng hệ thống →
          </p>
        </a>

        <a
          href="/admin/reports"
          className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-5 hover:shadow-lg transition-all transform hover:-translate-y-1"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <FileDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900">Xuất báo cáo</h3>
              <p className="text-xs text-green-600">PDF & Excel</p>
            </div>
          </div>
          <p className="text-sm text-green-700">
            Tạo báo cáo tổng hợp cho Phòng Giáo dục →
          </p>
        </a>
      </div>

      {/* Row 2: Secondary stats + Activity chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Left: Quick insights */}
        <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="bg-white rounded-xl border-2 border-purple-100 p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-600 font-medium">
                Hoạt động tuần này
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.activeThisWeek}
              <span className="text-sm font-normal text-gray-400 ml-1">
                / {stats.totalUsers}
              </span>
            </p>
          </div>
          <div className="bg-white rounded-xl border-2 border-sky-100 p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-sky-50 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-sky-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-600 font-medium">
                Mới tuần này
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.newThisWeek}
            </p>
          </div>
        </div>

        {/* Right: 7-day activity bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border-2 border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              Hoạt động 7 ngày gần nhất
            </h3>
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {dailyActivity.map((day) => {
              const heightPct = maxDailyCount > 0 ? (day.count / maxDailyCount) * 100 : 0;
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-xs font-semibold text-gray-700">
                    {day.count}
                  </span>
                  <div
                    className="w-full bg-blue-500 rounded-t-md transition-all duration-500 min-h-[4px]"
                    style={{ height: `${Math.max(heightPct, 3)}%` }}
                    title={`${day.date}: ${day.count} người`}
                  />
                  <span className="text-xs text-gray-500">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Người dùng mới nhất
          </h2>
          <a
            href="/admin/users"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-block"
          >
            Xem tất cả →
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  XP
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentUsers.map((user) => {
                const status = getStatusBadge(user.last_active_at);
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          avatarUrl={user.avatar_url}
                          name={user.full_name}
                          username={user.username}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {user.full_name || user.username || "Chưa đặt tên"}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {user.username || `ID: ${user.id.slice(0, 8)}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border-2 ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {(user.total_xp ?? 0).toLocaleString()} XP                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border-2 w-fit ${status.className}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                          />
                          {status.label}
                        </span>
                        <span className="text-xs text-gray-400 mt-0.5 pl-1">
                          {formatRelativeTime(user.last_active_at)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
