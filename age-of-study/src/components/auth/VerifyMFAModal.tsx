/**
 * Verify MFA Modal - Yêu cầu OTP khi login hoặc re-auth
 */

'use client'

import { useState } from 'react'
import { X, Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OTPInput } from './OTPInput'
import { MFA_CODE_LENGTH } from '@/types/mfa'

interface VerifyMFAModalProps {
  title?: string
  description?: string
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>
  onClose?: () => void
  canClose?: boolean
}

export function VerifyMFAModal({
  title = 'Xác thực 2 yếu tố',
  description = 'Nhập mã 6 số từ app xác thực của bạn',
  onVerify,
  onClose,
  canClose = true,
}: VerifyMFAModalProps) {
  const [otpCode, setOtpCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    if (otpCode.length !== MFA_CODE_LENGTH) {
      setError('Vui lòng nhập đủ 6 số')
      return
    }

    setIsVerifying(true)
    setError(null)

    const result = await onVerify(otpCode)

    setIsVerifying(false)

    if (!result.success) {
      setError(result.error || 'Mã OTP không đúng')
      setOtpCode('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otpCode.length === MFA_CODE_LENGTH && !isVerifying) {
      handleVerify()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full"
        onKeyPress={handleKeyPress}
      >
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>
          {canClose && onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <OTPInput
              value={otpCode}
              onChange={setOtpCode}
              disabled={isVerifying}
              error={!!error}
            />

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleVerify}
              disabled={otpCode.length !== MFA_CODE_LENGTH || isVerifying}
              className="w-full"
              size="lg"
            >
              {isVerifying ? 'Đang xác thực...' : 'Xác nhận'}
            </Button>

            {canClose && onClose && (
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
                disabled={isVerifying}
              >
                Hủy
              </Button>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Không nhận được mã? Kiểm tra lại app xác thực
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
