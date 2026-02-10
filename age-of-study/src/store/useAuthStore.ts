import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, type Profile } from '@/lib/supabase'

interface AuthState {
  user: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, role: 'student' | 'teacher') => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  updateUserPoints: (points: number) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, role: 'student' | 'teacher') => {
        set({ isLoading: true })
        try {
          // In a real app, this would be a proper authentication call
          // For now, we'll create a mock user
          const mockUser: Profile = {
            id: Math.random().toString(36).substr(2, 9),
            username,
            role,
            total_points: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          set({ user: mockUser, isAuthenticated: true, isLoading: false })
        } catch (error) {
          console.error('Login error:', error)
          set({ isLoading: false })
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
      },

      checkAuth: async () => {
        // Check if user exists in localStorage
        const user = get().user
        if (user) {
          set({ isAuthenticated: true, isLoading: false })
        } else {
          set({ isLoading: false })
        }
      },

      updateUserPoints: (points: number) => {
        const user = get().user
        if (user) {
          const updatedUser = { ...user, total_points: user.total_points + points }
          set({ user: updatedUser })
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)