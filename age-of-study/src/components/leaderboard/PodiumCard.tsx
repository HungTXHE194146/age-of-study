"use client";

import { motion } from "framer-motion";

interface PodiumProps {
  rank: 1 | 2 | 3;
  name: string;
  avatarUrl: string | null;
  xp: number;
}

const PODIUM_HEIGHTS = {
  1: "h-48",
  2: "h-36",
  3: "h-28",
};

const PODIUM_COLORS = {
  1: "from-yellow-400 to-yellow-600",
  2: "from-gray-300 to-gray-500",
  3: "from-orange-400 to-orange-600",
};

const MEDALS = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export default function PodiumCard({ rank, name, avatarUrl, xp }: PodiumProps) {
  const isEmoji =
    avatarUrl && !avatarUrl.startsWith("http") && !avatarUrl.startsWith("/");

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay: rank === 1 ? 0.2 : rank === 2 ? 0.1 : 0,
      }}
      className="flex flex-col items-center"
    >
      {/* Trophy & Avatar */}
      <motion.div
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="mb-4 relative flex flex-col items-center"
        style={{ minHeight: rank === 1 ? "280px" : "160px" }}
      >
        {/* Large Trophy for #1 */}
        {rank === 1 && (
          <div className="text-8xl mb-3 filter drop-shadow-2xl">🏆</div>
        )}

        {/* Medal for #2 and #3 - positioned above */}
        {rank !== 1 && <div className="text-5xl mb-2">{MEDALS[rank]}</div>}

        {/* Avatar with Rank Badge */}
        <div className="relative">
          <div
            className={`
              w-24 h-24 rounded-full 
              ${rank === 1 ? "ring-8 ring-yellow-400 shadow-yellow-400/50" : rank === 2 ? "ring-4 ring-gray-400 shadow-gray-400/50" : "ring-4 ring-orange-400 shadow-orange-400/50"} 
              bg-white flex items-center justify-center overflow-hidden 
              shadow-2xl
            `}
          >
            {isEmoji ? (
              <span className="text-5xl">{avatarUrl}</span>
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-gray-600">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Rank Badge */}
          <div
            className={`
              absolute -bottom-2 left-1/2 transform -translate-x-1/2
              w-10 h-10 rounded-full
              ${rank === 1 ? "bg-yellow-400" : rank === 2 ? "bg-gray-400" : "bg-orange-500"}
              border-4 border-white
              flex items-center justify-center
              shadow-lg
            `}
          >
            <span className="text-white text-xl font-black">{rank}</span>
          </div>
        </div>
      </motion.div>

      {/* Name */}
      <div className="text-center mb-3">
        <p className="font-black text-lg text-gray-800 mb-1">{name}</p>
        <div className="flex items-center gap-1 justify-center">
          <span className="text-yellow-500">⭐</span>
          <span className="font-bold text-xl text-gray-900">
            {xp.toLocaleString()}
          </span>
          <span className="text-sm text-gray-600">XP</span>
        </div>
      </div>

      {/* Podium */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 12,
          delay: rank === 1 ? 0.4 : rank === 2 ? 0.3 : 0.2,
        }}
        className={`
          ${PODIUM_HEIGHTS[rank]}
          w-32
          rounded-t-2xl
          bg-gradient-to-b ${PODIUM_COLORS[rank]}
          shadow-2xl
          flex items-center justify-center
          origin-bottom
        `}
      >
        <span className="text-white text-5xl font-black drop-shadow-lg">
          {rank}
        </span>
      </motion.div>
    </motion.div>
  );
}
