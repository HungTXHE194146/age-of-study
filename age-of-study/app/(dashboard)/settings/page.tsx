"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Star, Trophy, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import Loading, { LoadingSpinner } from "@/components/ui/loading";

const SUBJECTS = [
  {
    id: "math",
    name: "Toán Học",
    icon: "🔢",
    color: "bg-red-100 border-red-300 hover:bg-red-200",
  },
  {
    id: "english",
    name: "Tiếng Anh",
    icon: "🇬🇧",
    color: "bg-blue-100 border-blue-300 hover:bg-blue-200",
  },
  {
    id: "vietnamese",
    name: "Tiếng Việt",
    icon: "🇻🇳",
    color: "bg-green-100 border-green-300 hover:bg-green-200",
  },
  {
    id: "science",
    name: "Khoa Học",
    icon: "🔬",
    color: "bg-purple-100 border-purple-300 hover:bg-purple-200",
  },
  {
    id: "art",
    name: "Mỹ Thuật",
    icon: "🎨",
    color: "bg-pink-100 border-pink-300 hover:bg-pink-200",
  },
  {
    id: "music",
    name: "Âm Nhạc",
    icon: "🎵",
    color: "bg-yellow-100 border-yellow-300 hover:bg-yellow-200",
  },
];

const STUDY_GOALS = [15, 30, 45, 60];

