/**
 * Badge Collection Component
 *
 * - Earned badges: Full color, with "NEW" pulsing indicator when XP unclaimed
 * - Locked badges: Grayscale with progress bar
 * - Clicking an unclaimed badge opens a modal to claim XP reward
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Trophy,
  Award,
  TrendingUp,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import type { BadgeWithStatus } from "@/types/achievement";
import {
  getBadgeCollection,
  checkAndAwardBadges,
} from "@/lib/achievementService";
import { claimBadgeXpAction } from "@/actions/badgeActions";
import { useAuthStore } from "@/store/useAuthStore";

interface BadgeCollectionProps {
  userId: string;
}

export default function BadgeCollection({ userId }: BadgeCollectionProps) {
  const { checkAuth } = useAuthStore();
  const [badges, setBadges] = useState<BadgeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(
    null,
  );

  useEffect(() => {
    loadBadges();
  }, [userId]);

  const loadBadges = async () => {
    setLoading(true);
    setError(null);
    try {
      await checkAndAwardBadges(userId);
      const response = await getBadgeCollection(userId);
      if (response.error) {
        setError(response.error);
      } else {
        setBadges(response.data ?? []);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Lỗi không xác định khi tải huy hiệu.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSuccess = async (badgeId: string) => {
    // Optimistically update local state
    setBadges((prev) =>
      prev.map((b) => (b.id === badgeId ? { ...b, xp_claimed: true } : b)),
    );
    setSelectedBadge((prev) =>
      prev?.id === badgeId ? { ...prev, xp_claimed: true } : prev,
    );
    // Sync global XP
    await checkAuth();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
        <span className="ml-3 text-gray-600">Đang tải bộ sưu tập...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">❌ {error}</p>
        <button
          onClick={loadBadges}
          className="mt-2 text-sm text-red-700 underline hover:text-red-800"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const earnedCount = badges.filter((b) => b.is_earned).length;
  const totalCount = badges.length;
  const unclaimedCount = badges.filter(
    (b) => b.is_earned && !b.xp_claimed,
  ).length;
  const completionPercentage =
    totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header & Progress */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Bộ Sưu Tập Huy Hiệu
              </h2>
              <p className="text-sm text-gray-600">
                {unclaimedCount > 0
                  ? `🎁 Bạn có ${unclaimedCount} phần thưởng chưa nhận!`
                  : "Giống như thẻ bài Pokemon, hãy thu thập tất cả nhé!"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-600">
              {earnedCount}/{totalCount}
            </div>
            <div className="text-xs text-gray-500">Đã đạt được</div>
          </div>
        </div>

        <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-orange-500"
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
            {Math.round(completionPercentage)}%
          </div>
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {badges.map((badge, index) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            index={index}
            onClick={() => setSelectedBadge(badge)}
          />
        ))}
      </div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgeDetailModal
            badge={selectedBadge}
            userId={userId}
            onClose={() => setSelectedBadge(null)}
            onClaimSuccess={handleClaimSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Badge Card ───────────────────────────────────────────────────────────────

interface BadgeCardProps {
  badge: BadgeWithStatus;
  index: number;
  onClick: () => void;
}

function BadgeCard({ badge, index, onClick }: BadgeCardProps) {
  const isEarned = badge.is_earned;
  const isNew = isEarned && !badge.xp_claimed;
  const hasProgress =
    !isEarned &&
    badge.progress !== undefined &&
    badge.progress_max !== undefined;
  const progressPercentage = hasProgress
    ? (badge.progress! / badge.progress_max!) * 100
    : 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border-2 transition-all text-left
        ${
          isEarned
            ? isNew
              ? "bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-400 shadow-lg shadow-amber-200 ring-2 ring-amber-300 ring-offset-1"
              : "bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300 shadow-md hover:shadow-lg"
            : "bg-gray-100 border-gray-300 hover:border-gray-400"
        }
      `}
    >
      {/* NEW indicator */}
      {isNew && (
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="absolute -top-2 -left-2 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow z-10 leading-none"
        >
          NEW
        </motion.div>
      )}

      {/* Lock icon for locked badges */}
      {!isEarned && (
        <div className="absolute top-2 right-2 bg-gray-700 rounded-full p-1">
          <Lock className="w-3 h-3 text-gray-300" />
        </div>
      )}

      {/* Badge Icon */}
      <div
        className={`text-5xl mb-2 transition-all ${
          isEarned ? "filter-none" : "grayscale opacity-40"
        }`}
      >
        {badge.icon_url || "🏅"}
      </div>

      {/* Badge Name */}
      <div
        className={`text-xs font-semibold mb-1 line-clamp-2 ${
          isEarned ? "text-gray-900" : "text-gray-500"
        }`}
      >
        {badge.name}
      </div>

      {/* XP reward hint */}
      {isEarned && (
        <div
          className={`text-[10px] font-bold flex items-center gap-0.5 ${
            isNew ? "text-amber-600" : "text-gray-400"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          {isNew ? `+${badge.xp_reward} XP` : "Đã nhận"}
        </div>
      )}

      {/* Progress bar for locked badges */}
      {hasProgress && (
        <div className="mt-2">
          <div className="relative w-full h-1.5 bg-gray-300 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              className="absolute top-0 left-0 h-full bg-blue-500"
            />
          </div>
          <div className="text-[10px] text-gray-600 mt-1 text-center">
            {badge.progress}/{badge.progress_max}
          </div>
        </div>
      )}

      {/* Earned date */}
      {isEarned && badge.earned_at && (
        <div className="text-[10px] text-gray-500 mt-1">
          {new Date(badge.earned_at).toLocaleDateString("vi-VN")}
        </div>
      )}
    </motion.button>
  );
}

