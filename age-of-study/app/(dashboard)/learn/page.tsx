"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// Mock classroom data matching the Stitch design
const mockClassrooms = [
  {
    id: "1",
    name: "Toán Lớp 5A",
    teacher: "Cô Hằng",
    progress: 45,
    level: null,
    color: "#F97316", // orange
    bgColor: "bg-orange-100",
    barColor: "bg-red-500",
    icon: "🧮",
    status: "active",
    isNew: true,
  },
  {
    id: "2",
    name: "Tiếng Việt 4B",
    teacher: "Thầy Nam",
    progress: 80,
    level: 4,
    color: "#3B82F6", // blue
    bgColor: "bg-blue-100",
    barColor: "bg-blue-500",
    icon: "📖",
    status: null,
    isNew: false,
  },
  {
    id: "3",
    name: "Khoa Học 5C",
    teacher: "Thầy Minh",
    progress: 12,
    level: 3,
    color: "#8B5CF6", // purple
    bgColor: "bg-purple-100",
    barColor: "bg-purple-500",
    icon: "🔬",
    status: null,
    isNew: false,
  },
  {
    id: "4",
    name: "Tiếng Anh 5",
    teacher: "Cô Linh",
    progress: 60,
    level: 6,
    color: "#10B981", // green
    bgColor: "bg-green-100",
    barColor: "bg-green-500",
    icon: "🌏",
    status: null,
    isNew: false,
  },
];

export default function LearnPage() {
  const router = useRouter();
  const [classroomCode, setClassroomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomCode.trim()) return;

    setIsJoining(true);
    // TODO: Connect to Supabase
    setTimeout(() => {
      alert(`Đã tham gia lớp với mã: ${classroomCode}`);
      setClassroomCode("");
      setIsJoining(false);
    }, 1000);
  };

  const handleClassroomClick = (classroomId: string) => {
    router.push(`/classroom/${classroomId}`);
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      {/* ========== JOIN CLASSROOM BANNER ========== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-8 md:p-10 mb-10 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #6366F1 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -right-10 -top-10 w-60 h-60 rounded-full opacity-10"
          style={{ background: "white" }}
        />
        <div
          className="absolute right-20 bottom-0 w-40 h-40 rounded-full opacity-10"
          style={{ background: "white" }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Rocket Icon */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <span className="text-4xl md:text-5xl">🚀</span>
          </div>

          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
              Gia Nhập Vùng Đất Mới
            </h2>
            <p className="text-blue-100 mb-5 text-sm md:text-base">
              Có mã bí mật từ thầy cô? Nhập ngay để bắt đầu cuộc phiêu lưu!
            </p>

            <form
              onSubmit={handleJoinClassroom}
              className="flex flex-col sm:flex-row gap-3 max-w-xl"
            >
              <input
                type="text"
                value={classroomCode}
                onChange={(e) => setClassroomCode(e.target.value)}
                placeholder="Nhập mã 6 số (VD: 123456)..."
                className="flex-1 px-6 py-3.5 bg-white rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={isJoining || !classroomCode.trim()}
                className="px-8 py-3.5 rounded-full font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                style={{
                  background:
                    "linear-gradient(135deg, #F97316 0%, #EF4444 100%)",
                }}
              >
                {isJoining ? "Đang tham gia..." : "Tham gia ngay 🚀"}
              </motion.button>
            </form>
          </div>
        </div>
      </motion.div>

      {/* ========== ACTIVE CLASSROOMS SECTION ========== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {/* Section Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-xl">🏆</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Nhiệm vụ đang chờ quân sư:
          </h2>
        </div>

        {/* Classroom Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {mockClassrooms.map((classroom, index) => (
            <motion.div
              key={classroom.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.08 }}
              whileHover={{ y: -6, boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}
              onClick={() => handleClassroomClick(classroom.id)}
              className="bg-white rounded-2xl p-5 shadow-md cursor-pointer relative overflow-visible"
            >
              {/* Top Row: Icon + Status/Level */}
              <div className="flex items-start justify-between mb-4">
                {/* Subject Icon */}
                <div
                  className={`w-12 h-12 rounded-xl ${classroom.bgColor} flex items-center justify-center`}
                >
                  <span className="text-2xl">{classroom.icon}</span>
                </div>

                {/* Status & Level Badges */}
                <div className="flex flex-col items-end gap-1">
                  {classroom.isNew && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      Mới
                    </span>
                  )}
                  {classroom.status === "active" && (
                    <span className="flex items-center gap-1 text-[11px] text-green-600 font-semibold">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Đang diễn ra
                    </span>
                  )}
                  {classroom.level && (
                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                      Cấp độ {classroom.level}
                    </span>
                  )}
                </div>
              </div>

              {/* Subject Name */}
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                {classroom.name}
              </h3>

              {/* Teacher */}
              <div className="flex items-center gap-1.5 text-gray-500 mb-4">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-sm">GV: {classroom.teacher}</span>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Tiến độ
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: classroom.color }}
                  >
                    {classroom.progress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${classroom.progress}%` }}
                    transition={{
                      delay: 0.5 + index * 0.1,
                      duration: 0.8,
                      ease: "easeOut",
                    }}
                    className={`h-full ${classroom.barColor} rounded-full`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
