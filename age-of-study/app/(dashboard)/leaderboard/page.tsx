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
import PodiumCard from "@/components/leaderboard/PodiumCard";
import RankCard from "@/components/leaderboard/RankCard";

const ENCOURAGEMENT_MESSAGES = [
  "🌟 Tiếp tục học để leo cao hơn!",
  "🚀 Bạn đang làm rất tốt!",
  "📚 Mỗi điểm đều có giá trị!",
  "💪 Cố lên! Bạn làm được!",
  "🎯 Hãy cố gắng hết sức mình!",
];

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<LeaderboardPeriod>("all-time");
  const [loading, setLoading] = useState(true);
  const [encouragementIndex, setEncouragementIndex] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  // Rotate encouragement messages
  useEffect(() => {
    const interval = setInterval(() => {
      setEncouragementIndex(
        (prev) => (prev + 1) % ENCOURAGEMENT_MESSAGES.length,
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold text-gray-600">Đang tải...</div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const restOfRanks = leaderboard.slice(3);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-black text-gray-900 mb-3">
          🏆 Bảng Xếp Hạng
        </h1>
        <p className="text-xl text-gray-600">
          Những chiến binh học tập xuất sắc nhất!
        </p>
      </motion.div>

      {/* Period Selector */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center gap-3 mb-12"
      >
        {[
          {
            value: "weekly" as LeaderboardPeriod,
            label: "📅 Tuần này",
            icon: "📅",
          },
          {
            value: "monthly" as LeaderboardPeriod,
            label: "📆 Tháng này",
            icon: "📆",
          },
          {
            value: "all-time" as LeaderboardPeriod,
            label: "🌟 Mọi lúc",
            icon: "🌟",
          },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setPeriod(option.value)}
            className={`
              px-6 py-3 rounded-2xl font-black text-lg
              transition-all duration-200
              ${
                period === option.value
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 border-4 border-gray-200 hover:border-blue-300"
              }
            `}
          >
            {option.icon} {option.label.replace(option.icon + " ", "")}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4 animate-bounce">🏆</div>
          <p className="text-xl font-bold text-gray-600">
            Đang tải bảng xếp hạng...
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="mb-12">
              <div className="flex items-end justify-center gap-8 mb-8">
                {/* 2nd Place */}
                {topThree[1] && (
                  <PodiumCard
                    rank={2}
                    name={
                      topThree[1].full_name ||
                      topThree[1].username ||
                      "Học sinh"
                    }
                    avatarUrl={topThree[1].avatar_url}
                    xp={
                      period === "weekly"
                        ? topThree[1].weekly_xp
                        : period === "monthly"
                          ? topThree[1].monthly_xp
                          : topThree[1].total_xp
                    }
                  />
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <PodiumCard
                    rank={1}
                    name={
                      topThree[0].full_name ||
                      topThree[0].username ||
                      "Học sinh"
                    }
                    avatarUrl={topThree[0].avatar_url}
                    xp={
                      period === "weekly"
                        ? topThree[0].weekly_xp
                        : period === "monthly"
                          ? topThree[0].monthly_xp
                          : topThree[0].total_xp
                    }
                  />
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <PodiumCard
                    rank={3}
                    name={
                      topThree[2].full_name ||
                      topThree[2].username ||
                      "Học sinh"
                    }
                    avatarUrl={topThree[2].avatar_url}
                    xp={
                      period === "weekly"
                        ? topThree[2].weekly_xp
                        : period === "monthly"
                          ? topThree[2].monthly_xp
                          : topThree[2].total_xp
                    }
                  />
                )}
              </div>
            </div>
          )}

          {/* Rest of Rankings */}
          {restOfRanks.length > 0 && (
            <div className="space-y-3 mb-8">
              {restOfRanks.map((entry) => (
                <RankCard
                  key={entry.id}
                  rank={entry.rank}
                  name={entry.full_name || entry.username || "Học sinh"}
                  avatarUrl={entry.avatar_url}
                  xp={
                    period === "weekly"
                      ? entry.weekly_xp
                      : period === "monthly"
                        ? entry.monthly_xp
                        : entry.total_xp
                  }
                  isCurrentUser={user?.id === entry.id}
                />
              ))}
            </div>
          )}

          {/* Encouragement Banner */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-6 text-center shadow-xl mb-24"
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={encouragementIndex}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-black text-white"
              >
                {ENCOURAGEMENT_MESSAGES[encouragementIndex]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* Sticky "Your Rank" Banner */}
      {!loading &&
        user &&
        (() => {
          const userEntry = leaderboard.find((e) => e.id === user.id);
          if (!userEntry) return null;

          const userXP =
            period === "weekly"
              ? userEntry.weekly_xp
              : period === "monthly"
                ? userEntry.monthly_xp
                : userEntry.total_xp;
          const nextRank = userEntry.rank - 1;
          const nextEntry = leaderboard.find((e) => e.rank === nextRank);
          const xpNeeded = nextEntry
            ? (period === "weekly"
                ? nextEntry.weekly_xp
                : period === "monthly"
                  ? nextEntry.monthly_xp
                  : nextEntry.total_xp) - userXP
            : 0;

          return (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-50"
            >
              <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 rounded-3xl p-6 shadow-2xl border-4 border-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-white p-1 flex items-center justify-center">
                      {userEntry.avatar_url &&
                      !userEntry.avatar_url.startsWith("http") &&
                      !userEntry.avatar_url.startsWith("/") ? (
                        <span className="text-4xl">{userEntry.avatar_url}</span>
                      ) : userEntry.avatar_url ? (
                        <img
                          src={userEntry.avatar_url}
                          alt="You"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-gray-600">
                          {(userEntry.full_name || userEntry.username || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Text */}
                    <div className="text-left">
                      <p className="text-white text-lg font-black">
                        Bạn đang ở hạng #{userEntry.rank}
                      </p>
                      <p className="text-white/90 text-sm font-semibold">
                        {userEntry.rank <= 10
                          ? `Tuyệt vời! Bạn thuộc top 10! 🌟`
                          : xpNeeded > 0
                            ? `Còn ${xpNeeded} XP nữa để lên hạng ${nextRank}! 💪`
                            : `Tiếp tục cố gắng! 🚀`}
                      </p>
                    </div>
                  </div>

                  {/* XP Display */}
                  <div className="text-right">
                    <p className="text-white text-3xl font-black">
                      {userXP.toLocaleString()}
                    </p>
                    <p className="text-white/90 text-sm font-bold">XP</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
    </div>
  );
}
