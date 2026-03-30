import { getSupabaseBrowserClient } from './supabase';
import type { Profile } from './supabase';
import type { TierLevel } from './tierSystem';
import { calculateTier, calculateImprovement } from './tierSystem';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  weekly_xp: number;
  monthly_xp: number;
  current_streak: number;
  tier: TierLevel;
  previous_week_xp: number;
  previous_month_xp: number;
  weekly_improvement: number; // percentage
  monthly_improvement: number; // percentage
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time';

/**
 * Get student leaderboard data
 * @param period - Time period for rankings
 * @param limit - Maximum number of results to return
 * @returns Array of leaderboard entries with rankings
 */
export async function getStudentLeaderboard(
  period: LeaderboardPeriod = 'all-time',
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseBrowserClient();
  
  // Determine which XP field to use for sorting
  const xpField = period === 'weekly' 
    ? 'weekly_xp' 
    : period === 'monthly' 
      ? 'monthly_xp' 
      : 'total_xp';
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, total_xp, weekly_xp, monthly_xp, current_streak, tier, previous_week_xp, previous_month_xp')
      .eq('role', 'student')
      .order(xpField, { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    if (!data) return [];

    // Add rank and calculate improvements
    return data.map((entry: any, index: number) => {
      const totalXP = entry.total_xp || 0;
      const weeklyXP = entry.weekly_xp || 0;
      const monthlyXP = entry.monthly_xp || 0;
      const previousWeekXP = entry.previous_week_xp || 0;
      const previousMonthXP = entry.previous_month_xp || 0;

      return {
        rank: index + 1,
        id: entry.id,
        username: entry.username,
        full_name: entry.full_name,
        avatar_url: entry.avatar_url,
        total_xp: totalXP,
        weekly_xp: weeklyXP,
        monthly_xp: monthlyXP,
        current_streak: entry.current_streak || 0,
        tier: entry.tier || calculateTier(totalXP),
        previous_week_xp: previousWeekXP,
        previous_month_xp: previousMonthXP,
        weekly_improvement: calculateImprovement(weeklyXP, previousWeekXP),
        monthly_improvement: calculateImprovement(monthlyXP, previousMonthXP),
      };
    });
  } catch (error) {
    console.error('Unexpected error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Get a specific student's rank in the leaderboard.
 * Uses 2 lightweight DB queries instead of fetching the full leaderboard:
 *   1. Fetch the student's own XP value.
 *   2. COUNT students with higher XP → rank = count + 1.
 *
 * @param studentId - The student's user ID
 * @param period - Time period for ranking
 * @returns The student's rank or null if not found
 */
export async function getStudentRank(
  studentId: string,
  period: LeaderboardPeriod = 'all-time'
): Promise<number | null> {
  const supabase = getSupabaseBrowserClient();
  const xpField = period === 'weekly' ? 'weekly_xp' : period === 'monthly' ? 'monthly_xp' : 'total_xp';

  try {
    // Query 1: Get the student's own XP value (1 row)
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select(`id, ${xpField}`)
      .eq('id', studentId)
      .eq('role', 'student')
      .single();

    if (studentError || !student) return null;

    const studentXP: number = (student as Record<string, number>)[xpField] ?? 0;

    // Query 2: COUNT students with strictly higher XP (1 aggregate row)
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .gt(xpField, studentXP);

    if (countError) return null;

    // rank = number of people ahead + 1
    return (count ?? 0) + 1;
  } catch {
    return null;
  }
}

/**
 * Get teacher analytics data for leaderboard
 */
export async function getTeacherLeaderboardData(filters?: {
  grade?: number;
  subject?: string;
  period?: LeaderboardPeriod;
  limit?: number;
  offset?: number;
}) {
  const supabase = getSupabaseBrowserClient();
  const limit = filters?.limit ?? 200;
  const offset = filters?.offset ?? 0;
  
  try {
    let query = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, total_xp, weekly_xp, current_streak, grade')
      .eq('role', 'student');

    // Apply filters
    if (filters?.grade) {
      query = query.eq('grade', filters.grade);
    }

    // Apply ordering and pagination (server-side)
    const { data, error } = await query
      .order('total_xp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching teacher leaderboard data:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching teacher leaderboard:', error);
    return [];
  }
}
