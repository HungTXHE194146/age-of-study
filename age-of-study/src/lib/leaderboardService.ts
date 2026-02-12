import { getSupabaseBrowserClient } from './supabase';
import type { Profile } from './supabase';

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
      .select('id, username, full_name, avatar_url, total_xp, weekly_xp, monthly_xp, current_streak')
      .eq('role', 'student')
      .order(xpField, { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    if (!data) return [];

    // Add rank to each entry
    return data.map((entry: any, index: number) => ({
      rank: index + 1,
      id: entry.id,
      username: entry.username,
      full_name: entry.full_name,
      avatar_url: entry.avatar_url,
      total_xp: entry.total_xp || 0,
      weekly_xp: entry.weekly_xp || 0,
      monthly_xp: entry.monthly_xp || 0,
      current_streak: entry.current_streak || 0,
    }));
  } catch (error) {
    console.error('Unexpected error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Get a specific student's rank in the leaderboard
 * @param studentId - The student's user ID
 * @param period - Time period for ranking
 * @returns The student's rank or null if not found
 */
export async function getStudentRank(
  studentId: string,
  period: LeaderboardPeriod = 'all-time'
): Promise<number | null> {
  const leaderboard = await getStudentLeaderboard(period, 1000); // Get more entries to find rank
  const entry = leaderboard.find(e => e.id === studentId);
  return entry ? entry.rank : null;
}

/**
 * Get teacher analytics data for leaderboard
 */
export async function getTeacherLeaderboardData(filters?: {
  grade?: number;
  subject?: string;
  period?: LeaderboardPeriod;
}) {
  const supabase = getSupabaseBrowserClient();
  
  try {
    let query = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, total_xp, weekly_xp, current_streak, grade')
      .eq('role', 'student');

    // Apply filters
    if (filters?.grade) {
      query = query.eq('grade', filters.grade);
    }

    const { data, error } = await query.order('total_xp', { ascending: false });

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
