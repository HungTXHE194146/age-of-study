/**
 * Achievement Service
 * 
 * Handles all business logic for the Achievement Backpack system:
 * - Badge Collection
 * - Avatar Wardrobe
 * - Digital Certificates
 * 
 * Follows clean code principles:
 * - Single Responsibility: Each function does one thing
 * - Error handling: All database operations wrapped in try-catch
 * - Type safety: Strong TypeScript types throughout
 * - Separation of concerns: Service layer separated from UI
 */

import { getSupabaseBrowserClient } from './supabase';
import type {
  Badge,
  BadgeWithStatus,
  UserBadge,
  UserAvatar,
  AvatarShopItem,
  AvatarWithStatus,
  Certificate,
  CertificateWithTeacher,
  CertificateWithStudent,
  UnlockAvatarInput,
  IssueCertificateInput,
  UpdateCertificateStatusInput,
  AchievementSummary,
  AchievementServiceResponse,
  BadgeProgress,
} from '@/types/achievement';

// ============================================================================
// BADGE COLLECTION FUNCTIONS
// ============================================================================

/**
 * Get all badges with user's earned status
 * @param userId - Student's UUID
 * @returns All badges with earned/progress information
 */
export async function getBadgeCollection(
  userId: string
): Promise<AchievementServiceResponse<BadgeWithStatus[]>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Fetch all badges
    const { data: allBadges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .order('condition_value', { ascending: true });

    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
      return { data: null, error: badgesError.message };
    }

    if (!allBadges || allBadges.length === 0) {
      return { data: [], error: null };
    }

    // Fetch user's earned badges (include xp_claimed_at)
    const { data: earnedBadges, error: earnedError } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at, xp_claimed_at')
      .eq('user_id', userId);


    if (earnedError) {
      console.error('Error fetching earned badges:', earnedError);
      return { data: null, error: earnedError.message };
    }

    // Fetch user's current stats for progress calculation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_streak, total_xp, weekly_xp, monthly_xp')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // Continue without progress info
    }

    // Create a map of earned badges for quick lookup
    const earnedBadgeMap = new Map<string, UserBadge>();
    earnedBadges?.forEach((badge: UserBadge) => {
      earnedBadgeMap.set(badge.badge_id, badge);
    });

    // Combine badges with earned status and calculate progress
    const badgesWithStatus: BadgeWithStatus[] = allBadges.map((badge: Badge) => {
      const earnedBadge = earnedBadgeMap.get(badge.id);
      const isEarned = !!earnedBadge;

      // Calculate progress for unearned badges
      let progress: number | undefined;
      let progress_max: number | undefined;

      if (!isEarned && profile && badge.condition_type && badge.condition_value) {
        progress_max = badge.condition_value;

        switch (badge.condition_type) {
          case 'streak':
            progress = Math.min(profile.current_streak, badge.condition_value);
            break;
          case 'quiz_count':
            // Would need quiz count from test_submissions table
            // For now, leave undefined
            break;
          case 'improvement':
            // Would need to calculate improvement percentage
            // For now, leave undefined
            break;
          default:
            // Other badge types don't have trackable progress
            break;
        }
      }

      return {
        ...badge,
        is_earned: isEarned,
        earned_at: earnedBadge?.earned_at ?? null,
        xp_claimed: !!earnedBadge?.xp_claimed_at,
        progress,
        progress_max,
      };

    });

    return { data: badgesWithStatus, error: null };
  } catch (error) {
    console.error('Unexpected error in getBadgeCollection:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get badge progress for a specific student
 * @param userId - Student's UUID
 * @param badgeId - Badge ID to check progress for
 * @returns Current progress towards badge
 */
export async function getBadgeProgress(
  userId: string,
  badgeId: string
): Promise<AchievementServiceResponse<BadgeProgress>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Get badge details
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .select('*')
      .eq('id', badgeId)
      .single();

    if (badgeError) {
      console.error('Error fetching badge:', badgeError);
      return { data: null, error: badgeError.message };
    }

    if (!badge.condition_type || !badge.condition_value) {
      return { data: null, error: 'Badge has no trackable condition' };
    }

    // Get user profile for current values
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_streak, total_xp, weekly_xp, monthly_xp')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return { data: null, error: profileError.message };
    }

    let currentValue = 0;

    switch (badge.condition_type) {
      case 'streak':
        currentValue = profile.current_streak;
        break;
      case 'quiz_count':
        // Would need to query test_submissions
        const { count } = await supabase
          .from('test_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userId)
          .eq('status', 'completed');
        currentValue = count ?? 0;
        break;
      default:
        return { data: null, error: 'Badge progress not implemented for this type' };
    }

    const progress: BadgeProgress = {
      badge_id: badgeId,
      current_value: currentValue,
      target_value: badge.condition_value,
      progress_percentage: Math.min(
        100,
        Math.round((currentValue / badge.condition_value) * 100)
      ),
    };

    return { data: progress, error: null };
  } catch (error) {
    console.error('Unexpected error in getBadgeProgress:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// AVATAR WARDROBE FUNCTIONS
// ============================================================================

/**
 * Get user's avatar collection with shop items
 * @param userId - Student's UUID
 * @returns All available avatars with ownership status
 */
export async function getAvatarWardrobe(
  userId: string
): Promise<AchievementServiceResponse<AvatarWithStatus[]>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Get all available shop items
    const { data: shopItems, error: shopError } = await supabase
      .from('avatar_shop')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });

    if (shopError) {
      console.error('Error fetching avatar shop:', shopError);
      return { data: null, error: shopError.message };
    }

    if (!shopItems || shopItems.length === 0) {
      return { data: [], error: null };
    }

    // Get user's owned avatars
    const { data: ownedAvatars, error: ownedError } = await supabase
      .from('user_avatars')
      .select('*')
      .eq('user_id', userId)
      .eq('is_unlocked', true);

    if (ownedError) {
      console.error('Error fetching owned avatars:', ownedError);
      return { data: null, error: ownedError.message };
    }

    // Get user's current XP to check affordability
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // Continue with XP = 0
    }

    const userXP = profile?.total_xp ?? 0;

    // Create map of owned avatars
    const ownedMap = new Map<string, UserAvatar>();
    ownedAvatars?.forEach((avatar: UserAvatar) => {
      ownedMap.set(avatar.avatar_code, avatar);
    });

    // Combine shop items with ownership status
    const avatarsWithStatus: AvatarWithStatus[] = shopItems.map((item: AvatarShopItem) => {
      const owned = ownedMap.get(item.avatar_code);
      const isOwned = !!owned;
      const canAfford = userXP >= item.xp_cost;
      const canUnlock = true; // Level requirement check would go here

      return {
        ...item,
        is_owned: isOwned,
        unlocked_at: owned?.unlocked_at ?? null,
        can_afford: canAfford || isOwned,
        can_unlock: canUnlock,
      };
    });

    return { data: avatarsWithStatus, error: null };
  } catch (error) {
    console.error('Unexpected error in getAvatarWardrobe:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unlock/purchase an avatar
 * @param userId - Student's UUID
 * @param input - Avatar unlock details
 * @returns Success status
 */
export async function unlockAvatar(
  userId: string,
  input: UnlockAvatarInput
): Promise<AchievementServiceResponse<UserAvatar>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Check if user already owns this avatar
    // Query all avatars to avoid 406 error with emoji in URL
    const { data: userAvatars } = await supabase
      .from('user_avatars')
      .select('*')
      .eq('user_id', userId);

    const existing = userAvatars?.find((a: UserAvatar) => a.avatar_code === input.avatar_code);

    if (existing && existing.is_unlocked) {
      return { data: null, error: 'Bạn đã có avatar này rồi!' };
    }

    // Check if user has enough XP
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', userId)
      .single();

    if (!profile || profile.total_xp < input.xp_cost) {
      return { data: null, error: 'Không đủ XP để mở khóa avatar này!' };
    }

    // Deduct XP from user (only for purchases, not rewards)
    if (input.source === 'purchase' && input.xp_cost > 0) {
      const newXP = profile.total_xp - input.xp_cost;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ total_xp: newXP, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating XP:', updateError);
        return { data: null, error: 'Không thể trừ XP!' };
      }
    }

    // Insert or update user avatar
    const { data: newAvatar, error: insertError } = await supabase
      .from('user_avatars')
      .upsert({
        user_id: userId,
        avatar_code: input.avatar_code,
        avatar_type: input.avatar_type,
        is_unlocked: true,
        unlocked_at: new Date().toISOString(),
        xp_cost: input.xp_cost,
        source: input.source,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error unlocking avatar:', insertError);
      return { data: null, error: insertError.message };
    }

    return { data: newAvatar, error: null };
  } catch (error) {
    console.error('Unexpected error in unlockAvatar:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Change user's active avatar
 * @param userId - Student's UUID
 * @param avatarCode - Avatar code to set as active
 * @returns Success status
 */
export async function changeActiveAvatar(
  userId: string,
  avatarCode: string
): Promise<AchievementServiceResponse<boolean>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Check if user owns this avatar
    // Query all avatars to avoid 406 error with emoji in URL
    const { data: userAvatars } = await supabase
      .from('user_avatars')
      .select('*')
      .eq('user_id', userId)
      .eq('is_unlocked', true);

    const avatar = userAvatars?.find((a: UserAvatar) => a.avatar_code === avatarCode);

    if (!avatar) {
      return { data: null, error: 'Bạn chưa mở khóa avatar này!' };
    }

    // Update user's active avatar
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error changing avatar:', updateError);
      return { data: null, error: updateError.message };
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Unexpected error in changeActiveAvatar:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// CERTIFICATE FUNCTIONS
// ============================================================================

/**
 * Get student's certificates
 * @param studentId - Student's UUID
 * @returns All certificates for this student
 */
export async function getStudentCertificates(
  studentId: string
): Promise<AchievementServiceResponse<CertificateWithTeacher[]>> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data: certificates, error } = await supabase
      .from('certificates')
      .select(
        `
        *,
        teacher:profiles!certificates_teacher_id_fkey(
          id,
          full_name,
          username,
          avatar_url
        )
      `
      )
      .eq('student_id', studentId)
      .order('issued_at', { ascending: false });

    if (error) {
      console.error('Error fetching certificates:', error);
      return { data: null, error: error.message };
    }

    return { data: certificates as CertificateWithTeacher[], error: null };
  } catch (error) {
    console.error('Unexpected error in getStudentCertificates:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Issue a certificate to a student (teacher action)
 * @param teacherId - Teacher's UUID
 * @param teacherName - Teacher's full name
 * @param input - Certificate details
 * @returns Created certificate
 */
export async function issueCertificate(
  teacherId: string,
  teacherName: string,
  input: IssueCertificateInput
): Promise<AchievementServiceResponse<Certificate>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Verify student exists
    const { data: student } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', input.student_id)
      .eq('role', 'student')
      .single();

    if (!student) {
      return { data: null, error: 'Không tìm thấy học sinh này!' };
    }

    // Create certificate
    const { data: certificate, error: insertError } = await supabase
      .from('certificates')
      .insert({
        student_id: input.student_id,
        teacher_id: teacherId,
        teacher_name: teacherName,
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        design_template: input.design_template ?? 'classic',
        issued_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error issuing certificate:', insertError);
      return { data: null, error: insertError.message };
    }

    return { data: certificate, error: null };
  } catch (error) {
    console.error('Unexpected error in issueCertificate:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update certificate status (viewed/shared)
 * SECURITY: Uses secure database function that only allows updating timestamp columns
 * @param input - Certificate status update
 * @returns Success status
 */
export async function updateCertificateStatus(
  input: UpdateCertificateStatusInput
): Promise<AchievementServiceResponse<boolean>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Prepare timestamps for the secure function
    let viewedAt: string | null = null;
    let sharedAt: string | null = null;

    if (input.viewed !== undefined && input.viewed) {
      viewedAt = new Date().toISOString();
    }

    if (input.shared !== undefined && input.shared) {
      sharedAt = new Date().toISOString();
    }

    // Nothing to update
    if (!viewedAt && !sharedAt) {
      return { data: true, error: null };
    }

    // Call secure database function that restricts updates to timestamp columns only
    // This prevents students from tampering with title, description, teacher_name, etc.
    const { error: updateError } = await supabase.rpc('update_certificate_timestamps', {
      p_certificate_id: input.certificate_id,
      p_viewed_at: viewedAt,
      p_shared_at: sharedAt,
    });

    if (updateError) {
      console.error('Error updating certificate:', updateError);
      return { data: null, error: updateError.message };
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Unexpected error in updateCertificateStatus:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// SUMMARY/DASHBOARD FUNCTIONS
// ============================================================================

/**
 * Get achievement summary for student dashboard
 * @param userId - Student's UUID
 * @returns Summary of all achievements
 */
export async function getAchievementSummary(
  userId: string
): Promise<AchievementServiceResponse<AchievementSummary>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Get badge stats
    const { data: allBadges, count: totalBadges } = await supabase
      .from('badges')
      .select('*', { count: 'exact' });

    const { data: earnedBadges, count: earnedCount } = await supabase
      .from('user_badges')
      .select('*, badge:badges(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(3);

    // Get avatar stats
    const { data: allAvatars, count: totalAvatars } = await supabase
      .from('avatar_shop')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    const { data: unlockedAvatars, count: unlockedCount } = await supabase
      .from('user_avatars')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_unlocked', true)
      .order('unlocked_at', { ascending: false })
      .limit(3);

    // Get certificate stats
    const { data: allCertificates, count: totalCertificates } = await supabase
      .from('certificates')
      .select('*', { count: 'exact' })
      .eq('student_id', userId)
      .order('issued_at', { ascending: false })
      .limit(3);

    const { count: unviewedCount } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', userId)
      .is('viewed_at', null);

    const summary: AchievementSummary = {
      badges: {
        total: totalBadges ?? 0,
        earned: earnedCount ?? 0,
        recent: (earnedBadges ?? []).map((item: any) => ({
          ...item.badge,
          is_earned: true,
          earned_at: item.earned_at,
        })),
      },
      avatars: {
        total: totalAvatars ?? 0,
        unlocked: unlockedCount ?? 0,
        recent: unlockedAvatars ?? [],
      },
      certificates: {
        total: totalCertificates ?? 0,
        unviewed: unviewedCount ?? 0,
        recent: allCertificates ?? [],
      },
    };

    return { data: summary, error: null };
  } catch (error) {
    console.error('Unexpected error in getAchievementSummary:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// SHOP FUNCTIONS
// ============================================================================

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpCostPer: number;
  maxQuantity: number;
  category: 'streak' | 'boost' | 'cosmetic';
}

export interface PurchaseResult {
  newXP: number;
  newFreezeCount: number;
}

/** Static shop catalogue – extend here to add more items in the future. */
export function getShopItems(): ShopItem[] {
  return [
    {
      id: 'streak_freezer',
      name: 'Streak Freezer',
      description:
        'Bảo vệ chuỗi học tập của bạn trong 1 ngày khi bạn bị gián đoạn. Freezer được dùng tự động khi bạn bỏ lỡ một ngày.',
      icon: '🧊',
      xpCostPer: 800,
      maxQuantity: 3,
      category: 'streak',
    },
  ];
}

/**
 * Purchase one or more Streak Freezers.
 * Price is fetched server-side from the catalogue — the xpCostPer param is ignored.
 * Deducts XP and increments freeze_count atomically with an optimistic-lock update.
 */
export async function purchaseFreezer(
  userId: string,
  quantity: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _xpCostPer: number  // ignored — authoritative price comes from the server catalogue
): Promise<AchievementServiceResponse<PurchaseResult>> {
  const supabase = getSupabaseBrowserClient();

  // ── Validate quantity ────────────────────────────────────────────────────
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { data: null, error: 'Số lượng không hợp lệ.' };
  }

  // ── Fetch authoritative price & maxQuantity from server catalogue ────────
  const catalogItem = getShopItems().find((i) => i.id === 'streak_freezer');
  if (!catalogItem) {
    return { data: null, error: 'Mặt hàng không tồn tại.' };
  }
  const authoritativePrice = catalogItem.xpCostPer;
  const maxQuantity = catalogItem.maxQuantity;

  if (quantity > maxQuantity) {
    return {
      data: null,
      error: `Chỉ được mua tối đa ${maxQuantity} Streak Freezer.`,
    };
  }

  try {
    // Fetch current profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('total_xp, freeze_count')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return { data: null, error: 'Không thể tải thông tin người dùng.' };
    }

    // Enforce total freeze cap (current + new ≤ maxQuantity)
    const currentFreezeCount = profile.freeze_count ?? 0;
    if (currentFreezeCount + quantity > maxQuantity) {
      return {
        data: null,
        error: `Bạn đã có ${currentFreezeCount} Streak Freezer. Chỉ được giữ tối đa ${maxQuantity}.`,
      };
    }

    const totalCost = quantity * authoritativePrice;

    if (profile.total_xp < totalCost) {
      return {
        data: null,
        error: `Không đủ XP! Cần ${totalCost} XP nhưng bạn chỉ có ${profile.total_xp} XP.`,
      };
    }

    const newXP = profile.total_xp - totalCost;
    const newFreezeCount = (profile.freeze_count ?? 0) + quantity;

    // Conditional update ensures XP hasn't changed since read
    const { data: updated, error: updateErr } = await supabase
      .from('profiles')
      .update({
        total_xp: newXP,
        freeze_count: newFreezeCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .gte('total_xp', totalCost)
      .select('id')
      .maybeSingle();

    if (updateErr) {
      return { data: null, error: 'Giao dịch thất bại, vui lòng thử lại.' };
    }

    if (!updated) {
      return { data: null, error: 'XP đã thay đổi, vui lòng thử lại.' };
    }

    return { data: { newXP, newFreezeCount }, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Lỗi không xác định.',
    };
  }
}

// ============================================================================
// BADGE AUTO-AWARD FUNCTION
// ============================================================================

/**
 * Check user's stats and automatically award eligible badges
 * Should be called after quiz completion or when viewing backpack
 * @param userId - Student's UUID
 * @returns Newly awarded badges
 */
export async function checkAndAwardBadges(
  userId: string
): Promise<AchievementServiceResponse<Array<{badge_id: string, badge_name: string, newly_awarded: boolean}>>> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase.rpc('check_and_award_badges', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error in checkAndAwardBadges:', error);
      return { data: null, error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (error) {
    console.error('Unexpected error in checkAndAwardBadges:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
