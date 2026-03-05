/**
 * MFA (Multi-Factor Authentication) Type Definitions
 */

export interface MFAEnrollmentResponse {
  id: string
  type: 'totp'
  totp: {
    qr_code: string // Data URL for QR code
    secret: string  // Secret key for manual entry
    uri: string     // otpauth:// URI
  }
}

export interface MFAFactor {
  id: string
  type: 'totp'
  friendly_name?: string
  status: 'verified' | 'unverified'
  created_at: string
  updated_at: string
}

export interface MFAChallengeResponse {
  id: string
  type: 'totp'
  expires_at: number
}

export interface MFAVerifyResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  user: any
}

export interface BackupCode {
  code: string
  used: boolean
  used_at?: string
}

export interface MFAStatus {
  enabled: boolean
  enrolled_at?: string
  factors: MFAFactor[]
}

// Re-authentication session tracking
export interface ReauthSession {
  userId: string
  timestamp: number
  action: string
}

export const REAUTH_GRACE_PERIOD_MS = 5 * 60 * 1000 // 5 minutes
export const MFA_CODE_LENGTH = 6
