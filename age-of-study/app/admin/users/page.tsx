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
  FileSpreadsheet,
  KeyRound,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import UserAvatar from "@/components/admin/UserAvatar";
import UserDetailModal from "@/components/admin/UserDetailModal";
import UserEditModal from "@/components/admin/UserEditModal";
import AddUserModal from "@/components/admin/AddUserModal";
import TeacherImportModal from "@/components/admin/TeacherImportModal";
import StudentImportModal from "@/components/admin/StudentImportModal";
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
  const PAGE_SIZE = 20;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [gradeFilter, setGradeFilter] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([]);
  const [classStudentMap, setClassStudentMap] = useState<Record<string, number>>({});
  const [classFilter, setClassFilter] = useState<number | "all">("all");
  const [stats, setStats] = useState({ total: 0, students: 0, teachers: 0, blocked: 0 });

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showStudentImportModal, setShowStudentImportModal] = useState(false);

  // Block confirmation dialog
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [userToBlock, setUserToBlock] = useState<{
    id: string;
    isBlocked: boolean;
  } | null>(null);

  // Teacher magic code modal
  const [teacherMagicCodeModal, setTeacherMagicCodeModal] = useState<{
    visible: boolean;
    code: string | null;
    teacherName: string;
    loading: boolean;
  }>({ visible: false, code: null, teacherName: "", loading: false });

  // Email migration banner
  const [migration, setMigration] = useState<{
    needsMigration: number | null;
    checking: boolean;
    running: boolean;
    done: boolean;
  }>({ needsMigration: null, checking: false, running: false, done: false });

  const checkMigration = async () => {
    setMigration((prev) => ({ ...prev, checking: true }));
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/admin/migrate-student-emails", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setMigration((prev) => ({ ...prev, needsMigration: data.needsMigration ?? 0, checking: false }));
    } catch {
      setMigration((prev) => ({ ...prev, checking: false }));
    }
  };

  const runMigration = async () => {
    setMigration((prev) => ({ ...prev, running: true }));
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/admin/migrate-student-emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      showToast(`Đã migrate ${data.success ?? 0} tài khoản thành công.${data.errors ? ` Lỗi: ${data.errors}` : ""}`, data.errors ? "warning" : "success");
      setMigration({ needsMigration: 0, checking: false, running: false, done: true });    } catch {
      showToast("Lỗi khi thực hiện migration.", "error");
      setMigration((prev) => ({ ...prev, running: false }));
    }
  };

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

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Load classes and stats once on mount
  useEffect(() => {
    loadClasses();
    loadStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload users whenever page or any filter/sort changes
  useEffect(() => {
    loadUsers();
  }, [page, debouncedSearch, roleFilter, statusFilter, gradeFilter, classFilter, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadClasses = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("classes")
        .select("id, name, grade")
        .neq("status", "archived")
        .order("name", { ascending: true });
      setAvailableClasses(data || []);
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  };

  const loadStats = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const [totalRes, studentsRes, teachersRes, blockedRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_blocked", true),
      ]);
      setStats({
        total: totalRes.count || 0,
        students: studentsRes.count || 0,
        teachers: teachersRes.count || 0,
        blocked: blockedRes.count || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      // For class filter: pre-fetch matching student IDs
      let classFilterIds: string[] | null = null;
      if (classFilter !== "all") {
        const { data: cs } = await supabase
          .from("class_students")
          .select("student_id")
          .eq("class_id", classFilter)
          .eq("status", "active");
        classFilterIds = (cs || []).map((r: { student_id: string }) => r.student_id);
        if (classFilterIds && classFilterIds.length === 0) {
          setUsers([]);
          setTotalCount(0);
          setClassStudentMap({});
          setLoading(false);
          return;
        }
      }
      let query = supabase.from("profiles").select("*", { count: "exact" });

      if (roleFilter !== "all") query = query.eq("role", roleFilter);
      if (statusFilter === "active") query = query.eq("is_blocked", false);
      if (statusFilter === "blocked") query = query.eq("is_blocked", true);
      if (gradeFilter !== "all") query = query.eq("grade", gradeFilter);
      if (classFilterIds) query = query.in("id", classFilterIds);

      if (debouncedSearch.trim()) {
        // Escape SQL LIKE special characters to prevent wildcard injection
        const escapedTerm = debouncedSearch.trim()
          .replace(/\\/g, "\\\\")
          .replace(/%/g, "\\%")
          .replace(/_/g, "\\_");
        query = query.or(`username.ilike.%${escapedTerm}%,full_name.ilike.%${escapedTerm}%`);
      }

      switch (sortBy) {
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "xp_high":
          query = query.order("total_xp", { ascending: false });
          break;
        case "xp_low":
          query = query.order("total_xp", { ascending: true });
          break;
        case "name_asc":
          query = query.order("full_name", { ascending: true, nullsFirst: false });
          break;
        case "streak_high":
          query = query.order("current_streak", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }

      const from = (page - 1) * PAGE_SIZE;
      query = query.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await query;
      if (error) throw error;

      setUsers(data || []);
      setTotalCount(count || 0);

      // Build classStudentMap for current page users only
      if (data?.length) {
        const ids = data.map((u: User) => u.id);
        const { data: cs } = await supabase
          .from("class_students")
          .select("student_id, class_id")
          .in("student_id", ids)
          .eq("status", "active");
        const map: Record<string, number> = {};
        (cs || []).forEach((r: { student_id: string; class_id: number }) => {
          map[r.student_id] = r.class_id;
        });
        setClassStudentMap(map);
      } else {
        setClassStudentMap({});
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (
    userId: string,
    currentBlockStatus: boolean,
  ) => {
    // Show confirmation dialog
    setUserToBlock({ id: userId, isBlocked: currentBlockStatus });
    setShowBlockConfirm(true);
  };

  const handleGenerateTeacherCode = async (teacherId: string, teacherName: string) => {
    setTeacherMagicCodeModal({ visible: true, code: null, teacherName, loading: true });
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast("Phiên đăng nhập đã hết hạn.", "error");
        setTeacherMagicCodeModal((prev) => ({ ...prev, visible: false }));
        return;
      }
      const res = await fetch("/api/auth/magic-login/generate-teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ teacher_id: teacherId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Không thể tạo mã.", "error");
        setTeacherMagicCodeModal((prev) => ({ ...prev, visible: false }));
        return;
      }
      setTeacherMagicCodeModal({ visible: true, code: data.code, teacherName, loading: false });
    } catch {
      showToast("Lỗi kết nối.", "error");
      setTeacherMagicCodeModal((prev) => ({ ...prev, visible: false }));
    }
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
        const data = await response.json();
        throw new Error(data.error || "Có lỗi xảy ra");
      }

      const result = await response.json();
      const action = currentBlockStatus ? "bỏ chặn" : "chặn";
      showToast(
        result.message || `Đã ${action} người dùng thành công`,
        "success",
      );

      // Reload users and stats (blocked count may have changed)
      await Promise.all([loadUsers(), loadStats()]);
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

  if (loading && users.length === 0) {
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
          {isFiltered
            ? `${totalCount} kết quả (đang lọc) · trang ${page}`
            : `${stats.total} người dùng · trang ${page}`}
        </p>
      </div>

      {/* Email Migration Banner
      {!migration.done && (
        <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              Cần migrate email học sinh cũ
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Các tài khoản được import trước đây dùng domain{" "}
              <code className="font-mono bg-amber-100 px-1 rounded">@student.ageofstudy.com</code>{" "}
              — cần đổi sang{" "}
              <code className="font-mono bg-amber-100 px-1 rounded">@ageofstudy.local</code>{" "}
              để học sinh đăng nhập được.
              {migration.needsMigration !== null && (
                <span className="ml-1 font-bold">
                  ({migration.needsMigration} tài khoản cần xử lý)
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {migration.needsMigration === null && (
              <button
                onClick={checkMigration}
                disabled={migration.checking}
                className="px-3 py-2 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg border border-amber-300 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${migration.checking ? "animate-spin" : ""}`} />
                Kiểm tra
              </button>
            )}
            {migration.needsMigration !== null && migration.needsMigration > 0 && (
              <button
                onClick={runMigration}
                disabled={migration.running}
                className="px-3 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${migration.running ? "animate-spin" : ""}`} />
                {migration.running ? "Đang xử lý..." : "Chạy migration"}
              </button>
            )}
            {migration.needsMigration === 0 && (
              <span className="px-3 py-2 text-xs font-semibold text-green-700 bg-green-100 rounded-lg border border-green-300">
                ✓ Không cần migrate
              </span>
            )}
            <button
              onClick={() => setMigration((prev) => ({ ...prev, done: true }))}
              className="px-2 py-2 text-amber-500 hover:text-amber-700"
              title="Ẩn thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )} */}

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
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Nhập giáo viên từ Excel</span>
            <span className="sm:hidden">Nhập GV</span>
          </button>
          <button
            onClick={() => setShowStudentImportModal(true)}
            className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Nhập học sinh từ Excel</span>
            <span className="sm:hidden">Nhập HS</span>
          </button>
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
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
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
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | "active" | "blocked");
              setPage(1);
            }}
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
              setPage(1);
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
              onChange={(e) => {
                setClassFilter(
                  e.target.value === "all" ? "all" : parseInt(e.target.value),
                );
                setPage(1);
              }}
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
              onChange={(e) => { setSortBy(e.target.value as SortOption); setPage(1); }}
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
      <div className={`bg-white rounded-xl border-2 border-gray-100 overflow-hidden transition-opacity ${loading ? "opacity-60 pointer-events-none" : ""}`}>
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
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                users.map((user) => (
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
                        {user.role === "teacher" && (
                          <button
                            onClick={() =>
                              handleGenerateTeacherCode(
                                user.id,
                                user.full_name || user.username || "Giáo viên",
                              )
                            }
                            className="p-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors border-2 border-purple-200"
                            title="Tạo mã đặt lại mật khẩu"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 px-2">
          <p className="text-sm text-gray-600">
            Trang <span className="font-semibold">{page}</span> /{" "}
            <span className="font-semibold">{Math.ceil(totalCount / PAGE_SIZE)}</span>
            {" "}· {totalCount} kết quả
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            {Array.from({ length: Math.ceil(totalCount / PAGE_SIZE) }, (_, i) => i + 1)
              .filter((p) => {
                const total = Math.ceil(totalCount / PAGE_SIZE);
                return p === 1 || p === total || Math.abs(p - page) <= 2;
              })
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    disabled={loading}
                    className={`min-w-[36px] h-9 rounded-lg border-2 text-sm font-medium transition-colors ${
                      page === item
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
            <button
              onClick={() => setPage((p) => Math.min(Math.ceil(totalCount / PAGE_SIZE), p + 1))}
              disabled={page === Math.ceil(totalCount / PAGE_SIZE) || loading}
              className="p-2 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}

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
            loadStats();
          }}
        />
      )}

      {showImportModal && (
        <TeacherImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            loadUsers();
            loadStats();
          }}
          showToast={showToast}
        />
      )}

      {showStudentImportModal && (
        <StudentImportModal
          onClose={() => setShowStudentImportModal(false)}
          onSuccess={() => {
            loadUsers();
            loadStats();
          }}
          classes={availableClasses}
        />
      )}

      {/* Teacher Magic Code Modal */}
      {teacherMagicCodeModal.visible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Mã đặt lại mật khẩu</h3>
              <button
                onClick={() => setTeacherMagicCodeModal((prev) => ({ ...prev, visible: false }))}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {teacherMagicCodeModal.loading ? (
              <div className="text-center py-8 text-gray-500">Đang tạo mã...</div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Mã đặt lại mật khẩu cho giáo viên{" "}
                  <span className="font-semibold text-gray-800">{teacherMagicCodeModal.teacherName}</span>:
                </p>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center mb-4">
                  <p className="text-4xl font-mono font-bold tracking-[0.4em] text-purple-700">
                    {teacherMagicCodeModal.code}
                  </p>
                </div>
                <p className="text-xs text-gray-500 text-center mb-4">
                  Mã có hiệu lực trong <strong>5 phút</strong>. Giáo viên vào{" "}
                  <strong>/staff/magic-login</strong> để đặt lại mật khẩu.
                </p>
                <button
                  onClick={() =>
                    setTeacherMagicCodeModal((prev) => ({ ...prev, visible: false }))
                  }
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Đóng
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