// ─── Badge Detail Modal ───────────────────────────────────────────────────────

interface BadgeDetailModalProps {
  badge: BadgeWithStatus;
  userId: string;
  onClose: () => void;
  onClaimSuccess: (badgeId: string) => void;
}

function BadgeDetailModal({
  badge,
  userId,
  onClose,
  onClaimSuccess,
}: BadgeDetailModalProps) {
  const isEarned = badge.is_earned;
  const hasProgress =
    !isEarned &&
    badge.progress !== undefined &&
    badge.progress_max !== undefined;
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(badge.xp_claimed);

  const handleClaim = async () => {
    setClaiming(true);
    setClaimError(null);

    try {
      const result = await claimBadgeXpAction(userId, badge.id);

      if ("error" in result) {
        setClaimError(result.error);
        setClaiming(false);
        return;
      }

      // Success!
      setClaimed(true);
      setClaiming(false);
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      onClaimSuccess(badge.id);
    } catch {
      setClaimError("Đã xảy ra lỗi khi nhận thưởng");
      setClaiming(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`
          relative max-w-md w-full rounded-2xl p-8 shadow-2xl
          ${
            isEarned
              ? "bg-gradient-to-br from-yellow-100 via-orange-100 to-yellow-100"
              : "bg-gradient-to-br from-gray-100 to-gray-200"
          }
        `}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        {/* Badge Icon */}
        <div className="text-center mb-6">
          <div
            className={`text-8xl mb-4 inline-block ${
              isEarned ? "filter-none animate-bounce" : "grayscale opacity-50"
            }`}
          >
            {badge.icon_url || "🏅"}
          </div>

          {!isEarned && (
            <div className="inline-flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-full">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-semibold">Chưa mở khóa</span>
            </div>
          )}
        </div>

        {/* Badge Info */}
        <div className="text-center space-y-3">
          <h3 className="text-2xl font-bold text-gray-900">{badge.name}</h3>

          {badge.description && (
            <p className="text-gray-600">{badge.description}</p>
          )}

          {badge.condition_type && badge.condition_value && (
            <div
              className={`p-4 rounded-lg border-2 ${
                isEarned
                  ? "bg-green-50 border-green-300"
                  : "bg-blue-50 border-blue-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                {isEarned ? (
                  <Award className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                )}
                <span className="font-semibold text-sm">
                  {isEarned ? "Đã hoàn thành" : "Yêu cầu mở khóa"}
                </span>
              </div>
              <p className="text-sm text-gray-700">
                {getConditionDescription(
                  badge.condition_type,
                  badge.condition_value,
                )}
              </p>

              {hasProgress && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Tiến độ</span>
                    <span>
                      {badge.progress}/{badge.progress_max}
                    </span>
                  </div>
                  <div className="relative w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(badge.progress! / badge.progress_max!) * 100}%`,
                      }}
                      className="absolute top-0 left-0 h-full bg-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* XP Claim Button */}
          {isEarned && (
            <div className="pt-2">
              {claimed ? (
                <div className="flex items-center justify-center gap-2 py-3 px-6 bg-gray-100 rounded-xl text-gray-500 font-semibold">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Đã nhận thưởng
                </div>
              ) : (
                <>
                  <motion.button
                    onClick={handleClaim}
                    disabled={claiming}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 px-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    {claiming
                      ? "Đang nhận..."
                      : `Nhận thưởng +${badge.xp_reward} XP`}
                  </motion.button>
                  {claimError && (
                    <p className="text-red-500 text-sm mt-2">{claimError}</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Earned Date */}
          {isEarned && badge.earned_at && (
            <div className="text-sm text-gray-500 pt-1">
              🎉 Đạt được ngày{" "}
              {new Date(badge.earned_at).toLocaleDateString("vi-VN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getConditionDescription(
  conditionType: string,
  conditionValue: number,
): string {
  switch (conditionType) {
    case "streak":
      return `Học liên tục ${conditionValue} ngày không nghỉ`;
    case "quiz_count":
      return `Hoàn thành ${conditionValue} bài quiz`;
    case "rank_weekly":
      return `Lọt vào Top ${conditionValue} bảng xếp hạng tuần`;
    case "rank_monthly":
      return `Lọt vào Top ${conditionValue} bảng xếp hạng tháng`;
    case "improvement":
      return `Cải thiện ${conditionValue}% so với kỳ trước`;
    case "persistence":
      return `Kiên trì làm bài dù gặp khó khăn`;
    case "tier":
      return `Đạt Tier ${conditionValue}`;
    default:
      return `Hoàn thành điều kiện đặc biệt`;
  }
}
