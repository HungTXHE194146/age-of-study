/**
 * Tier system for student progress
 * Provides achievable goals for all students, not just top performers
 */

export type TierLevel = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface TierConfig {
  level: TierLevel;
  name: string; // Vietnamese display name
  minXP: number;
  maxXP: number | null; // null for highest tier
  color: string; // Tailwind color class
  icon: string;
  gradient: string; // Tailwind gradient class
}

export const TIER_THRESHOLDS: Record<TierLevel, TierConfig> = {
  bronze: {
    level: 'bronze',
    name: 'Đồng',
    minXP: 0,
    maxXP: 499,
    color: 'orange-700',
    icon: '🥉',
    gradient: 'from-orange-600 to-orange-800',
  },
  silver: {
    level: 'silver',
    name: 'Bạc',
    minXP: 500,
    maxXP: 1499,
    color: 'gray-400',
    icon: '🥈',
    gradient: 'from-gray-300 to-gray-500',
  },
  gold: {
    level: 'gold',
    name: 'Vàng',
    minXP: 1500,
    maxXP: 2999,
    color: 'yellow-500',
    icon: '🥇',
    gradient: 'from-yellow-400 to-yellow-600',
  },
  diamond: {
    level: 'diamond',
    name: 'Kim cương',
    minXP: 3000,
    maxXP: null,
    color: 'cyan-400',
    icon: '💎',
    gradient: 'from-cyan-400 to-blue-500',
  },
};

/**
 * Calculate tier level based on total XP
 */
export function calculateTier(totalXP: number): TierLevel {
  if (totalXP >= 3000) return 'diamond';
  if (totalXP >= 1500) return 'gold';
  if (totalXP >= 500) return 'silver';
  return 'bronze';
}

/**
 * Get tier configuration
 */
export function getTierConfig(tier: TierLevel): TierConfig {
  return TIER_THRESHOLDS[tier];
}

/**
 * Calculate progress to next tier
 * @returns { current, required, percentage }
 */
export function calculateTierProgress(totalXP: number): {
  currentTier: TierLevel;
  nextTier: TierLevel | null;
  currentXP: number;
  requiredXP: number;
  percentage: number;
} {
  const currentTier = calculateTier(totalXP);
  const tiers: TierLevel[] = ['bronze', 'silver', 'gold', 'diamond'];
  const currentIndex = tiers.indexOf(currentTier);
  const nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      currentXP: totalXP,
      requiredXP: totalXP,
      percentage: 100,
    };
  }

  const currentConfig = TIER_THRESHOLDS[currentTier];
  const nextConfig = TIER_THRESHOLDS[nextTier];
  const currentXP = totalXP - currentConfig.minXP;
  const requiredXP = nextConfig.minXP - currentConfig.minXP;
  const percentage = Math.min(100, Math.round((currentXP / requiredXP) * 100));

  return {
    currentTier,
    nextTier,
    currentXP,
    requiredXP,
    percentage,
  };
}

/**
 * Badge definitions with Vietnamese names
 */
export interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'result' | 'effort' | 'tier' | 'milestone';
}

export const BADGE_DEFINITIONS: Record<string, BadgeConfig> = {
  // Result-based
  top_weekly: {
    id: 'top_weekly',
    name: 'Thần đồng tuần',
    description: 'Top 3 bảng xếp hạng tuần',
    icon: '🏆',
    category: 'result',
  },
  top_monthly: {
    id: 'top_monthly',
    name: 'Siêu sao tháng',
    description: 'Top 3 bảng xếp hạng tháng',
    icon: '🌟',
    category: 'result',
  },

  // Effort-based
  streak_7: {
    id: 'streak_7',
    name: 'Ong chăm chỉ',
    description: 'Học liên tục 7 ngày',
    icon: '🐝',
    category: 'effort',
  },
  streak_30: {
    id: 'streak_30',
    name: 'Chiến binh kiên cường',
    description: 'Học liên tục 30 ngày',
    icon: '💪',
    category: 'effort',
  },
  persistent: {
    id: 'persistent',
    name: 'Không bao giờ bỏ cuộc',
    description: 'Hoàn thành quiz dù sai nhiều lần',
    icon: '🛡️',
    category: 'effort',
  },
  improvement_50: {
    id: 'improvement_50',
    name: 'Ngôi sao đang lên',
    description: 'Cải thiện 50% XP so với tuần trước',
    icon: '⭐',
    category: 'effort',
  },

  // Milestone
  first_quiz: {
    id: 'first_quiz',
    name: 'Bước đầu tiên',
    description: 'Hoàn thành quiz đầu tiên',
    icon: '🎯',
    category: 'milestone',
  },
  quiz_master: {
    id: 'quiz_master',
    name: 'Bậc thầy giải đố',
    description: 'Hoàn thành 100 quiz',
    icon: '🧙',
    category: 'milestone',
  },

  // Tier badges
  tier_silver: {
    id: 'tier_silver',
    name: 'Huy hiệu Bạc',
    description: 'Đạt tier Bạc',
    icon: '🥈',
    category: 'tier',
  },
  tier_gold: {
    id: 'tier_gold',
    name: 'Huy hiệu Vàng',
    description: 'Đạt tier Vàng',
    icon: '🥇',
    category: 'tier',
  },
  tier_diamond: {
    id: 'tier_diamond',
    name: 'Huy hiệu Kim cương',
    description: 'Đạt tier Kim cương',
    icon: '💎',
    category: 'tier',
  },
};

/**
 * Calculate improvement percentage
 */
export function calculateImprovement(currentXP: number, previousXP: number): number {
  if (previousXP === 0) return currentXP > 0 ? 100 : 0;
  return Math.round(((currentXP - previousXP) / previousXP) * 100);
}
