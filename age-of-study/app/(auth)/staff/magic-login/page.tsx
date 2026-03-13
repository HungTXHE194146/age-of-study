"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { LoadingSpinner } from "@/components/ui/loading";
import { KeyRound, User, ArrowLeft } from "lucide-react";

export default function TeacherMagicLoginPage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();

  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "success">("form");
  const [teacherName, setTeacherName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Verify code with server
      const res = await fetch("/api/auth/magic-login/verify-teacher", {
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

      setTeacherName(data.teacher_name || username);
      setStep("success");

      // 4. Redirect to teacher change-password page
      setTimeout(() => {
        router.replace("/teacher/change-password");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            href="/staff/login"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại đăng nhập
          </Link>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
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
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <KeyRound className="w-7 h-7 text-blue-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Đăng nhập bằng mã
                  </h1>
                  <p className="text-sm text-gray-500">
                    Nhập tên đăng nhập và mã 6 số do quản trị viên cung cấp
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                        placeholder="Nhập tên đăng nhập"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mã 6 số từ quản trị viên
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
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all font-mono text-lg tracking-[0.3em]"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Mã có hiệu lực trong 5 phút
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6 || !username.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
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
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Chào {teacherName}!
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
      </div>
    </div>
  );
}
