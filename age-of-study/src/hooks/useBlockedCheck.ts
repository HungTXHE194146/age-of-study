import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { getSupabaseBrowserClient } from '@/lib/supabase';

/**
 * Hook to periodically check if user is blocked and auto-logout
 * Checks every 30 seconds
 */
export function useBlockedCheck() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isAuthenticated || !user) return;

    const checkBlocked = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_blocked')
          .eq('id', user.id)
          .single();

        if (profile?.is_blocked) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          await logout();
          router.push('/blocked');
        }
      } catch (error) {
        console.error('Error checking blocked status:', error);
      }
    };

    // Check immediately on mount (after short delay to avoid initial auth check conflicts)
    const initialTimeout = setTimeout(() => {
      checkBlocked();
    }, 2000);

    // Then check every 30 seconds
    intervalRef.current = setInterval(checkBlocked, 30000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id]); // Only depend on isAuthenticated and user.id
}
