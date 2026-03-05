/**
 * Achievement Backpack Types
 * Corresponds to migrations/add_achievement_backpack.sql
 * 
 * This file defines types for:
 * - Badge Collection (from badges & user_badges tables)
 * - Avatar Wardrobe (user_avatars & avatar_shop tables)
 * - Digital Certificates (certificates table)
 */

// ============================================================================
// Badge Types
// ============================================================================

export type BadgeConditionType = 
  | 'rank_weekly' 
  | 'rank_monthly' 
  | 'streak' 
  | 'persistence' 
  | 'improvement' 
  | 'quiz_count' 
  | 'tier';

/**
 * Badge definition from badges table
 */
export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;  // Emoji or image URL
  condition_type: BadgeConditionType | null;
  condition_value: number | null;
  xp_reward: number;        // One-time XP reward on claim
}

/**
 * User's earned badge from user_badges table
 */
export interface UserBadge {
  user_id: string;
  badge_id: string;
  earned_at: string;
  xp_claimed_at: string | null; // null = reward not yet claimed
}

/**
 * Badge with earned status (for display in collection)
 */
export interface BadgeWithStatus extends Badge {
  is_earned: boolean;
  earned_at: string | null;
  xp_claimed: boolean;      // true = XP reward already collected
  progress?: number;        // Current progress towards earning (e.g., 5/7 days)
  progress_max?: number;    // Required to earn (e.g., 7 days)
}

// ============================================================================
// Avatar Types
// ============================================================================

export type AvatarType = 'emoji' | 'dicebear';
export type AvatarSource = 'purchase' | 'level_reward' | 'event' | 'default';
export type AvatarCategory = 'default' | 'animals' | 'fantasy' | 'premium' | 'cool' | 'cute';

/**
 * User's avatar collection from user_avatars table
 */
export interface UserAvatar {
  id: number;
  user_id: string;
  avatar_code: string;
  avatar_type: AvatarType;
  is_unlocked: boolean;
  unlocked_at: string | null;
  xp_cost: number;
  source: AvatarSource | null;
  created_at: string;
}

/**
 * Avatar shop item from avatar_shop table
 */
export interface AvatarShopItem {
  id: number;
  avatar_code: string;
  avatar_type: AvatarType;
  display_name: string;
  description: string | null;
  xp_cost: number;
  required_level: number;
  is_active: boolean;
  is_premium: boolean;
  category: AvatarCategory | null;
  sort_order: number;
  created_at: string;
}

/**
 * Avatar with ownership status (for display in wardrobe)
 */
export interface AvatarWithStatus extends AvatarShopItem {
  is_owned: boolean;
  unlocked_at: string | null;
  can_afford: boolean;  // Does user have enough XP to purchase?
  can_unlock: boolean;  // Does user meet level requirement?
}

// ============================================================================
// Certificate Types
// ============================================================================

export type CertificateCategory = 'academic' | 'behavior' | 'participation' | 'special';
export type CertificateTemplate = 'classic' | 'modern' | 'playful';

/**
 * Digital certificate from certificates table
 */
export interface Certificate {
  id: string;
  student_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  category: CertificateCategory | null;
  design_template: CertificateTemplate;
  issued_at: string;
  viewed_at: string | null;
  shared_at: string | null;
  teacher_name: string;
  created_at: string;
}

/**
 * Certificate with teacher details (for display)
 */
export interface CertificateWithTeacher extends Certificate {
  teacher: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Certificate with student details (for teacher view)
 */
export interface CertificateWithStudent extends Certificate {
  student: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    grade: number | null;
  } | null;
}

// ============================================================================
// Form Input Types
// ============================================================================

/**
 * Input for purchasing/unlocking an avatar
 */
export interface UnlockAvatarInput {
  avatar_code: string;
  avatar_type: AvatarType;
  xp_cost: number;
  source: AvatarSource;
}

/**
 * Input for issuing a certificate
 */
export interface IssueCertificateInput {
  student_id: string;
  title: string;
  description?: string;
  category: CertificateCategory;
  design_template?: CertificateTemplate;
}

/**
 * Input for updating certificate status (viewed/shared)
 */
export interface UpdateCertificateStatusInput {
  certificate_id: string;
  viewed?: boolean;
  shared?: boolean;
}

// ============================================================================
// Dashboard/Summary Types
// ============================================================================

/**
 * Achievement summary for student dashboard
 */
export interface AchievementSummary {
  badges: {
    total: number;
    earned: number;
    recent: BadgeWithStatus[];
  };
  avatars: {
    total: number;
    unlocked: number;
    recent: UserAvatar[];
  };
  certificates: {
    total: number;
    unviewed: number;
    recent: Certificate[];
  };
}

/**
 * Badge progress tracking
 */
export interface BadgeProgress {
  badge_id: string;
  current_value: number;
  target_value: number;
  progress_percentage: number;
}

// ============================================================================
// Service Response Types
// ============================================================================

export interface AchievementServiceResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedAchievementResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  error: string | null;
}
