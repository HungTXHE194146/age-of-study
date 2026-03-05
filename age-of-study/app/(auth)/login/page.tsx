"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/loading";
import { QrCode } from "lucide-react";
import { QRScanner } from "@/components/qr-scanner";
import { VerifyMFAModal } from "@/components/auth/VerifyMFAModal";

export default function LoginPage() {
  const router = useRouter();
  const { 
    login, 
    verifyMFA, 
    isLoading, 
    error, 
    clearError, 
    clearMFAChallenge,
    user, 
    requiresMFA 
  } = useAuthStore();


  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Clear error on mount to prevent errors from persisting across pages
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    // Client-side validation
    if (!username.trim()) {
      setValidationError("Vui lòng nhập tên đăng nhập");
      return;
    }

    if (!password.trim()) {
      setValidationError("Vui lòng nhập mật khẩu");
      return;
    }

    await login(username, password);
  };

  // Auto-navigate after successful login
  useEffect(() => {
    if (user) {
      if (user.role === "teacher") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/student");
      }
    }
  }, [user, router]);

  const handleQRScanSuccess = async (decodedText: string) => {
    try {
      setScanError(null);
      const parsed = JSON.parse(decodedText);
      if (parsed.action === 'qr_login_v1' && parsed.username && parsed.password) {
        setIsScanningQR(false);
        await login(parsed.username, parsed.password);
      } else {
        setScanError("Mã QR không hợp lệ hoặc đã cũ. Hãy xin thầy cô thẻ mới nhé!");
      }
    } catch (err: any) {
      console.error(err);
      setScanError("Đây không phải là thẻ lớp học do Giáo viên cung cấp.");
    }
  };

  // Handle MFA verification
  const handleMFAVerify = async (code: string) => {
    const success = await verifyMFA(code)
    return { success, error: error || undefined }
  };

  const handleMFAClose = () => {
    clearMFAChallenge()
  };

  return (
    <div className="w-full relative" role="main">
      {/* Nút về trang chủ */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute -top-4 left-0 z-10"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg hover:bg-white transition-all group border border-gray-100"
        >
          <span className="text-lg group-hover:scale-110 group-hover:-translate-x-0.5 transition-transform duration-300">
            🏠
          </span>
          <span className="font-semibold text-gray-700 group-hover:text-orange-500 transition-colors text-sm">
            Về trang chủ
          </span>
        </Link>
      </motion.div>

      {/* Owl Avatar */}
      <Link href="/" aria-label="Về trang chủ" tabIndex={-1}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex justify-center mb-6 mt-8"
        >
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <Image
                src="/school-logo.svg"
                alt="Age of Study Logo"
                width={105}
                height={105}
                priority
              />
            </div>
            <div className="absolute bottom-0 right-0 bg-green-500 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-lg">✓</span>
            </div>
          </div>
        </motion.div>
      </Link>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl shadow-2xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Xin chào nhà thám hiểm nhí! 👋
          </h1>
          <p className="text-base text-gray-600">
            Sẵn sàng khám phá thế giới chưa?
          </p>
        </div>

        {/* Error Alert */}
        {(error || validationError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm"
          >
            {validationError || error}
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {scanError && (
            <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 text-center rounded-xl mb-4 text-sm font-medium">
              {scanError}
            </div>
          )}

          {/* Nút Quét QR to rõ */}
          <button
            type="button"
            onClick={() => setIsScanningQR(true)}
            className="w-full bg-blue-100 hover:bg-blue-200 border-2 border-blue-500 text-blue-700 font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm text-lg"
          >
            <QrCode className="w-6 h-6" />
            Quét thẻ QR
          </button>

          {/* Divider */}
          <div className="relative pt-2 pb-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">
                Hoặc nhập tay nếu quên thẻ
              </span>
            </div>
          </div>

          {/* Username Input */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide"
            >
              Tên đăng nhập của em
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                placeholder="Ví dụ: sieunhantoanhoc2025"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide"
            >
              Mật khẩu bí mật
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                placeholder="Nhập mật khẩu..."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg text-lg uppercase"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Đang đăng nhập...
              </>
            ) : (
              <>Vào học thôi! 🚀</>
            )}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center">
            <Link
              href="/magic-login"
              className="text-sm text-gray-600 hover:text-orange-500 hover:underline transition-colors"
            >
              Quên mật khẩu bí mật rồi? 🤔
            </Link>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 uppercase tracking-wide">
                Hoặc
              </span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-700 mb-2">Chưa có tài khoản?</p>
            <Link
              href="/register"
              className="inline-block text-green-600 hover:text-green-700 font-bold hover:underline uppercase tracking-wide"
            >
              Tạo tài khoản mới ngay!
            </Link>
          </div>
        </form>
      </motion.div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 mt-6 pb-6">

      {/* MFA Verification Modal */}
      {requiresMFA && (
        <VerifyMFAModal
          title="Xác thực 2 yếu tố"
          description="Nhập mã 6 số từ app xác thực của bạn"
          onVerify={handleMFAVerify}
          onClose={handleMFAClose}
          canClose={true}
        />
      )}
        © {new Date().getFullYear()} Age Of Study. Cùng bé khôn lớn mỗi ngày.
      </div>

      {/* Scanner Modal overlay */}
      <AnimatePresence>
        {isScanningQR && (
          <QRScanner
            onScanSuccess={handleQRScanSuccess}
            onClose={() => setIsScanningQR(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
