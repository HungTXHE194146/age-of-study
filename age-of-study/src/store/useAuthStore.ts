import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSupabaseBrowserClient, type Profile } from '@/lib/supabase'
import { mfaService } from '@/lib/mfaService'

interface MFAChallenge {
  factorId: string
  challengeId: string
  userId: string
}

interface AuthState {
  user: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  mfaChallenge: MFAChallenge | null
  requiresMFA: boolean
  login: (username: string, password: string) => Promise<void>
  verifyMFA: (code: string) => Promise<boolean>
  signUp: (username: string, password: string, fullName: string) => Promise<void>  // Removed email param
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateUserXP: (xp: number) => void
  clearError: () => void
  clearMFAChallenge: () => void
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
      mfaChallenge: null,
      requiresMFA: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null, requiresMFA: false, mfaChallenge: null })
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

          // ✅ Check if user is blocked
          if (profile.is_blocked) {
            // Sign out immediately
            await supabase.auth.signOut()
            throw new Error('ACCOUNT_BLOCKED')
          }

          // ✅ Check if MFA is enabled
          if (profile.mfa_enabled) {
            // Get MFA factors
            const { data: factors } = await mfaService.listFactors()
            const verifiedFactor = factors.find(f => f.status === 'verified')
            
            if (verifiedFactor) {
              // Create MFA challenge
              const { data: challenge, error: challengeError } = await mfaService.createChallenge(verifiedFactor.id)
              
              if (challengeError || !challenge) {
                throw new Error('Không thể tạo xác thực 2FA')
              }
              
              // Store challenge info and require MFA verification
              set({
                isLoading: false,
                requiresMFA: true,
                mfaChallenge: {
                  factorId: verifiedFactor.id,
                  challengeId: challenge.id,
                  userId: authData.user.id,
                },
                error: null,
              })
              return
            }
          }

          // No MFA or not enrolled → Complete login
          supabase
            .from('profiles')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', authData.user.id)
            .then(({ error }: { error: any }) => {
              if (error) console.warn('Failed to update last_active_at:', error.message)
            })
          
          set({ user: profile, isAuthenticated: true, isLoading: false, requiresMFA: false })
        } catch (error: unknown) {
          console.error('Login error:', error)
          
          // Handle blocked account with specific message
          if (error instanceof Error && error.message === 'ACCOUNT_BLOCKED') {
            set({ 
              error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ giáo viên để được hỗ trợ.',
              isLoading: false,
              isAuthenticated: false,
              user: null,
              requiresMFA: false,
            })
          } else {
            set({ 
              error: error instanceof Error ? error.message : 'Tên đăng nhập hoặc mật khẩu không đúng', 
              isLoading: false,
              isAuthenticated: false,
              user: null,
              requiresMFA: false,
            })
          }
        }
      },

      verifyMFA: async (code: string): Promise<boolean> => {
        const { mfaChallenge } = get()
        if (!mfaChallenge) return false

        set({ isLoading: true, error: null })

        try {
          const supabase = getSupabaseBrowserClient()
          
          // Verify MFA code
          const { success, error } = await mfaService.verifyChallenge(
            mfaChallenge.factorId,
            mfaChallenge.challengeId,
            code
          )

          if (!success) {
            set({ 
              error: error || 'Mã OTP không đúng', 
              isLoading: false 
            })
            return false
          }

          // Get profile after successful MFA
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', mfaChallenge.userId)
            .single()

          if (profileError || !profile) {
            set({ 
              error: 'Không thể tải thông tin người dùng', 
              isLoading: false 
            })
            return false
          }

          // Update last_active_at
          supabase
            .from('profiles')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', mfaChallenge.userId)
            .then(({ error }: { error: any }) => {
              if (error) console.warn('Failed to update last_active_at:', error.message)
            })

          // Complete login
          set({ 
            user: profile, 
            isAuthenticated: true, 
            isLoading: false,
            requiresMFA: false,
            mfaChallenge: null,
            error: null,
          })

          return true
        } catch (error) {
          console.error('MFA verification error:', error)
          set({ 
            error: 'Có lỗi xảy ra khi xác thực', 
            isLoading: false 
          })
          return false
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

            // ✅ Check if user is blocked - auto logout
            if (profile.is_blocked) {
              await supabase.auth.signOut()
              set({ user: null, isAuthenticated: false, isLoading: false })
              
              // Redirect to blocked page
              if (typeof window !== 'undefined') {
                window.location.href = '/blocked'
              }
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
      },

      clearMFAChallenge: () => {
        set({ requiresMFA: false, mfaChallenge: null, error: null })
      },
    }),
    {
      name: 'auth-storage',
      // Only persist user profile, not Supabase session (Supabase manages session via cookies)
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
)