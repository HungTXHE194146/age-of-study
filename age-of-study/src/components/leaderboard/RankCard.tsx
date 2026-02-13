"use client";

import { motion } from "framer-motion";
import TierBadge from "./TierBadge";
import type { TierLevel } from "@/lib/tierSystem";

interface RankCardProps {
  rank: number;
  name: string;
  avatarUrl: string | null;
  xp: number;
  tier: TierLevel;
  improvement?: number; // percentage
  isCurrentUser?: boolean;
}

const RANK_COLORS = [
  "border-blue-400 bg-blue-50",
  "border-green-400 bg-green-50",
  "border-orange-400 bg-orange-50",
  "border-pink-400 bg-pink-50",
  "border-purple-400 bg-purple-50",
];

export default function RankCard({
  rank,
  name,
  avatarUrl,
  xp,
  tier,
  improvement,
  isCurrentUser = false,
}: RankCardProps) {
  const isEmoji =
    avatarUrl && !avatarUrl.startsWith("http") && !avatarUrl.startsWith("/");
  // Ensure positive index for color class (rank >= 4 expected, but handle edge cases)
  const colorIndex = rank >= 4 ? (rank - 4) % RANK_COLORS.length : 0;
  const colorClass = RANK_COLORS[colorIndex];
  // Clamp animation delay to non-negative values
  const animationDelay = Math.max(rank - 4, 0) * 0.05;

  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: animationDelay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`
        relative
        p-4 rounded-2xl border-4
        ${isCurrentUser ? "border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg" : colorClass}
        transition-all duration-200
      `}
    >
      {/* "That's You!" Badge */}
      {isCurrentUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-3 -right-3 bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg"
        >
          ⭐ Đó là bạn!
        </motion.div>
      )}

      <div className="flex items-center gap-4">
        {/* Rank Number */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
          <span className="text-2xl font-black text-gray-700">{rank}</span>
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden">
          {isEmoji ? (
            <span className="text-3xl">{avatarUrl}</span>
          ) : avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-gray-600">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name and XP */}
        <div className="flex-1">
          <p className="font-black text-lg text-gray-800 mb-1">{name}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">⭐</span>
              <span className="font-bold text-xl text-gray-900">
                {xp.toLocaleString()}
              </span>
              <span className="text-sm text-gray-600">XP</span>
            </div>
            {improvement !== undefined && improvement !== 0 && (
              <div
                className={`text-sm font-bold ${
                  improvement > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {improvement > 0 ? "+" : ""}
                {improvement}%
              </div>
            )}
          </div>
        </div>

        {/* Tier Badge */}
        <div className="flex-shrink-0">
          <TierBadge tier={tier} size="sm" showName={false} />
        </div>
      </div>
    </motion.div>
  );
}
