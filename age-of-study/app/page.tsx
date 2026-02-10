<<<<<<< Updated upstream
<<<<<<< Updated upstream
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Users,
  Trophy,
  Brain,
  Globe,
  GraduationCap
} from 'lucide-react'
=======
=======
>>>>>>> Stashed changes
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-blue-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Owl Mascot */}
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-9xl mb-6"
          >
            🦉
          </motion.div>

<<<<<<< Updated upstream
<<<<<<< Updated upstream
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          ageOfStudy{' '}
          <span className="text-primary-600">Vietnam</span>
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Nền tảng học tập gamified dành cho học sinh tiểu học Việt Nam.
          Học Toán, Tiếng Anh, và Tiếng Việt thông qua các skill tree hấp dẫn
          và các trận chiến kiến thức thú vị.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="btn-primary text-lg px-8">
              Bắt đầu học ngay
            </Button>
          </Link>
          <Link href="/battle">
            <Button size="lg" variant="outline" className="btn-secondary text-lg px-8">
              Thách đấu bạn bè
            </Button>
=======
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            Chào mừng đến{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              Vương quốc Tri thức!
            </span>{" "}
            ✨
          </h1>

          <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Nơi các bạn nhỏ khám phá kiến thức qua trò chơi,{" "}
            <br className="hidden md:block" />
            leo cây kỹ năng và trở thành siêu nhân toán học! 🚀
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg text-lg"
              >
                Bắt đầu phiêu lưu! 🚀
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-8 rounded-2xl shadow-lg text-lg border-2 border-gray-200"
              >
                Đã có tài khoản 📖
              </motion.button>
            </Link>
          </div>

          {/* Teacher Link */}
          <p className="text-sm text-gray-600">
            Bạn là giáo viên?{" "}
            <Link
              href="/login"
              className="text-purple-600 hover:text-purple-700 font-semibold underline"
            >
              Đăng nhập tại đây 👨‍🏫
            </Link>
          </p>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
            Khám phá thế giới học tập! 🌟
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Skill Tree */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-gradient-to-br from-green-100 to-emerald-100 p-8 rounded-3xl shadow-lg"
            >
              <div className="text-6xl mb-4">🌳</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Cây Kỹ Năng
              </h3>
              <p className="text-gray-700">
                Leo lên cây tri thức, mở khóa từng nhánh kiến thức mới! Càng học
                nhiều, cây càng tươi tốt! 🌱
              </p>
            </motion.div>

            {/* Feature 2: Battles */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-gradient-to-br from-orange-100 to-yellow-100 p-8 rounded-3xl shadow-lg"
            >
              <div className="text-6xl mb-4">⚔️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Đấu Trường Tri Thức
              </h3>
              <p className="text-gray-700">
                Thách đấu bạn bè trong các trận chiến kiến thức! Ai nhanh hơn,
                đúng hơn sẽ chiến thắng! 🏅
              </p>
            </motion.div>

            {/* Feature 3: Leaderboard */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-gradient-to-br from-purple-100 to-pink-100 p-8 rounded-3xl shadow-lg"
            >
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Bảng Xếp Hạng
              </h3>
              <p className="text-gray-700">
                Nhận sao vàng, tích lũy điểm XP và leo lên top đầu! Trở thành
                học sinh xuất sắc nhất! ⭐
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Subjects Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
            Các môn học thú vị 📚
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Math */}
            <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
              <div className="text-6xl mb-4">🔢</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Toán Học</h3>
              <p className="text-gray-600 text-sm">
                Cộng, trừ, nhân, chia - tất cả đều trở nên vui vẻ và dễ dàng!
              </p>
            </div>

            {/* Vietnamese */}
            <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
              <div className="text-6xl mb-4">📖</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Tiếng Việt
              </h3>
              <p className="text-gray-600 text-sm">
                Đọc truyện, học chữ, viết văn - khám phá vẻ đẹp tiếng Việt!
              </p>
            </div>

            {/* English */}
            <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
              <div className="text-6xl mb-4">🌏</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Tiếng Anh
              </h3>
              <p className="text-gray-600 text-sm">
                Hello! Học tiếng Anh qua trò chơi và bài hát vui nhộn!
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Teacher Portal Banner */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-indigo-100 to-purple-100 p-8 md:p-12 rounded-3xl shadow-lg text-center"
        >
          <div className="text-5xl mb-4">👨‍🏫 👩‍🏫</div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Dành cho Giáo viên & Phụ huynh
          </h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Theo dõi tiến trình học tập, quản lý lớp học và hỗ trợ các em phát
            triển
          </p>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-xl shadow-md"
            >
              Đăng nhập tài khoản giáo viên
            </motion.button>
>>>>>>> Stashed changes
          </Link>
        </motion.div>
      </section>

=======
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            Chào mừng đến{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              Vương quốc Tri thức!
            </span>{" "}
            ✨
          </h1>

          <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Nơi các bạn nhỏ khám phá kiến thức qua trò chơi,{" "}
            <br className="hidden md:block" />
            leo cây kỹ năng và trở thành siêu nhân toán học! 🚀
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg text-lg"
              >
                Bắt đầu phiêu lưu! 🚀
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-8 rounded-2xl shadow-lg text-lg border-2 border-gray-200"
              >
                Đã có tài khoản 📖
              </motion.button>
            </Link>
          </div>

          {/* Teacher Link */}
          <p className="text-sm text-gray-600">
            Bạn là giáo viên?{" "}
            <Link
              href="/login"
              className="text-purple-600 hover:text-purple-700 font-semibold underline"
            >
              Đăng nhập tại đây 👨‍🏫
            </Link>
          </p>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
            Khám phá thế giới học tập! 🌟
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Skill Tree */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-gradient-to-br from-green-100 to-emerald-100 p-8 rounded-3xl shadow-lg"
            >
              <div className="text-6xl mb-4">🌳</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Cây Kỹ Năng
              </h3>
              <p className="text-gray-700">
                Leo lên cây tri thức, mở khóa từng nhánh kiến thức mới! Càng học
                nhiều, cây càng tươi tốt! 🌱
              </p>
            </motion.div>

            {/* Feature 2: Battles */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-gradient-to-br from-orange-100 to-yellow-100 p-8 rounded-3xl shadow-lg"
            >
              <div className="text-6xl mb-4">⚔️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Đấu Trường Tri Thức
              </h3>
              <p className="text-gray-700">
                Thách đấu bạn bè trong các trận chiến kiến thức! Ai nhanh hơn,
                đúng hơn sẽ chiến thắng! 🏅
              </p>
            </motion.div>

            {/* Feature 3: Leaderboard */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-gradient-to-br from-purple-100 to-pink-100 p-8 rounded-3xl shadow-lg"
            >
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Bảng Xếp Hạng
              </h3>
              <p className="text-gray-700">
                Nhận sao vàng, tích lũy điểm XP và leo lên top đầu! Trở thành
                học sinh xuất sắc nhất! ⭐
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Subjects Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
            Các môn học thú vị 📚
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Math */}
            <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
              <div className="text-6xl mb-4">🔢</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Toán Học</h3>
              <p className="text-gray-600 text-sm">
                Cộng, trừ, nhân, chia - tất cả đều trở nên vui vẻ và dễ dàng!
              </p>
            </div>

            {/* Vietnamese */}
            <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
              <div className="text-6xl mb-4">📖</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Tiếng Việt
              </h3>
              <p className="text-gray-600 text-sm">
                Đọc truyện, học chữ, viết văn - khám phá vẻ đẹp tiếng Việt!
              </p>
            </div>

            {/* English */}
            <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
              <div className="text-6xl mb-4">🌏</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Tiếng Anh
              </h3>
              <p className="text-gray-600 text-sm">
                Hello! Học tiếng Anh qua trò chơi và bài hát vui nhộn!
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Teacher Portal Banner */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-indigo-100 to-purple-100 p-8 md:p-12 rounded-3xl shadow-lg text-center"
        >
          <div className="text-5xl mb-4">👨‍🏫 👩‍🏫</div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Dành cho Giáo viên & Phụ huynh
          </h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Theo dõi tiến trình học tập, quản lý lớp học và hỗ trợ các em phát
            triển
          </p>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-xl shadow-md"
            >
              Đăng nhập tài khoản giáo viên
            </motion.button>
          </Link>
        </motion.div>
      </section>

>>>>>>> Stashed changes
      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center">
        <div className="border-t border-gray-300 pt-8">
          <p className="text-gray-600 text-sm mb-2">
            © {new Date().getFullYear()} Age Of Study. Cùng bé khôn lớn mỗi
            ngày. 🌟
          </p>
          <p className="text-gray-500 text-xs">
            Nền tảng học tập gamified dành cho học sinh tiểu học Việt Nam
          </p>
        </div>
<<<<<<< Updated upstream
<<<<<<< Updated upstream

        <div className="card text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Trận Chiến Kiến Thức</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Thi đấu trực tiếp với bạn bè, trả lời nhanh để giảm máu đối thủ
            và giành chiến thắng.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Bảng Xếp Hạng</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Theo dõi tiến độ và so tài với các học sinh khác trên toàn quốc.
          </p>
        </div>
      </div>

      {/* Subjects Showcase */}
      <div className="card">
        <h2 className="text-3xl font-bold text-center mb-8">Các Môn Học</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔢</span>
            </div>
            <h3 className="text-2xl font-bold text-red-600 mb-2">Toán Học</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Rèn luyện tư duy logic, giải toán nhanh và chính xác
            </p>
          </div>

          <div className="text-center p-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🇬🇧</span>
            </div>
            <h3 className="text-2xl font-bold text-blue-600 mb-2">Tiếng Anh</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Phát triển kỹ năng nghe, nói, đọc, viết Tiếng Anh
            </p>
          </div>

          <div className="text-center p-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🇻🇳</span>
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">Tiếng Việt</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Nâng cao kỹ năng đọc hiểu, chính tả và văn học
            </p>
          </div>
        </div>
      </div>
=======
      </footer>
>>>>>>> Stashed changes
=======
      </footer>
>>>>>>> Stashed changes
    </div>
  )
}
