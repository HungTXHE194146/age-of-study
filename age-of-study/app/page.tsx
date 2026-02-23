"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles, Rocket, Trophy, Users, BookOpen } from "lucide-react";

/* ═══════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════ */
const floatVariants = {
  initial: { y: 0 },
  animate: {
    y: [-8, 8, -8],
    transition: {
      duration: 4,
      repeat: Infinity,
    },
  },
};

const islandVariants = {
  initial: { y: 0, scale: 1 },
  hover: {
    y: -12,
    scale: 1.03,
    transition: { type: "spring" as const, stiffness: 300, damping: 15 },
  },
};

const buttonVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { type: "spring" as const, stiffness: 400, damping: 10 },
  },
  tap: { scale: 0.95 },
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

/* ═══════════════════════════════════════
   HOMEPAGE COMPONENT
   ═══════════════════════════════════════ */
export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-sky-300 via-orange-200 to-purple-200">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-[10%] text-6xl animate-float">
          ☁️
        </div>
        <div className="absolute top-32 right-[15%] text-5xl animate-float animation-delay-1000">
          ⭐
        </div>
        <div className="absolute bottom-32 left-[20%] text-4xl animate-float animation-delay-2000">
          🌈
        </div>
        <div className="absolute top-[60%] right-[25%] text-6xl animate-float animation-delay-500">
          ✨
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* ══════ HERO SECTION ══════ */}
        <motion.div
          className="text-center mb-20"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          {/* School Badge */}
          <motion.div
            className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg mb-6 border-2 border-yellow-300"
            whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
          >
            <span className="text-2xl">🏫</span>
            <span className="font-bold text-lg text-gray-800">
              Trường Tiểu học Ninh Lai
            </span>
          </motion.div>

          {/* Giant Logo */}
          <motion.div
            className="mb-6 flex justify-center"
            variants={floatVariants}
            initial="initial"
            animate="animate"
          >
            <Image
              src="/logo.svg"
              alt="Age of Study Logo"
              width={220}
              height={220}
              priority
            />
          </motion.div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 leading-tight">
            <span className="inline-block transform -rotate-1 bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-2 rounded-2xl shadow-2xl">
              Chào mừng đến với
            </span>
            <br />
            <span className="inline-block mt-4 transform rotate-1 bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-2 rounded-2xl shadow-2xl">
              Age Of Study!
            </span>
          </h1>

          <motion.p
            className="text-2xl md:text-3xl font-bold text-gray-800 mb-10 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Nơi mỗi em nhỏ trở thành{" "}
            <span className="text-purple-700">nhà thám hiểm tri thức!</span> 🚀
          </motion.p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <motion.button
                className="px-10 py-5 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-2xl font-black rounded-full shadow-2xl border-4 border-white"
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
              >
                <span className="flex items-center gap-3">
                  <Rocket className="w-8 h-8" />
                  Bắt đầu phiêu lưu!
                </span>
              </motion.button>
            </Link>

            <Link href="/login">
              <motion.button
                className="px-8 py-4 bg-white text-gray-800 text-xl font-bold rounded-full shadow-xl border-4 border-blue-300 hover:bg-blue-50"
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
              >
                Đã có tài khoản
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* ══════ SUBJECT ISLANDS ══════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-black text-center mb-12 text-white drop-shadow-lg">
            🗺️ Chọn hành trình của em!
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {/* Math Island */}
            <Link href="/student">
              <motion.div
                className="relative bg-gradient-to-br from-red-400 to-pink-500 p-8 rounded-3xl shadow-2xl border-4 border-white cursor-pointer"
                variants={islandVariants}
                initial="initial"
                whileHover="hover"
                style={{ transformOrigin: "center" }}
              >
                <div className="text-center">
                  <div className="text-7xl mb-4">🔢</div>
                  <h3 className="text-3xl font-black text-white mb-3">
                    Toán Học
                  </h3>
                  <p className="text-lg font-semibold text-white/90 mb-6">
                    Rèn luyện tư duy logic, giải toán siêu nhanh! ⚡
                  </p>
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Sparkles className="w-5 h-5 text-yellow-200" />
                    <span className="text-white font-bold">Khám phá ngay!</span>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-gray-900 font-black px-4 py-2 rounded-full shadow-xl transform rotate-12 text-sm">
                  HOT 🔥
                </div>
              </motion.div>
            </Link>

            {/* English Island */}
            <Link href="/student">
              <motion.div
                className="relative bg-gradient-to-br from-cyan-400 to-blue-500 p-8 rounded-3xl shadow-2xl border-4 border-white cursor-pointer"
                variants={islandVariants}
                initial="initial"
                whileHover="hover"
                style={{ transformOrigin: "center" }}
              >
                <div className="text-center">
                  <div className="text-7xl mb-4">🇬🇧</div>
                  <h3 className="text-3xl font-black text-white mb-3">
                    Tiếng Anh
                  </h3>
                  <p className="text-lg font-semibold text-white/90 mb-6">
                    Phát triển kỹ năng giao tiếp tiếng Anh tự tin! 💬
                  </p>
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <BookOpen className="w-5 h-5 text-yellow-200" />
                    <span className="text-white font-bold">Học ngay!</span>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-green-400 text-gray-900 font-black px-4 py-2 rounded-full shadow-xl transform -rotate-12 text-sm">
                  MỚI ✨
                </div>
              </motion.div>
            </Link>

            {/* Vietnamese Island */}
            <Link href="/student">
              <motion.div
                className="relative bg-gradient-to-br from-green-400 to-teal-500 p-8 rounded-3xl shadow-2xl border-4 border-white cursor-pointer"
                variants={islandVariants}
                initial="initial"
                whileHover="hover"
                style={{ transformOrigin: "center" }}
              >
                <div className="text-center">
                  <div className="text-7xl mb-4">🇻🇳</div>
                  <h3 className="text-3xl font-black text-white mb-3">
                    Tiếng Việt
                  </h3>
                  <p className="text-lg font-semibold text-white/90 mb-6">
                    Nâng cao văn học, chính tả thật giỏi! 📖
                  </p>
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Trophy className="w-5 h-5 text-yellow-200" />
                    <span className="text-white font-bold">Vào học!</span>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-orange-400 text-gray-900 font-black px-4 py-2 rounded-full shadow-xl transform rotate-6 text-sm">
                  PHỔ BIẾN 🌟
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* ══════ FEATURES SECTION ══════ */}
        <motion.div
          className="bg-white/80 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border-4 border-yellow-300 mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-black text-center mb-10 text-gray-800">
            ✨ Những điều thú vị đang chờ em!
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🔥</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Chuỗi ngày học
              </h3>
              <p className="text-lg text-gray-600">
                Học mỗi ngày, nhận quà liền tay!
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl mb-4">⚔️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Thách đấu bạn bè
              </h3>
              <p className="text-lg text-gray-600">
                Trận chiến kiến thức cực kỳ hấp dẫn!
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Bảng xếp hạng
              </h3>
              <p className="text-lg text-gray-600">
                Leo lên đỉnh cao, trở thành số 1!
              </p>
            </div>
          </div>
        </motion.div>

        {/* ══════ FINAL CTA ══════ */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <Link href="/register">
            <motion.button
              className="px-16 py-8 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white text-3xl font-black rounded-full shadow-2xl border-4 border-white relative overflow-hidden"
              whileHover={{
                scale: 1.1,
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center gap-4">
                <Users className="w-10 h-10" />
                Tham gia ngay hôm nay!
                <Sparkles className="w-10 h-10" />
              </span>
              {/* Pulsing glow effect */}
              <motion.div
                className="absolute inset-0 bg-white/30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.1, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.button>
          </Link>

          <p className="text-xl font-bold text-gray-800 mt-8">
            🌟 Hơn <span className="text-3xl text-purple-600">1,000+</span> học
            sinh đang phiêu lưu cùng chúng mình!
          </p>
        </motion.div>

        {/* Staff/Admin Access Section */}
        <motion.div
          className="mt-20 pt-8 border-t-2 border-white/40"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto border-2 border-gray-200 shadow-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-2xl">👨‍🏫</span>
                <h3 className="text-lg font-bold text-gray-700">
                  Dành cho Giáo viên & Quản trị viên
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Truy cập vào trang quản lý và theo dõi tiến độ học sinh
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/staff/login?role=teacher">
                  <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors text-sm">
                    🎓 Giáo viên
                  </button>
                </Link>
                <Link href="/staff/login?role=admin">
                  <button className="px-6 py-2.5 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-md transition-colors text-sm">
                    ⚙️ Quản trị viên
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer padding */}
        <div className="h-16" />
      </div>
    </div>
  );
}
