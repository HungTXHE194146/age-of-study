/**
 * Enroll MFA Modal - Wizard để setup 2FA
 */

"use client";

import { useState, useEffect } from "react";
import {
  X,
  Smartphone,
  QrCode,
  CheckCircle,
  Shield,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OTPInput } from "./OTPInput";
import { mfaService } from "@/lib/mfaService";
import { MFA_CODE_LENGTH } from "@/types/mfa";
import type { MFAEnrollmentResponse } from "@/types/mfa";

interface EnrollMFAModalProps {
  userId: string;
  onSuccess: () => void;
  onClose: () => void;
}

type Step = "intro" | "scan" | "verify" | "complete";

export function EnrollMFAModal({
  userId,
  onSuccess,
  onClose,
}: EnrollMFAModalProps) {
  const [step, setStep] = useState<Step>("scan");
  const [enrollment, setEnrollment] = useState<MFAEnrollmentResponse | null>(
    null,
  );
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isStartingEnrollment, setIsStartingEnrollment] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    handleStartEnrollment();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Step 1: Bắt đầu enrollment
  const handleStartEnrollment = async () => {
    setIsStartingEnrollment(true);
    setError(null);
    const { data, error } = await mfaService.enroll(userId);

    if (error || !data) {
      setError(error || "Có lỗi xảy ra khi tạo QR Code");
      setIsStartingEnrollment(false);
      return;
    }

    setEnrollment(data);
    setIsStartingEnrollment(false);
    setStep("scan");
  };

  // Step 2: Verify OTP
  const handleVerify = async () => {
    if (otpCode.length !== MFA_CODE_LENGTH) {
      setError("Vui lòng nhập đủ 6 số");
      return;
    }

    if (!enrollment) return;

    setIsVerifying(true);
    setError(null);

    const { success, error } = await mfaService.verifyEnrollment(
      enrollment.id,
      otpCode,
    );

    setIsVerifying(false);

    if (!success) {
      setError(error || "Mã OTP không đúng");
      setOtpCode("");
      return;
    }

    setStep("complete");
  };

  const handleCopySecret = async () => {
    if (enrollment?.totp.secret) {
      if (!navigator?.clipboard?.writeText) {
        setError("Trình duyệt không hỗ trợ copy tự động");
        return;
      }
      try {
        await navigator.clipboard.writeText(enrollment.totp.secret);
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } catch (err) {
        setError("Không thể copy mã bí mật");
      }
    }
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="enroll-mfa-title"
        className="bg-[#fffdf8] rounded-xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-2 border-black max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-blue-50/90 backdrop-blur-md border-b-2 border-dashed border-gray-400 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] -rotate-3">
              <Shield className="w-6 h-6 text-blue-900" />
            </div>
            <div>
              <h2
                id="enroll-mfa-title"
                className="text-2xl font-black font-handwritten text-gray-900"
              >
                Bật xác thực 2 yếu tố
              </h2>
              <p className="text-sm font-bold text-gray-600">
                Bảo vệ tài khoản của bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 flex items-center justify-center border-2 border-transparent hover:border-black rounded-md transition-all text-gray-600 hover:text-black hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 2: Scan QR */}
          {step === "scan" && (
            <div className="space-y-6">
              {isStartingEnrollment ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-80">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-xl font-bold font-handwritten text-gray-700">
                    Đang khởi tạo mã QR...
                  </p>
                </div>
              ) : error && !enrollment ? (
                <div className="p-4 bg-red-50 border-2 border-dashed border-red-500 rounded-xl text-center shadow-[4px_4px_0_0_rgba(185,28,28,0.2)]">
                  <p className="text-red-800 font-bold mb-4">{error}</p>
                  <button
                    onClick={handleStartEnrollment}
                    className="px-6 py-2 bg-red-600 text-white font-bold rounded-md border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] transition-all"
                  >
                    Thử tạo lại
                  </button>
                </div>
              ) : (
                enrollment && (
                  <>
                    <div className="space-y-5">
                      <div className="p-5 border-2 border-black rounded-xl bg-green-50 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-1">
                        <h4 className="font-bold font-handwritten text-2xl mb-2 text-green-900 border-b-2 border-dashed border-green-300 pb-2 flex items-center gap-2">
                          <Smartphone className="w-6 h-6" /> Bước 1: Tải App Xác
                          Thực
                        </h4>
                        <p className="text-base font-medium text-gray-800 leading-relaxed pt-1">
                          Sử dụng điện thoại thông minh của bạn, vào{" "}
                          <strong className="text-black bg-green-200 px-1 rounded border border-green-400">
                            App Store
                          </strong>{" "}
                          hoặc{" "}
                          <strong className="text-black bg-green-200 px-1 rounded border border-green-400">
                            Google Play
                          </strong>{" "}
                          để tải ứng dụng <strong>Google Authenticator</strong>{" "}
                          hoặc <strong>Microsoft Authenticator</strong>.
                        </p>
                      </div>

                      <div className="p-5 border-2 border-black rounded-xl bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform rotate-1">
                        <h4 className="font-bold font-handwritten text-2xl mb-2 text-center text-blue-900 relative">
                          <QrCode className="w-6 h-6 absolute left-2 top-1" />
                          Bước 2: Quét Mã QR
                        </h4>
                        <p className="text-sm font-bold text-gray-600 text-center mb-4">
                          Mở app trên điện thoại, chọn{" "}
                          <strong>"Quét mã QR"</strong> và hướng camera vào mã
                          dưới đây:
                        </p>

                        {/* QR Code */}
                        <div className="flex justify-center mb-6">
                          <div className="p-3 bg-white border-2 border-dashed border-gray-400 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]">
                            <img
                              src={enrollment.totp.qr_code}
                              alt="QR Code"
                              className="w-48 h-48 rounded"
                            />
                          </div>
                        </div>

                        {/* Manual Entry */}
                        <div className="space-y-2 mt-4 bg-gray-50/50 p-4 border-t-2 border-dashed border-gray-200 -mx-5 -mb-5 rounded-b-xl">
                          <p className="text-xs font-bold text-gray-500 text-center uppercase tracking-wider">
                            Không quét được camera? Nhập mã thủ công:
                          </p>
                          <div className="flex items-center gap-2 p-2 bg-white border-2 border-black rounded-lg font-mono text-sm max-w-[280px] mx-auto shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            <code className="flex-1 text-center font-bold text-base tracking-widest text-black">
                              {enrollment.totp.secret}
                            </code>
                            <button
                              onClick={handleCopySecret}
                              className="p-2 hover:bg-gray-100 rounded border-2 border-transparent hover:border-black transition-all group"
                              title="Copy mã"
                            >
                              {copiedSecret ? (
                                <Check className="w-5 h-5 text-green-600" />
                              ) : (
                                <Copy className="w-5 h-5 text-gray-700 group-hover:text-black" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setStep("verify")}
                      className="w-full inline-flex items-center justify-center rounded-md border-2 border-black bg-[#ffde59] px-6 py-4 text-xl font-black font-handwritten text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-[#efce49] transition-all mt-8"
                    >
                      ĐÃ QUÉT XONG, TIẾP TỤC BƯỚC 3 ➔
                    </button>
                  </>
                )
              )}
            </div>
          )}

          {/* Step 3: Verify */}
          {step === "verify" && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-blue-100 border-2 border-black rounded-full mx-auto flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] -rotate-3">
                  <Shield className="w-8 h-8 text-blue-900" />
                </div>
                <h3 className="text-2xl font-black font-handwritten text-gray-900">
                  Bước 3: Nhập mã xác thực
                </h3>
                <p className="text-base font-medium text-gray-600">
                  Hãy nhìn vào app trên điện thoại và nhập mã 6 số hiện tại của
                  hệ thống:
                </p>
              </div>

              <div className="space-y-4 bg-white p-6 border-2 border-black rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <OTPInput
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={isVerifying}
                  error={!!error}
                />

                {error && (
                  <div className="p-3 bg-red-50 border-2 border-dashed border-red-400 rounded-lg">
                    <p className="text-sm font-bold text-red-700 text-center">
                      {error}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4">
                <button
                  onClick={handleVerify}
                  disabled={otpCode.length !== MFA_CODE_LENGTH || isVerifying}
                  className="w-full inline-flex items-center justify-center rounded-md border-2 border-black bg-blue-600 px-6 py-4 text-xl font-black font-handwritten text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? "ĐANG XÁC MINH..." : "HOÀN TẤT CÀI ĐẶT"}
                </button>

                <button
                  onClick={() => {
                    setStep("scan");
                    setOtpCode("");
                    setError(null);
                  }}
                  disabled={isVerifying}
                  className="w-full inline-flex items-center justify-center rounded-md border-2 border-transparent hover:border-black bg-transparent px-6 py-3 text-lg font-bold text-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Quay lại xem mã QR
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === "complete" && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-100 border-2 border-black rounded-full mx-auto flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] rotate-3">
                  <CheckCircle className="w-10 h-10 text-green-700" />
                </div>
                <h3 className="text-3xl font-black font-handwritten text-green-700">
                  Tuyệt Vời!
                </h3>
                <p className="text-lg font-bold text-gray-700">
                  Xác thực 2 yếu tố đã được bật thành công
                </p>
              </div>

              <div className="p-5 border-2 border-black rounded-xl bg-blue-50 shadow-[4px_4px_0_0_rgba(0,0,0,1)] rotate-1 mt-6">
                <p className="text-base font-medium text-blue-900">
                  <strong className="font-bold underline">Lưu ý:</strong> Từ giờ
                  trở đi, bạn sẽ cần nhập mã từ{" "}
                  <strong>app trên điện thoại</strong> mỗi khi đăng nhập trên
                  máy tính nhé.
                </p>
              </div>

              <button
                onClick={handleComplete}
                className="w-full inline-flex items-center justify-center rounded-md border-2 border-black bg-[#ffde59] px-6 py-4 text-xl font-black font-handwritten text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-[#efce49] transition-all mt-8"
              >
                ĐÓNG CỬA SỔ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
