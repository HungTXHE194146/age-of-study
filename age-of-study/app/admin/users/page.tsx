"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  Search,
  UserPlus,
  Filter,
  Eye,
  Edit,
  Ban,
  CheckCircle,
} from "lucide-react";
import UserAvatar from "@/components/admin/UserAvatar";
import UserDetailModal from "@/components/admin/UserDetailModal";
import UserEditModal from "@/components/admin/UserEditModal";
import AddUserModal from "@/components/admin/AddUserModal";
import Loading from "@/components/ui/loading";

interface User {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  total_xp: number;
  current_streak: number;
  weekly_xp: number;
  daily_limit_minutes: number;
  freeze_count: number;
  is_blocked?: boolean;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  const loadUsers = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.username?.toLowerCase().includes(term) ||
          u.full_name?.toLowerCase().includes(term),
      );
    }

    setFilteredUsers(filtered);
  };

  const handleBlockUser = async (
    userId: string,
    currentBlockStatus: boolean,
  ) => {
    try {
      const supabase = getSupabaseBrowserClient();

      // Toggle block status
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: !currentBlockStatus })
        .eq("id", userId);

      if (error) throw error;

      // Reload users
      await loadUsers();
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
      alert("Có lỗi xảy ra khi thực hiện thao tác");
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
    }).format(date);
  };

  if (loading) {
    return <Loading message="Đang tải danh sách người dùng..." size="lg" fullScreen />;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quản lý người dùng
        </h1>
        <p className="text-gray-600">
          Quản lý tất cả người dùng trong hệ thống ({filteredUsers.length} người
          dùng)
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border-2 border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Role Filter */}
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors appearance-none bg-white cursor-pointer"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="student">Học sinh</option>
              <option value="teacher">Giáo viên</option>
              <option value="system_admin">Quản trị viên</option>
            </select>
          </div>

          {/* Add User Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center gap-2 whitespace-nowrap"
          >
            <UserPlus className="w-5 h-5" />
            Thêm người dùng
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  XP / Streak
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ngày tham gia
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          avatarUrl={user.avatar_url}
                          name={user.full_name}
                          username={user.username}
                          size="md"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user.full_name || "Chưa đặt tên"}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{user.username || `user_${user.id.slice(0, 8)}`}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">
                          {user.total_xp.toLocaleString()} XP
                        </p>
                        <p className="text-gray-500">
                          🔥 {user.current_streak} ngày
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_blocked ? (
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full border-2 bg-red-100 text-red-700 border-red-200">
                          Đã chặn
                        </span>
                      ) : (
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full border-2 bg-green-100 text-green-700 border-green-200">
                          Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailModal(true);
                          }}
                          className="p-2 text-sm bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors border-2 border-teal-200"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border-2 border-blue-200"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleBlockUser(user.id, user.is_blocked || false)
                          }
                          className={`p-2 text-sm rounded-lg transition-colors border-2 ${
                            user.is_blocked
                              ? "bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                              : "bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200"
                          }`}
                          title={user.is_blocked ? "Bỏ chặn" : "Chặn"}
                        >
                          {user.is_blocked ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showDetailModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            loadUsers();
          }}
        />
      )}

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadUsers();
          }}
        />
      )}
    </div>
  );
}
