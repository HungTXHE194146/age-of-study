/**
 * MFA Service - Two-Factor Authentication Management
 * Sử dụng Supabase Auth MFA (TOTP-based)
 */

import { getSupabaseBrowserClient } from './supabase'
import type {
  MFAEnrollmentResponse,
  MFAFactor,
  MFAChallengeResponse,
  MFAStatus,
  ReauthSession,
} from '@/types/mfa'
import { REAUTH_GRACE_PERIOD_MS } from '@/types/mfa'

export class MFAService {
  private supabase = getSupabaseBrowserClient()
  private readonly REAUTH_KEY = 'mfa_reauth_session'

  /**
   * Enroll 2FA - Tạo secret key và QR code
   */
  async enroll(userId: string): Promise<{ data: MFAEnrollmentResponse | null; error: string | null }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      if (userError || !user) {
        return { data: null, error: 'Không tìm thấy người dùng' }
      }

      if (user.id !== userId) {
        return { data: null, error: 'Unauthorized' }
      }

      // Cleanup existing unverified factors to prevent "Factor already exists" error
      const { data: factorsResp } = await this.supabase.auth.mfa.listFactors()
      const existingFactors = factorsResp?.factors || []
      
      for (const factor of existingFactors) {
        if (factor.status === 'unverified' && factor.friendlyName?.startsWith('Authenticator App')) {
          await this.supabase.auth.mfa.unenroll({ factorId: factor.id })
        }
      }

