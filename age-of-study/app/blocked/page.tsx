"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldAlert, Mail, Phone, LogOut } from "lucide-react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function BlockedPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Ensure user is really logged out
  useEffect(() => {
    const checkAndLogout = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await supabase.auth.signOut();
      }
    };
    
    checkAndLogout();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect anyway
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with icon */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-center">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block bg-white/20 backdrop-blur-sm p-6 rounded-full mb-4"
            >
              <ShieldAlert className="w-16 h-16 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Tài khoản đã bị khóa
            </h1>
            <p className="text-red-50 text-lg">
              Your account has been blocked
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Main message */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="text-gray-800 leading-relaxed">
                  <strong className="text-red-600">Tài khoản của bạn đã bị khóa tạm thời.</strong>
                  <br />
                  Điều này có thể xảy ra do vi phạm quy tắc sử dụng hoặc yêu cầu từ giáo viên/quản trị viên.
                </p>
              </div>

              {/* What to do */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🤔</span>
                  Tôi phải làm gì bây giờ?
                </h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">📞</span>
                    <span>
                      <strong>Liên hệ giáo viên hoặc phụ huynh:</strong> Họ sẽ giúp bạn hiểu lý do và hướng dẫn các bước tiếp theo.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">📧</span>
                    <span>
                      <strong>Gửi email cho quản trị viên:</strong> Nếu bạn nghĩ đây là nhầm lẫn, hãy yêu cầu xem xét lại.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">⏰</span>
                    <span>
                      <strong>Chờ đợi:</strong> Trong một số trường hợp, khóa tài khoản có thể chỉ là tạm thời.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Contact information */}
              <div className="grid md:grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="bg-blue-500 text-white p-3 rounded-lg">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Email hỗ trợ</p>
                    <p className="text-sm font-bold text-gray-800">support@ageofstudy.edu.vn</p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="bg-green-500 text-white p-3 rounded-lg">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Hotline</p>
                    <p className="text-sm font-bold text-gray-800">1900 xxxx</p>
                  </div>
                </motion.div>
              </div>

              {/* Important note */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  <strong className="text-gray-800">⚠️ Lưu ý:</strong> Không chia sẻ mật khẩu với người khác và luôn tuân thủ quy tắc cộng đồng để tránh bị khóa tài khoản trong tương lai.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                </motion.button>

                <Link href="/" className="flex-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">🏠</span>
                    Về trang chủ
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-600 text-sm mt-6"
        >
          Age of Study - Nền tảng học tập an toàn và thân thiện
        </motion.p>
      </motion.div>
    </div>
  );
}
