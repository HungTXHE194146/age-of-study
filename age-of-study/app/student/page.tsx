"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import {
  joinClassByCode,
  getStudentClass,
  getClassSubjects,
} from "@/lib/classService";
import type { StudentWithClass } from "@/types/class";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CheckCircle,
  AlertCircle,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import Loading, { LoadingSpinner } from "@/components/ui/loading";

interface ClassSubject {
  id: number;
  name: string;
  teachers: { id: string; full_name: string | null }[];
}

export default function LearnPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  // Class state
  const [currentClass, setCurrentClass] = useState<StudentWithClass | null>(
    null,
  );
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [joiningClass, setJoiningClass] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // No need to call checkAuth here - DashboardLayout already handles it

  useEffect(() => {
    // Only redirect after auth has finished loading to avoid race condition
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Load class info when user is available
  useEffect(() => {
    if (user) {
      loadClassInfo();
    }
  }, [user]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const loadClassInfo = async () => {
    if (!user) return;

    try {
      const result = await getStudentClass(user.id);
      if (result.error) {
        console.error("Error loading class:", result.error);
      } else {
        setCurrentClass(result.data);
        // Load subjects if student has a class
        if (result.data?.class?.id) {
          loadClassSubjects(result.data.class.id);
        }
      }
    } catch (error) {
      console.error("Failed to load class:", error);
    }
  };

  const loadClassSubjects = async (classId: number) => {
    setLoadingSubjects(true);
    try {
      const result = await getClassSubjects(classId);
      if (result.error) {
        console.error("Error loading subjects:", result.error);
      } else {
        setClassSubjects(result.data || []);
      }
    } catch (error) {
      console.error("Failed to load subjects:", error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleJoinClass = async () => {
    if (!user || !classCode.trim()) {
      setClassError("Vui lòng nhập mã lớp");
      return;
    }

    setJoiningClass(true);
    setClassError(null);

    try {
      const result = await joinClassByCode({
        class_code: classCode.trim().toUpperCase(),
        student_id: user.id,
      });

      if (result.error) {
        setClassError(result.error);
      } else {
        // Success!
        await loadClassInfo();
        setClassCode("");
        setShowSuccess(true);

        // Clear any existing timeout
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        // Set new timeout and store reference
        successTimeoutRef.current = setTimeout(
          () => setShowSuccess(false),
          3000,
        );

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (error) {
      console.error("Join class error:", error);
      setClassError("Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setJoiningClass(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading message="Đang tải trang học tập..." size="md" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Chào mừng, {user.full_name || user.username}! 🎉
        </h1>
        <p className="text-lg text-gray-600">
          Sẵn sàng chinh phục kiến thức mới hôm nay chưa?
        </p>
      </div>

      {/* Join Class Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-md"
      >
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Lớp Học Của Bạn 🎓
          </h2>
        </div>

        {currentClass?.class ? (
          // Already in a class - clickable card with beautiful design
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => {
              if (currentClass?.class?.class_code) {
                router.push(`/learn/class/${currentClass.class.class_code}`);
              }
            }}
            className={`relative bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-2xl p-8 hover:shadow-2xl transition-all group overflow-hidden ${
              currentClass?.class?.class_code
                ? "cursor-pointer"
                : "cursor-not-allowed opacity-75"
            }`}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

            {/* Content */}
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-3xl font-black text-white tracking-tight">
                      {currentClass.class.name}
                    </h3>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                      Khối {currentClass.class.grade}
                    </span>
                  </div>

                  <div className="space-y-2 text-white/90">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                        📋 {currentClass.class.class_code}
                      </span>
                    </div>

                    {currentClass.class.homeroom_teacher_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="opacity-80">👨‍🏫 GVCN:</span>
                        <span className="font-semibold">
                          {currentClass.class.homeroom_teacher_name}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <span className="opacity-80">📚 Năm học:</span>
                      <span className="font-semibold">
                        {currentClass.class.school_year}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl group-hover:bg-white/30 transition-colors">
                <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        ) : (
          // Not in a class yet
          <div>
            <p className="text-gray-700 mb-4">
              💡 Nhập mã lớp do giáo viên cung cấp để tham gia lớp học!
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => {
                    setClassCode(e.target.value.toUpperCase());
                    setClassError(null);
                  }}
                  placeholder="Nhập mã lớp (8 ký tự)"
                  maxLength={8}
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl text-lg font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={joiningClass}
                />
              </div>

              <motion.button
                onClick={handleJoinClass}
                disabled={joiningClass || !classCode.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-bold rounded-xl shadow-md hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <span className="flex items-center justify-center gap-2">
                  {joiningClass ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5" />
                      Tham Gia
                    </>
                  )}
                </span>
              </motion.button>
            </div>

            {classError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200 flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{classError}</span>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-4 rounded-full shadow-2xl font-bold z-50"
          >
            🎉 Đã tham gia lớp thành công!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subject Cards - Real Data */}
      {currentClass?.class && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Môn học 📚</h2>
          {loadingSubjects ? (
            <div className="text-center py-12">
              <LoadingSpinner size="md" />
              <p className="text-gray-600 mt-3">Đang tải môn học...</p>
            </div>
          ) : classSubjects.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                Chưa có môn học nào được phân công
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {classSubjects.map((subject, index) => {
                // Color themes for subjects
                const colors = [
                  {
                    bg: "bg-red-100",
                    text: "text-red-600",
                    hover: "hover:bg-red-600",
                    border: "border-red-200",
                  },
                  {
                    bg: "bg-blue-100",
                    text: "text-blue-600",
                    hover: "hover:bg-blue-600",
                    border: "border-blue-200",
                  },
                  {
                    bg: "bg-green-100",
                    text: "text-green-600",
                    hover: "hover:bg-green-600",
                    border: "border-green-200",
                  },
                  {
                    bg: "bg-purple-100",
                    text: "text-purple-600",
                    hover: "hover:bg-purple-600",
                    border: "border-purple-200",
                  },
                  {
                    bg: "bg-orange-100",
                    text: "text-orange-600",
                    hover: "hover:bg-orange-600",
                    border: "border-orange-200",
                  },
                  {
                    bg: "bg-teal-100",
                    text: "text-teal-600",
                    hover: "hover:bg-teal-600",
                    border: "border-teal-200",
                  },
                ];
                const color = colors[index % colors.length];

                return (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all border-2 ${color.border} cursor-pointer group`}
                    onClick={() => router.push(`/learn/subject/${subject.id}`)}
                  >
                    <div className="text-center">
                      <div
                        className={`w-16 h-16 ${color.bg} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                      >
                        <BookOpen className={`w-8 h-8 ${color.text}`} />
                      </div>
                      <h3 className={`text-xl font-bold ${color.text} mb-2`}>
                        {subject.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {subject.teachers
                          .map((t) => t.full_name)
                          .filter(Boolean)
                          .join(", ") || "Chưa có giáo viên"}
                      </p>
                      <button
                        className={`px-6 py-2 ${color.bg} ${color.text} rounded-full font-semibold ${color.hover} hover:text-white transition-colors`}
                      >
                        Bắt đầu
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stats Section */}
      <div className="mt-12 bg-white rounded-2xl p-8 shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          Thống kê của bạn
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-gray-900">
              {user.total_xp ?? 0}
            </div>
            <div className="text-sm text-gray-600">Tổng XP</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-gray-900">
              {user.current_streak ?? 0}
            </div>
            <div className="text-sm text-gray-600">Chuỗi ngày</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📈</div>
            <div className="text-2xl font-bold text-gray-900">
              {user.weekly_xp ?? 0}
            </div>
            <div className="text-sm text-gray-600">XP tuần này</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">❄️</div>
            <div className="text-2xl font-bold text-gray-900">
              {user.freeze_count ?? 0}
            </div>
            <div className="text-sm text-gray-600">Lượt đóng băng</div>
          </div>
        </div>
      </div>
    </div>
  );
}
