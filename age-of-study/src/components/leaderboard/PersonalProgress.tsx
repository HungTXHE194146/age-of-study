"use client";

import { motion } from "framer-motion";
import TierBadge from "./TierBadge";
import { calculateTierProgress, type TierLevel } from "@/lib/tierSystem";

interface PersonalProgressProps {
  totalXP: number;
  weeklyXP: number;
  monthlyXP: number;
  previousWeekXP: number;
  previousMonthXP: number;
  currentStreak: number;
  tier: TierLevel;
  rank: number;
}

export default function PersonalProgress({
  totalXP,
  weeklyXP,
  monthlyXP,
  previousWeekXP,
  previousMonthXP,
  currentStreak,
  tier,
  rank,
}: PersonalProgressProps) {
  const tierProgress = calculateTierProgress(totalXP);

  // Calculate improvement
  const weeklyImprovement =
    previousWeekXP > 0
      ? Math.round(((weeklyXP - previousWeekXP) / previousWeekXP) * 100)
      : weeklyXP > 0
        ? 100
        : 0;

  const monthlyImprovement =
    previousMonthXP > 0
      ? Math.round(((monthlyXP - previousMonthXP) / previousMonthXP) * 100)
      : monthlyXP > 0
        ? 100
        : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <h2 className="text-4xl font-black text-gray-900 mb-2">
          Tiến Bộ Của Tôi
        </h2>
        <p className="text-lg text-gray-600">
          Hãy so sánh với chính mình ngày hôm qua!
        </p>
      </motion.div>

      {/* Current Tier Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-8 shadow-xl border-4 border-purple-200"
      >
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-2xl font-black text-gray-800">
            Cấp Độ Hiện Tại
          </h3>
          <TierBadge
            tier={tier}
            size="lg"
            showProgress={true}
            currentXP={totalXP}
          />
          <div className="text-center">
            <p className="text-3xl font-black text-gray-900">
              {totalXP.toLocaleString()} XP
            </p>
            {tierProgress.nextTier && (
              <p className="text-sm text-gray-600 mt-2">
                Còn{" "}
                <span className="font-bold text-purple-600">
                  {(
                    tierProgress.requiredXP - tierProgress.currentXP
                  ).toLocaleString()}{" "}
                  XP
                </span>{" "}
                nữa để lên <span className="font-bold">{tierProgress.nextTier.toUpperCase()}</span>!
              </p>
            )}
            {!tierProgress.nextTier && (
              <p className="text-sm text-cyan-600 font-bold mt-2">
                🎉 Bạn đã đạt tier cao nhất!
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Rank Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
          <div className="text-center">
            <div className="text-4xl mb-2">🏅</div>
            <p className="text-sm text-gray-600 mb-1">Hạng hiện tại</p>
            <p className="text-3xl font-black text-gray-900">#{rank}</p>
            <p className="text-xs text-gray-500 mt-2">
              {rank <= 10 ? "Tuyệt vời! 🌟" : "Cố lên! 💪"}
            </p>
          </div>
        </div>

        {/* Weekly Improvement Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
          <div className="text-center">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-sm text-gray-600 mb-1">Tiến bộ tuần này</p>
            <p
              className={`text-3xl font-black ${
                weeklyImprovement > 0
                  ? "text-green-600"
                  : weeklyImprovement < 0
                    ? "text-red-600"
                    : "text-gray-900"
              }`}
            >
              {weeklyImprovement > 0 && "+"}
              {weeklyImprovement}%
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {previousWeekXP.toLocaleString()} → {weeklyXP.toLocaleString()}{" "}
              XP
            </p>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
          <div className="text-center">
            <div className="text-4xl mb-2">🔥</div>
            <p className="text-sm text-gray-600 mb-1">Chuỗi học liên tục</p>
            <p className="text-3xl font-black text-orange-600">
              {currentStreak} ngày
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {currentStreak >= 7
                ? "Tuyệt vời! 🐝"
                : currentStreak >= 3
                  ? "Tiếp tục! 💪"
                  : "Học hàng ngày nhé!"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Monthly Stats */}
      {monthlyXP > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg border-2 border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-black text-gray-800 mb-1">
                📆 Thành tích tháng này
              </h4>
              <p className="text-2xl font-black text-green-600">
                {monthlyXP.toLocaleString()} XP
              </p>
              {previousMonthXP > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {monthlyImprovement > 0 ? "+" : ""}
                  {monthlyImprovement}% so với tháng trước
                </p>
              )}
            </div>
            <div className="text-6xl">
              {monthlyImprovement > 0 ? "🚀" : "📊"}
            </div>
          </div>
        </motion.div>
      )}

      {/* Encouragement Message */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 rounded-2xl p-6 text-center shadow-xl"
      >
        <p className="text-xl font-black text-white">
          {weeklyImprovement > 50
            ? "🌟 Em đang tiến bộ vượt bậc! Tuyệt vời lắm!"
            : weeklyImprovement > 0
              ? "💪 Em đang học tốt hơn! Cố lên!"
              : currentStreak >= 3
                ? "🔥 Chuỗi học xuất sắc! Tiếp tục phát huy!"
                : "📚 Mỗi ngày học một chút, tiến bộ từng bước!"}
        </p>
      </motion.div>
    </div>
  );
}