export default function StudentSettingsPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasReceivedXP, setHasReceivedXP] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [grade, setGrade] = useState<number | "">("");
  const [favoriteSubject, setFavoriteSubject] = useState("");
  const [dailyGoal, setDailyGoal] = useState(30);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Load user data
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setAge(user.age || "");
      setGrade(user.grade || "");
      setFavoriteSubject(user.favorite_subject || "");
      setDailyGoal(user.daily_limit_minutes || 30);
      setHasReceivedXP(user.profile_completed_reward_claimed || false);
    }
  }, [user]);

  // Calculate profile completion
  const getCompletionPercentage = () => {
    const fields = [
      fullName,
      age,
      grade,
      favoriteSubject,
      dailyGoal,
    ];
    const completed = fields.filter(
      (field) => field !== "" && field !== null && field !== undefined,
    ).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completionPercentage = getCompletionPercentage();
  const isProfileComplete = completionPercentage === 100;

  // Trigger confetti on completion
  useEffect(() => {
    if (isProfileComplete && !hasReceivedXP) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isProfileComplete, hasReceivedXP]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();

      // Check if this is first time completing profile
      const shouldAwardXP = isProfileComplete && !hasReceivedXP;
      const newTotalXP = shouldAwardXP
        ? (user.total_xp || 0) + 100
        : user.total_xp;

      const updates = {
        full_name: fullName,
        age: age === "" ? null : age,
        grade: grade === "" ? null : grade,
        favorite_subject: favoriteSubject,
        daily_limit_minutes: dailyGoal,
        total_xp: newTotalXP,
        profile_completed_reward_claimed: shouldAwardXP ? true : hasReceivedXP,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      // Update local auth store
      await checkAuth();

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      if (shouldAwardXP) {
        setHasReceivedXP(true);
        // Extra confetti for XP reward
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5 },
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Ối! Có lỗi xảy ra. Hãy thử lại nhé!");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading message="Đang tải thông tin cá nhân..." size="md" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 sm:mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
          ⚙️ Cài Đặt Của Bạn
        </h1>
        {!hasReceivedXP && (
          <p className="text-base sm:text-lg text-gray-600">
            Hãy hoàn thiện thông tin để nhận{" "}
            <span className="font-bold text-green-600">100 XP</span>! 🎉
          </p>
        )}
      </motion.div>

      {/* XP Reward Banner */}
      {!hasReceivedXP && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 border-2 sm:border-4 border-white shadow-2xl"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <Trophy className="w-8 h-8 sm:w-12 sm:h-12" />
              <div>
                <h3 className="text-lg sm:text-2xl font-black">Phần Thưởng Đặc Biệt!</h3>
                <p className="text-sm sm:text-lg">Hoàn thành hồ sơ để nhận 100 XP</p>
              </div>
            </div>
            <div className="text-3xl sm:text-5xl font-black">+100 XP</div>
          </div>
        </motion.div>
      )}

      {/* Progress Bar */}
      {!hasReceivedXP && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg mb-6 sm:mb-8 border-2 border-blue-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-gray-800">
              Tiến Độ Hoàn Thiện
            </span>
            <span className="text-2xl font-black text-blue-600">
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center"
            >
              {completionPercentage > 10 && (
                <span className="text-xs font-bold text-white">
                  {completionPercentage}%
                </span>
              )}
            </motion.div>
          </div>
          {isProfileComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-center text-green-600 font-bold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Hoàn thành rồi! Tuyệt vời!</span>
              <Sparkles className="w-5 h-5" />
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Settings Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border-2 border-gray-200"
      >
        {/* Avatar Info Banner */}
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
          <p className="text-sm text-gray-700">
            <span className="font-bold text-purple-600">💡 Mẹo:</span> Muốn đổi avatar? 
            Ghé qua <a href="/backpack" className="font-bold text-purple-600 hover:text-purple-700 underline">Balo Thành Tích</a> để mở khóa và chọn avatar mới bằng XP nhé! 🎒✨
          </p>
        </div>

        <div className="space-y-8">
          {/* Basic Info Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <h2 className="text-2xl font-black text-gray-900">
                Thông Tin Cơ Bản
              </h2>
            </div>

            {/* Full Name */}
            <div className="mb-6">
              <label className="block text-lg font-bold text-gray-700 mb-2">
                Tên của bạn là gì? 👤
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 Đây là tên thật của bạn nhé!
              </p>
            </div>

            {/* Age and Grade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-base sm:text-lg font-bold text-gray-700 mb-2">
                  Bạn bao nhiêu tuổi? 🎂
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) =>
                    setAge(e.target.value ? parseInt(e.target.value) : "")
                  }
                  min="6"
                  max="12"
                  placeholder="8"
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-base sm:text-lg font-bold text-gray-700 mb-2">
                  Bạn học lớp mấy? 📚
                </label>
                <select
                  value={grade}
                  onChange={(e) =>
                    setGrade(e.target.value ? parseInt(e.target.value) : "")
                  }
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Chọn lớp</option>
                  <option value="1">Lớp 1</option>
                  <option value="2">Lớp 2</option>
                  <option value="3">Lớp 3</option>
                  <option value="4">Lớp 4</option>
                  <option value="5">Lớp 5</option>
                </select>
              </div>
            </div>
          </div>

          {/* Favorite Subject */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <h2 className="text-2xl font-black text-gray-900">
                Môn Học Yêu Thích ❤️
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              💡 Bạn thích học môn nào nhất?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {SUBJECTS.map((subject) => (
                <motion.button
                  key={subject.id}
                  onClick={() => setFavoriteSubject(subject.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    favoriteSubject === subject.id
                      ? `${subject.color} border-current shadow-lg`
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{subject.icon}</div>
                    <div className="font-bold text-gray-800">
                      {subject.name}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Study Goal */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <h2 className="text-2xl font-black text-gray-900">
                Mục Tiêu Học Tập Mỗi Ngày ⏰
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              💡 Bạn muốn học bao nhiêu phút mỗi ngày?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {STUDY_GOALS.map((minutes) => (
                <motion.button
                  key={minutes}
                  onClick={() => setDailyGoal(minutes)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 sm:border-4 transition-all ${
                    dailyGoal === minutes
                      ? "border-green-500 bg-green-100 shadow-lg"
                      : "border-gray-300 bg-gray-50 hover:border-green-300"
                  }`}
                >
                  <div className="text-2xl sm:text-3xl font-black text-gray-800">
                    {minutes}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-600">
                    phút
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <motion.button
          onClick={handleSave}
          disabled={saving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-6 sm:mt-8 px-6 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg sm:text-2xl font-black rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-white hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center justify-center gap-2 sm:gap-3">
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                Đang lưu...
                <LoadingSpinner size="sm" />
              </>
            ) : (
              <>
                <Save className="w-5 h-5 sm:w-8 sm:h-8" />
                Lưu Thay Đổi
                <Save className="w-5 h-5 sm:w-8 sm:h-8" />
              </>
            )}
          </span>
        </motion.button>
      </motion.div>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-8 py-4 rounded-full shadow-2xl font-bold text-lg z-50"
          >
            <span className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              Đã lưu thành công! 🎉
              <Sparkles className="w-6 h-6" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
