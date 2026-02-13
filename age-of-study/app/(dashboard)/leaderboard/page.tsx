"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import {
  getStudentLeaderboard,
  type LeaderboardEntry,
  type LeaderboardPeriod,
} from "@/lib/leaderboardService";
import RankCard from "@/components/leaderboard/RankCard";
import PersonalProgress from "@/components/leaderboard/PersonalProgress";
import Loading from "@/components/ui/loading";

type ViewMode = "personal" | "class";

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<LeaderboardPeriod>("all-time");
  const [viewMode, setViewMode] = useState<ViewMode>("personal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getStudentLeaderboard(period, 50);
      setLeaderboard(data);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return <Loading message="Đang tải bảng xếp hạng..." size="lg" fullScreen />;
  }

  const userEntry = leaderboard.find((e) => e.id === user?.id);
  const topTen = leaderboard.slice(0, 10);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-black text-gray-900 mb-3">
          🏆 Bảng Vinh Danh
        </h1>
        <p className="text-xl text-gray-600">
          So sánh với chính mình, không so với người khác!
        </p>
      </motion.div>

      {/* View Mode Tabs */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center gap-3 mb-8"
      >
        <button
          onClick={() => setViewMode("personal")}
          className={`
            px-8 py-4 rounded-2xl font-black text-lg
            transition-all duration-200
            ${
              viewMode === "personal"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105"
                : "bg-white text-gray-700 border-4 border-gray-200 hover:border-purple-300"
            }
          `}
        >
          ⭐ Tiến Bộ Của Tôi
        </button>
        <button
          onClick={() => setViewMode("class")}
          className={`
            px-8 py-4 rounded-2xl font-black text-lg
            transition-all duration-200
            ${
              viewMode === "class"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105"
                : "bg-white text-gray-700 border-4 border-gray-200 hover:border-blue-300"
            }
          `}
        >
          🏆 Bảng Vinh Danh Lớp
        </button>
      </motion.div>

      {loading ? (
        <div className="text-center py-20">
          <Loading message="Đang tải dữ liệu bảng xếp hạng..." size="lg" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === "personal" ? (
            userEntry ? (
              <motion.div
                key="personal"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <PersonalProgress
                  totalXP={userEntry.total_xp}
                  weeklyXP={userEntry.weekly_xp}
                  monthlyXP={userEntry.monthly_xp}
                  previousWeekXP={userEntry.previous_week_xp}
                  previousMonthXP={userEntry.previous_month_xp}
                  currentStreak={userEntry.current_streak}
                  tier={userEntry.tier}
                  rank={userEntry.rank}
                />
              </motion.div>
            ) : (
              <motion.div
                key="personal-empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="text-center py-20 bg-white rounded-3xl shadow-xl border-4 border-purple-200"
              >
                <div className="text-8xl mb-6 animate-bounce">🌱</div>
                <h3 className="text-3xl font-black text-gray-800 mb-4">
                  Hành trình của bạn mới bắt đầu!
                </h3>
                <p className="text-xl text-gray-600 max-w-md mx-auto mb-8">
                  Hoàn thành bài học đầu tiên để theo dõi tiến độ cá nhân của bạn
                </p>
                <button
                  onClick={() => window.location.href = '/learn'}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-lg rounded-2xl shadow-lg hover:scale-105 transition-transform"
                >
                  🚀 Bắt đầu học ngay!
                </button>
              </motion.div>
            )
          ) : (
            <motion.div
              key="class"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Period Selector */}
              <div className="flex justify-center gap-3 mb-8">
                {[
                  {
                    value: "weekly" as LeaderboardPeriod,
                    label: "Tuần này",
                    icon: "📅",
                  },
                  {
                    value: "monthly" as LeaderboardPeriod,
                    label: "Tháng này",
                    icon: "📆",
                  },
                  {
                    value: "all-time" as LeaderboardPeriod,
                    label: "Tất cả",
                    icon: "🌟",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPeriod(option.value)}
                    className={`
                      px-6 py-3 rounded-2xl font-black text-base
                      transition-all duration-200
                      ${
                        period === option.value
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105"
                          : "bg-white text-gray-700 border-4 border-gray-200 hover:border-blue-300"
                      }
                    `}
                  >
                    {option.icon} {option.label}
                  </button>
                ))}
              </div>

              {/* Top 10 Rankings */}
              {topTen.length > 0 ? (
                <div className="space-y-3 mb-8">
                  {topTen.map((entry) => {
                    const xp =
                      period === "weekly"
                        ? entry.weekly_xp
                        : period === "monthly"
                          ? entry.monthly_xp
                          : entry.total_xp;
                    const improvement =
                      period === "weekly"
                        ? entry.weekly_improvement
                        : period === "monthly"
                          ? entry.monthly_improvement
                          : undefined;

                    return (
                      <RankCard
                        key={entry.id}
                        rank={entry.rank}
                        name={entry.full_name || entry.username || "Học sinh"}
                        avatarUrl={entry.avatar_url}
                        xp={xp}
                        tier={entry.tier}
                        improvement={improvement}
                        isCurrentUser={user?.id === entry.id}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-xl font-bold text-gray-600">
                    Chưa có dữ liệu xếp hạng
                  </p>
                </div>
              )}

              {/* Encouragement Banner */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-gradient-to-r from-green-500 to-teal-500 rounded-3xl p-6 text-center shadow-xl"
              >
                <p className="text-xl font-black text-white">
                  💚 Mọi người đều đang tiến bộ! Hãy học mỗi ngày nhé!
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
