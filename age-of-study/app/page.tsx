"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Sparkles,
  BrainCircuit,
  Gamepad2,
  Target,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  Play,
  BookOpen,
  Calculator,
  PenTool,
  ArrowRight,
  FileText,
  Rocket,
} from "lucide-react";

/* ═══════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════ */
const floatVariants = {
  initial: { y: 0 },
  animate: {
    y: [-8, 8, -8],
    transition: { duration: 4, repeat: Infinity },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/* ═══════════════════════════════════════
   HOMEPAGE COMPONENT
   ═══════════════════════════════════════ */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-200">
      {/* ══════ HEADER FOR STUDENTS & TEACHERS ══════ */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/school-logo.svg"
              alt="Logo"
              width={64}
              height={64}
              className="w-16 h-16"
            />
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-2xl tracking-tight text-slate-800 leading-none mb-1">
                Age of Study
              </span>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-fit">
                Tiểu học Ninh Lai
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 group">
            {/* Student Login Button */}
            <div className="flex items-center transition-all">
              <Link
                href="/login"
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl px-5 py-2.5 text-sm sm:text-base font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <span>Học sinh</span>
                <Rocket className="w-4 h-4 hidden sm:block" />
              </Link>
            </div>

            <div className="h-6 w-px bg-slate-300 hidden md:block"></div>

            <Link
              href="/staff/login"
              className="hidden md:block text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Giáo viên / Admin
            </Link>
          </div>
        </div>
      </header>

      {/* ══════ HERO SECTION (Target: Teachers/Schools) ══════ */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16 overflow-hidden relative">
        {/* Background shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-indigo-300/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 w-[500px] h-[500px] rounded-full bg-purple-300/20 blur-3xl pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* School Pride Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-yellow-200 shadow-md text-slate-800 font-bold text-sm sm:text-base mb-8"
            >
              <span className="text-xl">🏫</span>
              <span>Cổng học tập thông minh của Trường Tiểu học Ninh Lai</span>
              <Sparkles className="w-4 h-4 text-yellow-500 ml-1" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight"
            >
              Biến tài liệu khô khan thành <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                đấu trường tri thức
              </span>{" "}
              trong 60s
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              AI tự động phân tích PDF, tạo kho câu hỏi và đánh giá năng lực học
              sinh.{" "}
              <strong className="text-slate-800 font-semibold">
                Giải phóng 80% thời gian soạn bài
              </strong>{" "}
              cho giáo viên.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/staff/login?role=teacher">
                <button className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group">
                  Đăng nhập Giáo viên
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="#how-it-works">
                <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-lg font-bold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                  <Play className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                  Xem quy trình 3 bước
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════ AI WORKFLOW (How it works) ══════ */}
      <section id="how-it-works" className="pt-12 md:pt-16 pb-0 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Nhàn tênh việc soạn giảng với sức mạnh AI
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Thay vì mất hàng giờ tự gõ từng câu hỏi trắc nghiệm, hệ thống RAG
              AI của chúng tôi tự động hóa hoàn toàn quy trình này.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {/* Step 1 */}
            <motion.div
              variants={staggerItem}
              className="relative p-8 rounded-3xl bg-slate-50 border border-slate-100 text-center hover:shadow-xl transition-shadow duration-300"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white">
                1
              </div>
              <div className="w-24 h-24 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 rotate-3">
                <FileText className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Tải lên giáo trình
              </h3>
              <p className="text-slate-600 text-lg">
                Upload giáo án hoặc file PDF lý thuyết. Hệ thống sẽ bóc tách dữ
                liệu gốc cực kỳ chính xác ngay lập tức.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              variants={staggerItem}
              className="relative p-8 rounded-3xl bg-purple-50 border border-purple-100 text-center hover:shadow-xl transition-shadow duration-300"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white">
                2
              </div>
              <div className="w-24 h-24 mx-auto bg-purple-100 rounded-2xl flex items-center justify-center mb-6 text-purple-600 -rotate-3">
                <BrainCircuit className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                AI tự tạo câu hỏi
              </h3>
              <p className="text-slate-600 text-lg">
                Không chỉ là bốc chữ ngẫu nhiên. Nhờ ứng dụng RAG AI để sinh ra
                bài tập trắc nghiệm đúng chuẩn kiến thức.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              variants={staggerItem}
              className="relative p-8 rounded-3xl bg-emerald-50 border border-emerald-100 text-center hover:shadow-xl transition-shadow duration-300"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white">
                3
              </div>
              <div className="w-24 h-24 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 rotate-3">
                <Gamepad2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Học sinh "chiến đấu"
              </h3>
              <p className="text-slate-600 text-lg">
                Giáo viên duyệt qua nội dung 1 lần. Chạm nút Xuất bản và học
                sinh lập tức tham gia cuộc đua rèn trí tuệ.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════ CORE BENEFITS ══════ */}
      <section className="pt-16 md:pt-24 pb-12 md:pb-16 bg-slate-50 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        {/* Transition gradient from white section above */}
        <div className="absolute top-0 inset-x-0 h-24 md:h-32 bg-gradient-to-b from-white to-transparent z-0 pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Hơn cả một trò chơi, đó là Nền tảng Học tập
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Age of Study kết hợp công cụ sư phạm và Game Design, mang lại kết
              quả có thể đo lường.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <motion.div
              variants={fadeInUp}
              initial="initial"
              whileInView="show"
              viewport={{ once: true }}
              className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-200 flex flex-col h-full group"
            >
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Đánh giá lỗ hổng tức thời
              </h3>
              <p className="text-slate-600 text-lg flex-grow">
                Dashboard thống kê tỷ lệ đúng/sai của từng học sinh ở từng khối
                kiến thức cụ thể. Giáo viên biết chính xác em nào đang yếu điểm
                nào để can thiệp kịp thời.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="initial"
              whileInView="show"
              viewport={{ once: true }}
              className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-200 flex flex-col h-full group"
            >
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Thúc đẩy tính tự giác
              </h3>
              <p className="text-slate-600 text-lg flex-grow">
                Sử dụng cơ chế Growth (Cây kỹ năng), Streak (chuỗi ngày học) và
                Leaderboard để xây dựng thói quen tự học cho trẻ. Không cần phụ
                huynh ép buộc.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="initial"
              whileInView="show"
              viewport={{ once: true }}
              className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-200 flex flex-col h-full group"
            >
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                An toàn & Có kiểm soát
              </h3>
              <p className="text-slate-600 text-lg flex-grow">
                Nền tảng khép kín, 100% không quảng cáo rác. AI Chatbot được
                huấn luyện chỉ dẫn dắt gợi ý giải toán, tuyệt đối không cung cấp
                sẵn đáp án cho học sinh.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════ SHOWCASE FOR STUDENTS ══════ */}
      <section className="pt-16 md:pt-20 pb-16 md:pb-24 bg-slate-900 text-white overflow-hidden relative">
        {/* Smoother transition gradient connecting the previous section */}
        <div className="absolute top-0 inset-x-0 h-24 md:h-40 bg-gradient-to-b from-slate-50 to-transparent z-0 pointer-events-none"></div>

        <div className="absolute inset-0 opacity-[0.03] outline-none z-0">
          <svg width="100%" height="100%" xmlns="http://www.w300.org/2000/svg">
            <defs>
              <pattern
                id="smallGrid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#smallGrid)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
              Trải nghiệm thiết kế riêng cho học sinh
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Giao diện học tập được tùy biến cực bắt mắt, tạo cảm giác như học
              sinh đang thám hiểm một trò chơi RPG thay vì làm bài tập khô khan
              ngoài đời.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Math */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 transition-all duration-300 group hover:-translate-y-2">
              <div className="h-48 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl mb-8 flex items-center justify-center overflow-hidden relative border border-slate-700/50">
                <motion.div
                  variants={floatVariants}
                  initial="initial"
                  animate="animate"
                  className="text-7xl group-hover:scale-110 transition-transform"
                >
                  🔢
                </motion.div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
              </div>
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-3">
                <Calculator className="w-6 h-6 text-blue-400" /> Vương quốc Toán
                học
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Rèn luyện tư duy logic, tính nhẩm thần tốc với hàng ngàn bài
                toán sinh động, hệ thống level up đầy lôi cuốn.
              </p>
            </div>

            {/* English */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-700 hover:border-pink-500 hover:bg-slate-800 transition-all duration-300 group hover:-translate-y-2 delay-100">
              <div className="h-48 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-2xl mb-8 flex items-center justify-center overflow-hidden relative border border-slate-700/50">
                <motion.div
                  variants={floatVariants}
                  initial="initial"
                  animate="animate"
                  className="text-7xl group-hover:scale-110 transition-transform"
                  style={{ animationDelay: "1s" }}
                >
                  🇬🇧
                </motion.div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
              </div>
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-pink-400" /> Đảo ngôn ngữ Anh
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Mở rộng vốn từ vựng và ngữ pháp thông qua các thử thách nhập vai
                đấu trí bằng ngôn ngữ quốc tế.
              </p>
            </div>

            {/* Vietnamese */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-700 hover:border-emerald-500 hover:bg-slate-800 transition-all duration-300 group hover:-translate-y-2 delay-200">
              <div className="h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl mb-8 flex items-center justify-center overflow-hidden relative border border-slate-700/50">
                <motion.div
                  variants={floatVariants}
                  initial="initial"
                  animate="animate"
                  className="text-7xl group-hover:scale-110 transition-transform"
                  style={{ animationDelay: "2s" }}
                >
                  🇻🇳
                </motion.div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
              </div>
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-3">
                <PenTool className="w-6 h-6 text-emerald-400" /> Trạm Rèn chữ
                Việt
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Nắm vững danh từ động từ, rèn luyện đọc hiểu qua các đoạn văn
                bản hay nhất từ những nguồn tin cậy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ FINAL CTA ══════ */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-indigo-50/50 border-t border-slate-200 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring" }}
            className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-10 md:p-20 text-center shadow-2xl relative overflow-hidden"
          >
            {/* Decorative background elements inside CTA */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute -top-[50%] -left-[20%] w-[800px] h-[800px] bg-indigo-500/20 blur-3xl rounded-full mix-blend-screen"></div>
              <div className="absolute -bottom-[50%] -right-[20%] w-[800px] h-[800px] bg-purple-500/20 blur-3xl rounded-full mix-blend-screen"></div>
              <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-pink-500/20 blur-3xl rounded-full mix-blend-screen"></div>
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center mb-8 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-sm font-semibold backdrop-blur-sm shadow-xl">
                <Rocket className="w-4 h-4 mr-2 text-indigo-400" />
                Tham gia cùng +500 trường học
              </div>

              <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 tracking-tight">
                Sẵn sàng giải phóng
                <br className="hidden md:block" /> thời gian soạn bài?
              </h2>

              <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto font-medium">
                Sử dụng Age Of Study để thiết kế một phòng học tương tác, đầy
                cảm hứng cho học sinh chỉ với vài cú click.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/staff/login?role=teacher">
                  <button className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 text-xl font-bold rounded-2xl shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group">
                    Bắt đầu Dạy thử Miễn phí
                    <ArrowRight className="w-6 h-6 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-slate-400 font-medium tracking-wide">
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  Không cần tải ứng dụng
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  Miễn phí trọn đời (Gói cơ bản)
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  Hỗ trợ kỹ thuật 24/7
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 text-center border-t border-slate-800">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center justify-center gap-4 mb-8 md:mb-0 grayscale opacity-80">
            <div className="bg-white rounded p-1">
              <Image src="/school-logo.png" alt="Logo" width={48} height={48} />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-xl text-white leading-none">
                Trường Tiểu học Ninh Lai
              </span>
              <span className="text-sm">Nền tảng Age of Study</span>
            </div>
          </div>
          <div className="flex flex-col text-sm font-medium gap-1 md:text-right text-slate-500">
            <p>Cần hỗ trợ? Vui lòng liên hệ Admin qua email trường.</p>
            <p>© 2026 Bản quyền thuộc về Trường Tiểu học Ninh Lai.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
