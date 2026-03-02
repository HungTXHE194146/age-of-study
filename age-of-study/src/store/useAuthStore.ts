import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSupabaseBrowserClient, type Profile } from '@/lib/supabase'

interface AuthState {
  user: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  signUp: (username: string, password: string, fullName: string) => Promise<void>  // Removed email param
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateUserXP: (xp: number) => void
  clearError: () => void
}

// Track if checkAuth is currently running to prevent concurrent calls
let checkAuthPromise: Promise<void> | null = null

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabaseBrowserClient()
          
          // Tạo email giả từ username
          const fakeEmail = `${username.toLowerCase().trim()}@ageofstudy.local`
          
          // Sign in với Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: fakeEmail,
            password,
          })

          if (authError) throw new Error('Tên đăng nhập hoặc mật khẩu không đúng')
          if (!authData.user) throw new Error('Đăng nhập thất bại')

          // Lấy profile từ database
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single()

          if (profileError || !profile) throw new Error('Không tìm thấy thông tin người dùng')

          // Update last_active_at on login
          supabase
            .from('profiles')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', authData.user.id)
            .then(({ error }: { error: any }) => {
              if (error) console.warn('Failed to update last_active_at:', error.message)
            })
          set({ user: profile, isAuthenticated: true, isLoading: false })
        } catch (error: unknown) {
          console.error('Login error:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Tên đăng nhập hoặc mật khẩu không đúng', 
            isLoading: false,
            isAuthenticated: false,
            user: null
          })
        }
      },

      signUp: async (username: string, password: string, fullName: string) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabaseBrowserClient()
          
          // Tạo email giả từ username
          const fakeEmail = `${username.toLowerCase().trim()}@ageofstudy.local`
          
          // Sign up với Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: fakeEmail,
            password,
            options: {
              data: {
                username,
                full_name: fullName,
              }
            }
          })

          if (authError) {
            console.error('Sign up error:', authError)
            throw new Error('Đăng ký thất bại. Vui lòng thử lại.')
          }
          if (!authData.user) throw new Error('Đăng ký thất bại')

          set({ isLoading: false })
        } catch (error: unknown) {
          console.error('Sign up error:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Đăng ký thất bại. Vui lòng thử lại.', 
            isLoading: false 
          })
          throw error
        }
      },

      logout: async () => {
        try {
          const supabase = getSupabaseBrowserClient()
          await supabase.auth.signOut()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({ user: null, isAuthenticated: false, error: null })
        }
      },

      checkAuth: async () => {
        // If checkAuth is already running, return the existing promise
        if (checkAuthPromise) {
          return checkAuthPromise
        }

        checkAuthPromise = (async () => {
          set({ isLoading: true })
          try {
            const supabase = getSupabaseBrowserClient()
            
            // Check if user is authenticated
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

            if (authError || !authUser) {
              set({ user: null, isAuthenticated: false, isLoading: false })
              return
            }

            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authUser.id)
              .single()

            if (profileError || !profile) {
              set({ user: null, isAuthenticated: false, isLoading: false })
              return
            }

            set({ user: profile, isAuthenticated: true, isLoading: false })
            // Fire-and-forget: update last_active_at for real activity tracking
            supabase
              .from('profiles')
              .update({ last_active_at: new Date().toISOString() })
              .eq('id', authUser.id)
              .then(({ error }: { error: any }) => {
                if (error) console.warn('Failed to update last_active_at:', error.message)
              })          } catch (error) {
            console.error('Check auth error:', error)
            set({ user: null, isAuthenticated: false, isLoading: false })
          } finally {
            // Clear the promise after completion
            checkAuthPromise = null
          }
        })()

        return checkAuthPromise
      },

      // NOTE: This is an optimistic local update only.
      // XP changes are persisted to the backend separately (e.g., after completing exercises).
      // The checkAuth method will sync the canonical XP value from the DB on page load/refresh.
      updateUserXP: (xp: number) => {
        const user = get().user
        if (user) {
          const currentXP = typeof user.total_xp === 'number' ? user.total_xp : 0
          const updatedUser = { ...user, total_xp: currentXP + xp }
          set({ user: updatedUser })
        }
      },

      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'auth-storage',
      // Only persist user profile, not Supabase session (Supabase manages session via cookies)
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
)