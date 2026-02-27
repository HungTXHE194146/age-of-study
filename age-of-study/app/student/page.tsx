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
  Star,
  Zap,
  Shield,
  Target,
  Play,
  Medal,
  Clock,
  Lock,
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

  // Gamification logic
  const xp = user?.total_xp ?? 0;
  const streak = user?.current_streak ?? 0;
  const freezeCount = user?.freeze_count ?? 0;

  const remainder = xp % 1000;
  const xpToNextLevel = remainder === 0 && xp > 0 ? 0 : 1000 - remainder;
  const progressPercent = remainder === 0 && xp > 0 ? 100 : (remainder / 1000) * 100;
  const getRank = () => {
    if (streak >= 30)
      return {
        name: "Vàng",
        color: "text-yellow-500",
        bg: "bg-yellow-100",
        border: "border-yellow-200",
      };
    if (streak >= 7)
      return {
        name: "Bạc",
        color: "text-gray-400",
        bg: "bg-gray-100",
        border: "border-gray-200",
      };
    return {
      name: "Đồng",
      color: "text-amber-700",
      bg: "bg-amber-100",
      border: "border-amber-200",
    };
  };
  const rank = getRank();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 1. Greeting & Gamification Stats */}
      <div className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Greeting Card */}
        <div className="lg:col-span-1 flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            {getGreeting()},{" "}
            <span className="text-purple-600">
              {user.full_name || user.username}
            </span>
            ! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Hãy khám phá những bài học thú vị đang chờ đón bạn hôm nay nhé.
          </p>
        </div>

        {/* Stats Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="grid grid-cols-3 gap-4">
            {/* XP & Progress */}
            <div className="col-span-3 sm:col-span-1 p-4 bg-purple-50 rounded-2xl flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Star className="w-5 h-5 text-purple-600 fill-current" />
                </div>
                <span className="font-bold text-gray-800">{xp} XP</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2.5 mb-1">
                <div
                  className="bg-purple-600 h-2.5 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-purple-600 font-medium">
                Còn {xpToNextLevel} XP nữa để thăng cấp!
              </p>
            </div>

            {/* Streak & Rank */}
            <div
              className={`p-4 flex flex-col justify-center ${rank.bg} ${rank.border} border rounded-2xl`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className={`w-5 h-5 ${rank.color} fill-current`} />
                <span className={`font-bold text-gray-800`}>{streak} ngày</span>
              </div>
              <div className="flex items-center gap-1">
                <Medal className={`w-4 h-4 ${rank.color}`} />
                <span className={`text-sm font-semibold ${rank.color}`}>
                  Hạng {rank.name}
                </span>
              </div>
            </div>

            {/* Freeze */}
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-blue-500 fill-current" />
                <span className="font-bold text-gray-800">
                  {freezeCount} lượt
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-blue-600 pb-1">
                  Đóng băng
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tiêu điểm hôm nay (Primary Action Hub - Self Study) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-1 shadow-lg">
          <div className="bg-white/95 backdrop-blur-xl rounded-[22px] p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full mb-2 uppercase tracking-wide">
                    Tiêu điểm hôm nay
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Sẵn sàng học tiếp Tiếng Việt chưa?
                  </h2>
                  <p className="text-gray-600">
                    Bài học hôm qua đang đợi bạn hoàn thành. Cùng chinh phục
                    nhận thưởng nào!
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push("/student/skill-tree")}
                className="w-full lg:w-auto px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-white font-bold text-lg rounded-2xl shadow-[0_4px_14px_0_rgba(251,146,60,0.39)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                Học ngay
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. Lớp học của bạn (Assigned by Teacher) */}
      {!currentClass?.class ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 border-2 border-purple-200 shadow-md"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Lớp Học Của Bạn 🎓
                </h2>
              </div>
              <p className="text-gray-700 text-lg mb-6">
                Bạn chưa tham gia lớp học nào! Nhập mã lớp do giáo viên cung cấp
                để bắt đầu hành trình học tập.
              </p>
            </div>

            <div className="w-full md:w-auto bg-white p-6 rounded-2xl shadow-sm min-w-[320px]">
              <div className="mb-4">
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => {
                    setClassCode(e.target.value.toUpperCase());
                    setClassError(null);
                  }}
                  placeholder="Nhập mã lớp (8 ký tự)"
                  maxLength={8}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-xl text-center font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={joiningClass}
                />
              </div>

              <button
                onClick={handleJoinClass}
                disabled={joiningClass || !classCode.trim()}
                className="w-full px-6 py-4 bg-purple-600 text-white text-lg font-bold rounded-xl shadow-md hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {joiningClass ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5" />
                    Tham Gia Ngay
                  </>
                )}
              </button>

              {classError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 flex items-start gap-2"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{classError}</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="text-purple-600" />
              Lớp học của bạn
            </h2>
          </div>

          {loadingSubjects ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-gray-100">
              <LoadingSpinner size="md" />
              <p className="text-gray-500 mt-4 font-medium">
                Đang soạn sách vở...
              </p>
            </div>
          ) : classSubjects.length === 0 ? (
            <div className="bg-white rounded-3xl py-16 px-8 text-center shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                Chưa có môn học nào
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Giáo viên chủ nhiệm chưa phân công môn học nào cho lớp của bạn.
                Hãy quay lại sau nhé!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {classSubjects.map((subject) => {
                const isMain =
                  subject.name.toLowerCase().includes("tiếng việt") ||
                  subject.name.toLowerCase().includes("tieng viet") ||
                  subject.name.toLowerCase().includes("vietnamese");

                if (isMain) {
                  return (
                    <motion.div
                      key={subject.id}
                      whileHover={{ y: -5 }}
                      onClick={() =>
                        router.push(`/learn/subject/${subject.id}`)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/learn/subject/${subject.id}`);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="group cursor-pointer bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all border-2 border-purple-100 hover:border-purple-300 relative overflow-hidden"
                    >                      {/* Active indicator */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 z-0 transition-transform group-hover:scale-110"></div>

                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform group-hover:bg-purple-600 group-hover:text-white shadow-sm">
                            <BookOpen className="w-7 h-7" />
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            Sẵn sàng
                          </span>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                          {subject.name}
                        </h3>
                        <p className="text-gray-500 text-sm mb-6 flex-grow">
                          Giáo viên:{" "}
                          {subject.teachers
                            .map((t) => t.full_name)
                            .filter(Boolean)
                            .join(", ") || "Chưa phân công"}
                        </p>

                        <div className="flex items-center text-purple-600 font-bold text-sm bg-purple-50 px-4 py-3 rounded-xl group-hover:bg-purple-100 transition-colors">
                          Vào học ngay
                          <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  );
                } else {
                  return (
                    <div
                      key={subject.id}
                      className="bg-gray-50 rounded-3xl p-6 border-2 border-gray-100 relative overflow-hidden grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                    >
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-14 h-14 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-500 shadow-sm">
                            <Lock className="w-7 h-7" />
                          </div>
                          <span className="px-3 py-1 bg-white border border-gray-200 text-gray-500 text-xs font-bold rounded-full shadow-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Sắp ra mắt
                          </span>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-600 mb-2">
                          {subject.name}
                        </h3>
                        <p className="text-gray-400 text-sm mb-6 flex-grow">
                          Tính năng đang được phát triển
                        </p>

                        <div className="flex items-center text-gray-400 font-bold text-sm bg-gray-100 px-4 py-3 rounded-xl">
                          Chưa mở
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      )}

      {/* Success Toast uses same logic */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-700 text-white px-6 py-4 rounded-full shadow-2xl font-bold z-50 flex items-center gap-3 backdrop-blur-md"
          >
            <div className="bg-green-500 p-1 rounded-full">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            Đã tham gia lớp thành công!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
