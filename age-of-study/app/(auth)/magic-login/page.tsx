"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { LoadingSpinner } from "@/components/ui/loading";
import { KeyRound, User, ArrowLeft } from "lucide-react";

export default function MagicLoginPage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();

  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "success">("form");
  const [studentName, setStudentName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Verify code with server
      const res = await fetch("/api/auth/magic-login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra. Vui lòng thử lại.");
        return;
      }

      // 2. Exchange token_hash for a real session
      const supabase = getSupabaseBrowserClient();
      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "email",
      });

      if (otpError) {
        console.error("OTP verify error:", otpError);
        setError("Không thể tạo phiên đăng nhập. Vui lòng thử lại.");
        return;
      }

      // 3. Refresh auth store
      await checkAuth();

      setStudentName(data.student_name || username);
      setStep("success");

      // 4. Redirect to change-password page
      setTimeout(() => {
        router.replace("/student/change-password");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute -top-4 left-0 z-10"
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg hover:bg-white transition-all group border border-gray-100"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600 group-hover:text-orange-500 transition-colors" />
          <span className="font-semibold text-gray-700 group-hover:text-orange-500 transition-colors text-sm">
            Quay lại
          </span>
        </Link>
      </motion.div>

      {/* Logo */}
      <Link href="/" aria-label="Về trang chủ">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex justify-center mb-6 mt-8"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
            <Image
              src="/school-logo.svg"
              alt="Age of Study Logo"
              width={105}
              height={105}
              priority
            />
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
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-7 h-7 text-orange-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Đăng nhập bằng mã
                </h1>
                <p className="text-sm text-gray-500">
                  Nhập tên đăng nhập và mã 6 số do thầy cô cung cấp
                </p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Tên đăng nhập
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                      placeholder="Ví dụ: sieunhantoanhoc2025"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Code */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Mã 6 số từ thầy cô
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      required
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Ví dụ: 483920"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all font-mono text-lg tracking-[0.3em]"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Mã có hiệu lực trong 5 phút
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6 || !username.trim()}
                  className="w-full bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg text-lg uppercase mt-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Đang xác minh...
                    </>
                  ) : (
                    "Xác minh mã 🔓"
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Chào {studentName}!
              </h2>
              <p className="text-gray-500 text-sm">
                Đang chuyển đến trang đặt mật khẩu mới...
              </p>
              <div className="mt-4 flex justify-center">
                <LoadingSpinner size="md" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 mt-6 pb-6">
        © {new Date().getFullYear()} Age Of Study. Cùng bé khôn lớn mỗi ngày.
      </div>
    </div>
  );
}
