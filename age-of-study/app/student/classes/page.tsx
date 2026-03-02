"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { getStudentClass } from "@/lib/classService";
import { TestService } from "@/lib/testService";
import type { StudentWithClass } from "@/types/class";
import type { Test, TestSubmission } from "@/types/test";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Trophy,
  Sparkles,
  User,
  Scroll,
} from "lucide-react";
import Loading from "@/components/ui/loading";

const testService = new TestService();

// ============================================================================
// Helper: format relative time in Vietnamese
// ============================================================================
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

// ============================================================================
// Derived types
// ============================================================================
interface EnrichedTest extends Test {
  submission?: TestSubmission; // latest submission for this student
  isCompleted: boolean;
  bestScore?: number;
}

// ============================================================================
// Main page component
// ============================================================================
export default function StudentClassesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const router = useRouter();

  const [classInfo, setClassInfo] = useState<StudentWithClass | null>(null);
  const [tests, setTests] = useState<EnrichedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"todo" | "done">("todo");

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load data
  useEffect(() => {
    if (user) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1) Get student's class
      const classResult = await getStudentClass(user.id);
      if (classResult.error || !classResult.data) {
        setClassInfo(null);
        setLoading(false);
        return;
      }
      setClassInfo(classResult.data);

      const classId = classResult.data.class?.id;
      if (!classId) {
        setLoading(false);
        return;
      }

      // 2) Get tests for the class
      const classTests = await testService.getTestsByClass(classId);
      const publishedTests = classTests.filter((t) => t.is_published !== false);

      // 3) Get student's submissions
      const submissions = await testService.getStudentSubmissions(user.id);

      // 4) Enrich tests with submission data
      const enriched: EnrichedTest[] = publishedTests.map((test) => {
        const testSubs = submissions
          .filter((s) => s.test_id === test.id)
          .sort(
            (a, b) =>
              new Date(b.started_at).getTime() -
              new Date(a.started_at).getTime()
          );
        const latestSub = testSubs[0];
        const bestScore =
          testSubs.length > 0
            ? Math.max(...testSubs.map((s) => s.score ?? 0))
            : undefined;
        return {
          ...test,
          submission: latestSub,
          isCompleted: testSubs.some((s) => s.status === "completed"),
          bestScore,
        };
      });

      setTests(enriched);
    } catch (err) {
      console.error("Failed to load class data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Navigation
  const handleTakeTest = (testId: string) => {
    router.push(`/student/learn/tests/${testId}`);
  };

  const handleGoToClassDetail = () => {
    if (classInfo?.class?.class_code) {
      router.push(`/student/classes/${classInfo.class.class_code}`);
    }
  };

  // ---------- Loading ----------
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading message="Đang tải lớp học..." size="lg" />
      </div>
    );
  }

  // ---------- No class ----------
  if (!classInfo?.class) {
    return (
      <div className="container mx-auto px-4 py-12 min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 text-center max-w-md w-full relative"
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-yellow-300 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
            <Users className="w-6 h-6 text-slate-800" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase mt-4 mb-3">
            Chưa có lớp học
          </h2>
          <p className="text-slate-600 font-medium mb-6 leading-relaxed">
            Bạn chưa tham gia lớp học nào. Hãy xin mã lớp từ thầy/cô giáo rồi
            nhập ở trang chính nhé! 🏫
          </p>
          <button
            onClick={() => router.push("/student")}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all border-2 border-slate-800 w-full text-lg"
          >
            Về trang chính ✨
          </button>
        </motion.div>
      </div>
    );
  }

  // Separate todo / done tests
  const todoTests = tests.filter((t) => !t.isCompleted);
  const doneTests = tests.filter((t) => t.isCompleted);
  const currentList = activeTab === "todo" ? todoTests : doneTests;

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 min-h-screen bg-amber-50/30 relative">
      {/* ================================================================ */}
      {/* CLASS HEADER CARD */}
      {/* ================================================================ */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8 bg-white rounded-[2rem] p-6 sm:p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 relative overflow-hidden"
      >
        {/* Decorative stickers */}
        <div
          className="absolute top-3 right-4 w-10 h-3 bg-red-200/80 border border-red-300 rounded-sm transform rotate-3"
          role="presentation"
        />
        <div
          className="absolute -bottom-3 -left-3 w-14 h-14 bg-blue-100 rounded-full border-4 border-slate-800 opacity-30"
          role="presentation"
        />

        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Class icon */}
          <div className="w-20 h-20 bg-yellow-300 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-3 flex-shrink-0">
            <BookOpen className="w-10 h-10 text-slate-800" />
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-1">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-800 uppercase tracking-tight">
                {classInfo.class.name}
              </h1>
              <span className="px-3 py-1 bg-green-400 text-slate-900 text-sm font-black rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] border-2 border-slate-800 transform -rotate-2">
                Khối {classInfo.class.grade}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
              {classInfo.class.homeroom_teacher_name && (
                <div className="flex items-center gap-2 bg-amber-100 px-3 py-1.5 rounded-lg border-2 border-amber-300 text-sm font-semibold text-amber-800">
                  <User className="w-4 h-4" />
                  GVCN: {classInfo.class.homeroom_teacher_name}
                </div>
              )}
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border-2 border-slate-300 text-sm font-semibold text-slate-600">
                <Scroll className="w-4 h-4" />
                Năm học: {classInfo.class.school_year}
              </div>
            </div>
          </div>

          {/* CTA → class detail */}
          <button
            onClick={handleGoToClassDetail}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl border-2 border-slate-800 shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all flex items-center gap-2 text-sm"
          >
            Xem lớp <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* ================================================================ */}
      {/* HOMEWORK / TESTS SECTION */}
      {/* ================================================================ */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {/* Tab bar */}
        <div className="flex gap-3 mb-6">
          <TabButton
            active={activeTab === "todo"}
            count={todoTests.length}
            onClick={() => setActiveTab("todo")}
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Cần làm"
            color="red"
          />
          <TabButton
            active={activeTab === "done"}
            count={doneTests.length}
            onClick={() => setActiveTab("done")}
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Đã hoàn thành"
            color="green"
          />
        </div>

        {/* Empty state */}
        <AnimatePresence mode="wait">
          {currentList.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-3xl p-10 shadow-[6px_6px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 text-center"
            >
              {activeTab === "todo" ? (
                <>
                  <div className="w-20 h-20 bg-green-200 rounded-full border-4 border-slate-800 flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                    <Sparkles className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase mb-2">
                    Tuyệt vời! 🎉
                  </h3>
                  <p className="text-slate-500 font-medium text-lg">
                    Bạn đã làm hết tất cả bài tập rồi. Giỏi lắm!
                  </p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-slate-100 rounded-full border-4 border-slate-800 flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                    <Trophy className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase mb-2">
                    Chưa có bài nào
                  </h3>
                  <p className="text-slate-500 font-medium text-lg">
                    Bạn chưa hoàn thành bài tập nào. Hãy bắt đầu nào! 💪
                  </p>
                </>
              )}
            </motion.div>
          )}

          {/* Test cards list */}
          {currentList.length > 0 && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {currentList.map((test, idx) => (
                <TestCard
                  key={test.id}
                  test={test}
                  index={idx}
                  onTakeTest={handleTakeTest}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Tab Button Component
// ============================================================================
function TabButton({
  active,
  count,
  onClick,
  icon,
  label,
  color,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: "red" | "green";
}) {
  const colorMap = {
    red: {
      active:
        "bg-red-100 border-red-400 text-red-700 shadow-[4px_4px_0_0_rgba(0,0,0,1)]",
      badge: "bg-red-500 text-white",
    },
    green: {
      active:
        "bg-green-100 border-green-400 text-green-700 shadow-[4px_4px_0_0_rgba(0,0,0,1)]",
      badge: "bg-green-500 text-white",
    },
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-bold transition-all text-sm sm:text-base ${
        active
          ? `${colorMap[color].active} border-slate-800 -translate-y-0.5`
          : "bg-white border-slate-300 text-slate-500 hover:border-slate-400 shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span
        className={`ml-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
          active ? colorMap[color].badge : "bg-slate-200 text-slate-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ============================================================================
// Test Card Component
// ============================================================================
function TestCard({
  test,
  index,
  onTakeTest,
}: {
  test: EnrichedTest;
  index: number;
  onTakeTest: (id: string) => void;
}) {
  const isCompleted = test.isCompleted;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`group bg-white rounded-2xl border-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all p-5 sm:p-6 relative overflow-hidden ${
        isCompleted ? "border-green-400" : "border-red-400"
      }`}
    >
      {/* Urgency ribbon for todo items */}
      {!isCompleted && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-bl-xl border-l-2 border-b-2 border-slate-800 uppercase tracking-wider">
          📝 Cần làm!
        </div>
      )}

      {/* Completed ribbon */}
      {isCompleted && (
        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-black px-3 py-1 rounded-bl-xl border-l-2 border-b-2 border-slate-800 uppercase tracking-wider flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Đã xong
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-2xl border-2 border-slate-800 flex items-center justify-center flex-shrink-0 shadow-[3px_3px_0_0_rgba(0,0,0,1)] transform group-hover:rotate-6 transition-transform ${
            isCompleted ? "bg-green-200" : "bg-orange-200"
          }`}
        >
          {isCompleted ? (
            <Trophy className="w-7 h-7 text-green-700" />
          ) : (
            <BookOpen className="w-7 h-7 text-orange-700" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-black text-slate-800 leading-tight pr-24 sm:pr-28">
            {test.title}
          </h3>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {test.settings?.time_limit && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border-2 border-slate-300 rounded-lg text-xs font-bold text-slate-600">
                <Clock className="w-3.5 h-3.5" /> {test.settings.time_limit}{" "}
                phút
              </span>
            )}
            {test.subject_name && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 border-2 border-purple-300 rounded-lg text-xs font-bold text-purple-700">
                <BookOpen className="w-3.5 h-3.5" /> {test.subject_name}
              </span>
            )}
            {test.max_xp && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 border-2 border-yellow-300 rounded-lg text-xs font-bold text-yellow-700">
                <Star className="w-3.5 h-3.5" /> +{test.max_xp} XP
              </span>
            )}
            {isCompleted && test.bestScore !== undefined && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 border-2 border-green-300 rounded-lg text-xs font-bold text-green-700">
                <Star className="w-3.5 h-3.5 fill-green-500" />{" "}
                Điểm: {test.bestScore}
              </span>
            )}
          </div>

          {/* Created time */}
          <p className="text-xs text-slate-400 font-medium mt-2">
            Giao {timeAgo(test.created_at)}
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={() => onTakeTest(test.id)}
          className={`flex-shrink-0 px-5 py-3 font-bold rounded-xl border-2 border-slate-800 transition-all flex items-center gap-2 text-sm sm:text-base ${
            isCompleted
              ? "bg-green-100 text-green-700 shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-green-200 hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5"
              : "bg-orange-400 hover:bg-orange-500 text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 animate-pulse-subtle"
          }`}
        >
          {isCompleted ? (
            <>
              Xem lại <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Làm bài <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