      // Enroll TOTP with unique friendlyName to bypass the unique constraint error
      const { data, error } = await this.supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Authenticator App ${new Date().getTime()}`,
      })

      if (error) {
        console.error('MFA enrollment error:', error)
        return { data: null, error: error.message }
      }

      return { data: data as MFAEnrollmentResponse, error: null }
    } catch (error) {
      console.error('MFA enroll exception:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi khởi tạo 2FA' 
      }
    }
  }

  /**
   * Verify Enrollment - Xác nhận OTP đầu tiên sau khi quét QR
   */
  async verifyEnrollment(
    factorId: string,
    code: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data, error } = await this.supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      })

      if (error) {
        console.error('MFA verify enrollment error:', error)
        return { success: false, error: 'Mã OTP không đúng. Vui lòng thử lại.' }
      }

      // Update profile mfa_enabled
      const { data: { user } } = await this.supabase.auth.getUser()
      if (user) {
        const { error: updateError } = await this.supabase
          .from('profiles')
          .update({
            mfa_enabled: true,
            mfa_enrolled_at: new Date().toISOString(),
          })
          .eq('id', user.id)
        
        if (updateError) {
          console.error('Failed to update profile MFA status:', updateError)
          // MFA is still enabled in Auth, consider returning a warning
        }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('MFA verify enrollment exception:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
      }
    }
  }

  /**
   * Create Challenge - Tạo challenge khi login (yêu cầu OTP)
   */
  async createChallenge(
    factorId: string
  ): Promise<{ data: MFAChallengeResponse | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase.auth.mfa.challenge({ factorId })

      if (error) {
        console.error('MFA challenge error:', error)
        return { data: null, error: error.message }
      }

      return { data: data as MFAChallengeResponse, error: null }
    } catch (error) {
      console.error('MFA challenge exception:', error)
      return { data: null, error: 'Có lỗi xảy ra khi tạo challenge' }
    }
  }

  /**
   * Verify Challenge - Verify OTP khi login
   */
  async verifyChallenge(
    factorId: string,
    challengeId: string,
    code: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data, error } = await this.supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      })

      if (error) {
        console.error('MFA verify challenge error:', error)
        return { success: false, error: 'Mã OTP không đúng. Vui lòng thử lại.' }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('MFA verify challenge exception:', error)
      return { success: false, error: 'Có lỗi xảy ra' }
    }
  }

  /**
   * Get MFA Status - Check xem user đã enable MFA chưa
   */
  async getMFAStatus(userId: string): Promise<{ data: MFAStatus | null; error: string | null }> {
    try {
      // Get from database
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('mfa_enabled, mfa_enrolled_at')
        .eq('id', userId)
        .single()

      if (profileError) {
        return { data: null, error: profileError.message }
      }

      const authFactorsResp = await this.supabase.auth.mfa.listFactors();
      const factors = authFactorsResp.data?.factors || [];

      console.log('[DEBUG MFA getMFAStatus]', {
        profile,
        authFactorsResp,
        factors
      });

      return {
        data: {
          enabled: profile.mfa_enabled || false,
          enrolled_at: profile.mfa_enrolled_at,
          factors: factors as MFAFactor[],
        },
        error: null,
      }
    } catch (error) {
      console.error('Get MFA status exception:', error)
      return { data: null, error: 'Có lỗi xảy ra' }
    }
  }

  /**
   * List Factors - Lấy danh sách factors đã enroll
   */
  async listFactors(): Promise<{ data: MFAFactor[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase.auth.mfa.listFactors()

      if (error) {
        return { data: [], error: error.message }
      }

      return { data: (data?.factors || []) as MFAFactor[], error: null }
    } catch (error) {
      console.error('List factors exception:', error)
      return { data: [], error: 'Có lỗi xảy ra' }
    }
  }

  /**
   * Unenroll - Tắt 2FA (cần verify password trước)
   */
  async unenroll(
    factorId: string,
    password: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Verify password first (bảo mật)
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user?.email) {
        return { success: false, error: 'Không tìm thấy người dùng' }
      }

      let targetFactorId = factorId;
      
      // Fetch the available factors BEFORE re-authenticating,
      // because signInWithPassword will downgrade the session to AAL1
      // and cause listFactors() to return an empty array if AAL2 is not verified.
      if (!targetFactorId) {
        const authFactorsResp = await this.supabase.auth.mfa.listFactors()
        const factors = authFactorsResp.data?.factors || []
        
        if (factors.length > 0) {
          targetFactorId = factors[0].id
        } else {
          // No factors in Auth, but we are asked to unenroll.
          
          if (user) {
            await this.supabase
              .from('profiles')
              .update({
                mfa_enabled: false,
                mfa_enrolled_at: null,
              })
              .eq('id', user.id)
          }
          return { success: true, error: null }
        }
      }

      // Re-authenticate với password
      const { error: signInError } = await this.supabase.auth.signInWithPassword({
        email: user.email,
        password,
      })

      if (signInError) {
        return { success: false, error: 'Mật khẩu không đúng' }
      }

      // Unenroll factor
      const { error } = await this.supabase.auth.mfa.unenroll({ factorId: targetFactorId })

      if (error) {
        console.error('MFA unenroll error:', error)
        return { success: false, error: error.message }
      }

      // Update profile
      if (user) {
        const { error: updateError } = await this.supabase
          .from('profiles')
          .update({
            mfa_enabled: false,
            mfa_enrolled_at: null,
          })
          .eq('id', user.id)
        
        if (updateError) {
          console.error('Failed to update profile after MFA unenroll:', updateError)
        }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('MFA unenroll exception:', error)
      return { success: false, error: 'Có lỗi xảy ra' }
    }
  }

  /**
   * Check if Re-authentication is Required
   * Dùng cho sensitive actions (system settings, user management)
   */
  checkReauthRequired(): boolean {
    try {
      const sessionStr = sessionStorage.getItem(this.REAUTH_KEY)
      if (!sessionStr) return true

      const session: ReauthSession = JSON.parse(sessionStr)
      const elapsed = Date.now() - session.timestamp

      return elapsed > REAUTH_GRACE_PERIOD_MS
    } catch {
      return true
    }
  }

  /**
   * Record Re-authentication
   * Gọi sau khi user verify OTP thành công cho sensitive action
   */
  recordReauth(userId: string, action: string): void {
    const session: ReauthSession = {
      userId,
      timestamp: Date.now(),
      action,
    }
    sessionStorage.setItem(this.REAUTH_KEY, JSON.stringify(session))
  }

  /**
   * Clear Re-auth Session
   */
  clearReauthSession(): void {
    sessionStorage.removeItem(this.REAUTH_KEY)
  }
}

// Singleton instance
export const mfaService = new MFAService()
