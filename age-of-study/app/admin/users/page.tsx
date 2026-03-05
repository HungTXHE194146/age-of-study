"use client";

import { useEffect, useState, useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  Search,
  UserPlus,
  Filter,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  ArrowUpDown,
  X,
} from "lucide-react";
import UserAvatar from "@/components/admin/UserAvatar";
import UserDetailModal from "@/components/admin/UserDetailModal";
import UserEditModal from "@/components/admin/UserEditModal";
import AddUserModal from "@/components/admin/AddUserModal";
import Loading from "@/components/ui/loading";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast from "@/components/ui/Toast";

interface User {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  grade: number | null;
  created_at: string;
  total_xp: number;
  current_streak: number;
  weekly_xp: number;
  daily_limit_minutes: number;
  freeze_count: number;
  is_blocked: boolean;
}

interface ClassInfo {
  id: number;
  name: string;
  grade: number;
}

type SortOption =
  | "newest"
  | "oldest"
  | "xp_high"
  | "xp_low"
  | "name_asc"
  | "streak_high";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "blocked"
  >("all");
  const [gradeFilter, setGradeFilter] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([]);
  const [classStudentMap, setClassStudentMap] = useState<
    Record<string, number>
  >({});
  const [classFilter, setClassFilter] = useState<number | "all">("all");

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Block confirmation dialog
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [userToBlock, setUserToBlock] = useState<{
    id: string;
    isBlocked: boolean;
  } | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
    visible: boolean;
  }>({
    message: "",
    type: "info",
    visible: false,
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
  ) => {
    setToast({ message, type, visible: true });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [
    searchTerm,
    roleFilter,
    statusFilter,
    gradeFilter,
    classFilter,
    sortBy,
    users,
    classStudentMap,
    availableClasses,
  ]);

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

      // Load classes
      const { data: classesData } = await supabase
        .from("classes")
        .select("id, name, grade")
        .neq("status", "archived")
        .order("name", { ascending: true });
      setAvailableClasses(classesData || []);

      // Build student → class map (active memberships only)
      const { data: csData } = await supabase
        .from("class_students")
        .select("student_id, class_id")
        .eq("status", "active");
      const map: Record<string, number> = {};
      (csData || []).forEach(
        (row: { student_id: string; class_id: number }) => {
          map[row.student_id] = row.class_id;
        },
      );
      setClassStudentMap(map);
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

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((u) => !u.is_blocked);
    } else if (statusFilter === "blocked") {
      filtered = filtered.filter((u) => u.is_blocked);
    }

    // Grade filter — dùng grade của lớp thực tế (class_students → classes),
    // fallback về profiles.grade nếu học sinh chưa vào lớp nào
    if (gradeFilter !== "all") {
      filtered = filtered.filter((u) => {
        const enrolledClass = availableClasses.find(
          (c) => c.id === classStudentMap[u.id],
        );
        const effectiveGrade = enrolledClass?.grade ?? u.grade;
        return effectiveGrade === gradeFilter;
      });
    }

    // Class filter (only meaningful when a grade is also selected)
    if (classFilter !== "all") {
      filtered = filtered.filter((u) => classStudentMap[u.id] === classFilter);
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

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "xp_high":
          return b.total_xp - a.total_xp;
        case "xp_low":
          return a.total_xp - b.total_xp;
        case "name_asc":
          return (a.full_name || a.username || "").localeCompare(
            b.full_name || b.username || "",
            "vi",
          );
        case "streak_high":
          return b.current_streak - a.current_streak;
        case "newest":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    setFilteredUsers(filtered);
  };

  const handleBlockUser = async (
    userId: string,
    currentBlockStatus: boolean,
  ) => {
    // Show confirmation dialog
    setUserToBlock({ id: userId, isBlocked: currentBlockStatus });
    setShowBlockConfirm(true);
  };

  const confirmBlockUser = async () => {
    if (!userToBlock) return;

    const { id: userId, isBlocked: currentBlockStatus } = userToBlock;

    try {
      // Get session token for authorization
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        showToast(
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          "error",
        );
        return;
      }

      const response = await fetch("/api/admin/users/block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          block: !currentBlockStatus,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Có lỗi xảy ra";
        try {
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            errorMessage = data.error || errorMessage;
          } catch (e) {
            errorMessage = text || errorMessage;
          }
        } catch (e) {
          // fallback ignores error
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const action = currentBlockStatus ? "bỏ chặn" : "chặn";
      showToast(
        result.message || `Đã ${action} người dùng thành công`,
        "success",
      );

      // Reload users
      await loadUsers();
    } catch (error: any) {
      console.error("Error blocking/unblocking user:", error);
      showToast(
        error.message || "Có lỗi xảy ra khi thực hiện thao tác",
        "error",
      );
    } finally {
      setShowBlockConfirm(false);
      setUserToBlock(null);
    }
  };

  const isFiltered =
    roleFilter !== "all" ||
    statusFilter !== "all" ||
    gradeFilter !== "all" ||
    classFilter !== "all" ||
    sortBy !== "newest" ||
    searchTerm !== "";

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
    setGradeFilter("all");
    setClassFilter("all");
    setSortBy("newest");
  };

  // Stats derived from the full user list (not filtered)
  const stats = useMemo(
    () => ({
      total: users.length,
      students: users.filter((u) => u.role === "student").length,
      teachers: users.filter((u) => u.role === "teacher").length,
      blocked: users.filter((u) => u.is_blocked).length,
    }),
    [users],
  );

  // Classes filtered to the currently selected grade (for cascading dropdown)
  const classesForGrade = useMemo(() => {
    if (gradeFilter === "all") return [];
    return availableClasses.filter((c) => c.grade === gradeFilter);
  }, [availableClasses, gradeFilter]);

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
    return (
      <Loading
        message="Đang tải danh sách người dùng..."
        size="lg"
        fullScreen
      />
    );
  }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Quản lý người dùng
        </h1>
        <p className="text-gray-500 text-sm">
          Hiển thị {filteredUsers.length}/{stats.total} người dùng
          {isFiltered && " (đang lọc)"}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border-2 border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium">Tổng cộng</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-green-100 p-4">
          <p className="text-xs text-green-600 font-medium">Học sinh</p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {stats.students}
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-blue-100 p-4">
          <p className="text-xs text-blue-600 font-medium">Giáo viên</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {stats.teachers}
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-red-100 p-4">
          <p className="text-xs text-red-600 font-medium">Bị chặn</p>
          <p className="text-2xl font-bold text-red-700 mt-1">
            {stats.blocked}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border-2 border-gray-100 p-4 mb-6 space-y-3">
        {/* Row 1: Search + Add */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors text-sm"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm người dùng</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        </div>

        {/* Row 2: Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm bg-white cursor-pointer"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="student">Học sinh</option>
            <option value="teacher">Giáo viên</option>
            <option value="system_admin">Quản trị viên</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "blocked")
            }
            className={`px-3 py-2 border-2 rounded-lg focus:outline-none text-sm bg-white cursor-pointer transition-colors ${
              statusFilter !== "all"
                ? "border-orange-300 text-orange-700 focus:border-orange-400"
                : "border-gray-200 focus:border-blue-400"
            }`}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="blocked">Bị chặn</option>
          </select>

          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => {
              setGradeFilter(
                e.target.value === "all" ? "all" : parseInt(e.target.value),
              );
              setClassFilter("all");
            }}
            className={`px-3 py-2 border-2 rounded-lg focus:outline-none text-sm bg-white cursor-pointer transition-colors ${
              gradeFilter !== "all"
                ? "border-teal-300 text-teal-700 focus:border-teal-400"
                : "border-gray-200 focus:border-blue-400"
            }`}
          >
            <option value="all">Tất cả khối</option>
            <option value="1">Khối 1</option>
            <option value="2">Khối 2</option>
            <option value="3">Khối 3</option>
            <option value="4">Khối 4</option>
            <option value="5">Khối 5</option>
          </select>

          {/* Class Filter (cascading — only shown when a grade is selected) */}
          {gradeFilter !== "all" && classesForGrade.length > 0 && (
            <select
              value={classFilter}
              onChange={(e) =>
                setClassFilter(
                  e.target.value === "all" ? "all" : parseInt(e.target.value),
                )
              }
              className={`px-3 py-2 border-2 rounded-lg focus:outline-none text-sm bg-white cursor-pointer transition-colors ${
                classFilter !== "all"
                  ? "border-purple-300 text-purple-700 focus:border-purple-400"
                  : "border-gray-200 focus:border-blue-400"
              }`}
            >
              <option value="all">Tất cả lớp</option>
              {classesForGrade.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Sort */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-2 border-gray-200 rounded-lg bg-white">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="xp_high">XP cao → thấp</option>
              <option value="xp_low">XP thấp → cao</option>
              <option value="name_asc">Tên A → Z</option>
              <option value="streak_high">Streak cao nhất</option>
            </select>
          </div>

          {/* Clear filters */}
          {isFiltered && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 border-2 border-gray-200 hover:border-red-200 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Xóa bộ lọc
            </button>
          )}
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
                  Vai trò / Khối
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
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border-2 w-fit ${getRoleBadgeColor(
                            user.role,
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                        {user.role === "student" &&
                          (() => {
                            const userClass = availableClasses.find(
                              (c) => c.id === classStudentMap[user.id],
                            );
                            return userClass ? (
                              <span className="text-xs text-gray-500">
                                {userClass.name}
                              </span>
                            ) : user.grade != null ? (
                              <span className="text-xs text-gray-500">
                                Khối {user.grade}
                              </span>
                            ) : null;
                          })()}
                      </div>
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showBlockConfirm}
        title={
          userToBlock?.isBlocked ? "Bỏ chặn người dùng" : "Chặn người dùng"
        }
        message={
          userToBlock?.isBlocked
            ? "Người dùng này sẽ có thể đăng nhập và sử dụng hệ thống trở lại. Bạn có chắc chắn muốn bỏ chặn?"
            : "Người dùng này sẽ bị đăng xuất ngay lập tức và không thể đăng nhập lại cho đến khi được bỏ chặn. Bạn có chắc chắn muốn chặn?"
        }
        confirmText={userToBlock?.isBlocked ? "Bỏ chặn" : "Chặn"}
        cancelText="Hủy"
        variant={userToBlock?.isBlocked ? "success" : "danger"}
        onConfirm={confirmBlockUser}
        onCancel={() => {
          setShowBlockConfirm(false);
          setUserToBlock(null);
        }}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      {/* Modals */}
      {showDetailModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          className={
            availableClasses.find(
              (c) => c.id === classStudentMap[selectedUser.id],
            )?.name ?? null
          }
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          classId={classStudentMap[selectedUser.id] ?? null}
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
