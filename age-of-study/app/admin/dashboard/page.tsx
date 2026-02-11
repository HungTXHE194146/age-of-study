'use client';

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import StatsCard from "@/components/admin/StatsCard";
import { Users, GraduationCap, UserCog, Activity } from "lucide-react";

interface UserStats {
  totalUsers: number;
  students: number;
  teachers: number;
  admins: number;
}

interface RecentUser {
  id: string;
  username: string | null;
  full_name: string | null;
  role: string;
  created_at: string;
  total_xp: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    students: 0,
    teachers: 0,
    admins: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const supabase = getSupabaseBrowserClient();

      // Load user statistics
      const { data: allUsers, error: usersError } = await supabase
        .from("profiles")
        .select("role");

      if (usersError) throw usersError;

      const students =
        allUsers?.filter((u: { role: string }) => u.role === "student").length || 0;
      const teachers =
        allUsers?.filter((u: { role: string }) => u.role === "teacher").length || 0;
      const admins =
        allUsers?.filter((u: { role: string }) => u.role === "system_admin").length || 0;

      setStats({
        totalUsers: allUsers?.length || 0,
        students,
        teachers,
        admins,
      });

      // Load recent users
      const { data: recent, error: recentError } = await supabase
        .from("profiles")
        .select("id, username, full_name, role, created_at, total_xp")
        .order("created_at", { ascending: false })
        .limit(5);

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
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tổng quan</h1>
        <p className="text-gray-600">
          Xem tổng quan hoạt động của hệ thống Age of Study
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          title="Đang hoạt động"
          value={stats.students + stats.teachers}
          icon={<Activity className="w-6 h-6 text-orange-600" />}
          bgColor="bg-white border-orange-100"
          iconBgColor="bg-orange-50"
          textColor="text-gray-900"
        />
      </div>

      {/* Recent Users Table */}
      <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Người dùng mới nhất
          </h2>
          <a
            href="/admin/users"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Xem tất cả →
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  XP
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold">
                        {user.full_name?.charAt(0) ||
                          user.username?.charAt(0) ||
                          "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {user.full_name || user.username || "Chưa đặt tên"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.username || `ID: ${user.id.slice(0, 8)}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border-2 ${getRoleBadgeColor(
                        user.role,
                      )}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {user.total_xp.toLocaleString()} XP
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full border-2 bg-green-100 text-green-700 border-green-200">
                      Hoạt động
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
