"use client";

import { motion } from "framer-motion";
import { getTierConfig, type TierLevel } from "@/lib/tierSystem";

interface TierBadgeProps {
  tier: TierLevel;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  showProgress?: boolean;
  currentXP?: number;
  className?: string;
}

const SIZE_CLASSES = {
  sm: {
    container: "h-8 px-3 text-sm",
    icon: "text-base",
    text: "text-xs",
  },
  md: {
    container: "h-10 px-4 text-base",
    icon: "text-lg",
    text: "text-sm",
  },
  lg: {
    container: "h-14 px-6 text-lg",
    icon: "text-2xl",
    text: "text-base",
  },
};

export default function TierBadge({
  tier,
  size = "md",
  showName = true,
  showProgress = false,
  currentXP,
  className = "",
}: TierBadgeProps) {
  const config = getTierConfig(tier);
  const sizeClass = SIZE_CLASSES[size];

  // Calculate progress within current tier
  let progress: number | null = null;
  if (showProgress && currentXP !== undefined && config.maxXP !== null) {
    const denominator = config.maxXP - config.minXP;
    if (denominator <= 0) {
      // Handle edge case: if denominator is zero or negative
      progress = currentXP >= config.maxXP ? 100 : 0;
    } else {
      // Calculate and clamp progress between 0 and 100
      const calculatedProgress = ((currentXP - config.minXP) / denominator) * 100;
      progress = Math.max(0, Math.min(100, calculatedProgress));
    }
  }

  return (
    <div className={`inline-flex flex-col gap-2 ${className}`}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        className={`
          ${sizeClass.container}
          bg-gradient-to-r ${config.gradient}
          rounded-full
          flex items-center gap-2
          shadow-lg
          border-2 border-white
        `}
      >
        {/* Icon */}
        <span className={sizeClass.icon}>{config.icon}</span>

        {/* Name */}
        {showName && (
          <span className={`font-black text-white ${sizeClass.text}`}>
            {config.name}
          </span>
        )}
      </motion.div>

      {/* Progress Bar */}
      {showProgress && progress !== null && config.maxXP !== null && (
        <div className="flex flex-col gap-1">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${config.gradient}`}
            />
          </div>
          <div className="text-xs text-gray-600 text-center font-semibold">
            {currentXP?.toLocaleString()} / {config.maxXP.toLocaleString()} XP
          </div>
        </div>
      )}
    </div>
  );
}
