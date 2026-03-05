/**
 * Re-authentication Hook
 * Yêu cầu MFA verification trước khi thực hiện sensitive actions
 */

'use client'

import { useState } from 'react'
import { VerifyMFAModal } from '@/components/auth/VerifyMFAModal'
import { mfaService } from '@/lib/mfaService'
import { useAuthStore } from '@/store/useAuthStore'

export function useReauth() {
  const [showReauthModal, setShowReauthModal] = useState(false)
  const [reauthResolver, setReauthResolver] = useState<((value: boolean) => void) | null>(null)
  const { user } = useAuthStore()

  /**
   * Require re-authentication before sensitive action
   * Returns true if verified, false if cancelled/failed
   */
  const requireReauth = async (action: string): Promise<boolean> => {
    if (!user) return false

    // Check MFA status
    const { data: mfaStatus } = await mfaService.getMFAStatus(user.id)
    
    // If MFA not enabled, allow action (no extra security needed)
    if (!mfaStatus?.enabled) {
      return true
    }

    // Check if recently re-authenticated (5 minute grace period)
    if (!mfaService.checkReauthRequired()) {
      return true
    }

    // Show MFA modal and wait for verification
    return new Promise<boolean>((resolve) => {
      setReauthResolver(() => resolve)
      setShowReauthModal(true)
    })
  }

  const handleVerify = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Không tìm thấy người dùng' }

    const { data: mfaStatus } = await mfaService.getMFAStatus(user.id)
    const verifiedFactor = mfaStatus?.factors.find(f => f.status === 'verified')
    
    if (!verifiedFactor) {
      return { success: false, error: 'Không tìm thấy 2FA' }
    }

    // Create challenge
    const { data: challenge, error: challengeError } = await mfaService.createChallenge(verifiedFactor.id)
    
    if (challengeError || !challenge) {
      return { success: false, error: challengeError || 'Không thể tạo challenge' }
    }

    // Verify code
    const { success, error } = await mfaService.verifyChallenge(
      verifiedFactor.id,
      challenge.id,
      code
    )

    if (success) {
      // Record successful re-auth
      mfaService.recordReauth(user.id, 'sensitive_action')
      setShowReauthModal(false)
      reauthResolver?.(true)
    }

    return { success, error: error ?? undefined }
  }

  const handleClose = () => {
    setShowReauthModal(false)
    reauthResolver?.(false)
  }

  const ReauthModal = showReauthModal ? (
    <VerifyMFAModal
      title="Xác thực bảo mật"
      description="Vui lòng xác thực để tiếp tục thao tác này"
      onVerify={handleVerify}
      onClose={handleClose}
      canClose={true}
    />
  ) : null

  return {
    requireReauth,
    ReauthModal,
  }
}
