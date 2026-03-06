"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Lock, Sparkles, Trophy, ExternalLink, Star } from "lucide-react";
import confetti from "canvas-confetti";
import Loading, { LoadingSpinner } from "@/components/ui/loading";
import Link from "next/link";
import Image from "next/image";
import { getBadgeCollection } from "@/lib/achievementService";
import type { BadgeWithStatus } from "@/types/achievement";

const SUBJECTS = [
  { id: "math", name: "Toán Học", icon: "🔢", color: "bg-red-100 border-red-300 hover:bg-red-200" },
  { id: "english", name: "Tiếng Anh", icon: "🇬🇧", color: "bg-blue-100 border-blue-300 hover:bg-blue-200" },
  { id: "vietnamese", name: "Tiếng Việt", icon: "🇻🇳", color: "bg-green-100 border-green-300 hover:bg-green-200" },
  { id: "science", name: "Khoa Học", icon: "🔬", color: "bg-purple-100 border-purple-300 hover:bg-purple-200" },
  { id: "art", name: "Mỹ Thuật", icon: "🎨", color: "bg-pink-100 border-pink-300 hover:bg-pink-200" },
  { id: "music", name: "Âm Nhạc", icon: "🎵", color: "bg-yellow-100 border-yellow-300 hover:bg-yellow-200" },
];

function HeroAvatar({ avatarUrl, name }: { avatarUrl: string | null; name: string | null }) {
  const [imageError, setImageError] = useState(false);
  const initial = (name?.charAt(0) || "?").toUpperCase();

  if (!avatarUrl || imageError) {
    return (
      <div className="w-20 h-20 rounded-2xl bg-white/25 flex items-center justify-center text-white text-3xl font-black shadow-lg flex-shrink-0">
        {initial}
      </div>
    );
  }

  const isEmoji = !avatarUrl.startsWith("http") && !avatarUrl.startsWith("/");

  if (isEmoji) {
    return (
      <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg flex-shrink-0">
        <span className="text-5xl">{avatarUrl}</span>
      </div>
    );
  }

  return (
    <div className="w-20 h-20 rounded-2xl bg-white/20 relative overflow-hidden shadow-lg flex-shrink-0">
      <Image
        src={avatarUrl}
        alt={name || "Avatar"}
        fill
        className="object-cover"
        onError={() => setImageError(true)}
        unoptimized
      />
    </div>
  );
}

export default function StudentProfilePage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasReceivedXP, setHasReceivedXP] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<BadgeWithStatus[]>([]);

  // Only the fields a student can personalize
  const [favoriteSubject, setFavoriteSubject] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFavoriteSubject(user.favorite_subject || "");
      setHasReceivedXP(user.profile_completed_reward_claimed || false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getBadgeCollection(user.id).then((res) => {
        if (res.data) {
          setEarnedBadges(res.data.filter((b) => b.is_earned).slice(0, 3));
        }
      });
    }
  }, [user]);

  const canEarnXP = !hasReceivedXP && !!favoriteSubject;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const shouldAwardXP = canEarnXP;

      const updates: Record<string, unknown> = {
        favorite_subject: favoriteSubject,
        updated_at: new Date().toISOString(),
      };

      if (shouldAwardXP) {
        updates.total_xp = (user.total_xp || 0) + 100;
        updates.profile_completed_reward_claimed = true;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      await checkAuth();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      if (shouldAwardXP) {
        setHasReceivedXP(true);
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
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
        <Loading message="Đang tải hồ sơ..." size="md" />
      </div>
    );
  }

  const subjectInfo = SUBJECTS.find((s) => s.id === user.favorite_subject);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-2xl">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-1">
          Hồ Sơ Của Tôi
        </h1>
        <p className="text-gray-400 text-sm">Thông tin và thành tích của bạn</p>
      </motion.div>

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-3xl p-6 mb-5 text-white shadow-2xl"
      >
        <div className="flex items-center gap-5">
          <HeroAvatar avatarUrl={user.avatar_url} name={user.full_name} />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-black truncate leading-tight">
              {user.full_name || user.username || "Học sinh"}
            </h2>
            {user.grade && (
              <p className="text-blue-100 font-semibold text-sm mt-0.5">
                Lớp {user.grade}
              </p>
            )}
            {subjectInfo && (
              <p className="text-blue-100 text-xs mt-1">
                Yêu thích: {subjectInfo.icon} {subjectInfo.name}
              </p>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black">{user.current_streak}</div>
            <div className="text-xs text-blue-100 mt-0.5">🔥 Streak</div>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black">
              {user.total_xp >= 1000
                ? `${(user.total_xp / 1000).toFixed(1)}k`
                : user.total_xp}
            </div>
            <div className="text-xs text-blue-100 mt-0.5">⭐ Tổng XP</div>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black">
              {user.weekly_xp >= 1000
                ? `${(user.weekly_xp / 1000).toFixed(1)}k`
                : user.weekly_xp}
            </div>
            <div className="text-xs text-blue-100 mt-0.5">⚡ Tuần này</div>
          </div>
        </div>
      </motion.div>

      {/* Identity Info — Read-only */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-5 mb-5 border-2 border-gray-100 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-black text-gray-600 uppercase tracking-wide">
            Thông Tin Nhà Trường
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Họ và tên
            </div>
            <div className="font-bold text-gray-800 text-sm truncate">
              {user.full_name || "—"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Lớp
            </div>
            <div className="font-bold text-gray-800 text-sm">
              {user.grade ? `Lớp ${user.grade}` : "—"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Tuổi
            </div>
            <div className="font-bold text-gray-800 text-sm">
              {user.age ? `${user.age} tuổi` : "—"}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Lock className="w-3 h-3 flex-shrink-0" />
          Thông tin do nhà trường cung cấp. Nếu có sai sót, hãy báo với thầy cô nhé!
        </p>
      </motion.div>

      {/* Personalization — Editable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl p-5 mb-5 border-2 border-blue-100 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-5">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h2 className="text-lg font-black text-gray-800">Tùy Chỉnh Của Tôi</h2>
          {!hasReceivedXP && (
            <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full whitespace-nowrap">
              Hoàn thành → +100 XP 🎉
            </span>
          )}
        </div>

        {/* Favorite Subject */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Môn học yêu thích của bạn? ❤️
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {SUBJECTS.map((subject) => (
              <motion.button
                key={subject.id}
                onClick={() => setFavoriteSubject(subject.id)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`p-3 rounded-xl border-2 transition-all ${
                  favoriteSubject === subject.id
                    ? `${subject.color} border-current shadow-md`
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-1">{subject.icon}</div>
                <div className="text-xs font-bold text-gray-800 leading-tight">
                  {subject.name}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Avatar hint */}
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 mb-5">
          <p className="text-sm text-gray-600">
            <span className="font-bold text-purple-600">🎭 Đổi avatar?</span>{" "}
            Ghé{" "}
            <Link
              href="/student/backpack"
              className="font-bold text-purple-600 underline hover:text-purple-700"
            >
              Balo Thành Tích
            </Link>{" "}
            để mở khóa nhân vật mới bằng XP!
          </p>
        </div>

        {/* Save Button */}
        <motion.button
          onClick={handleSave}
          disabled={saving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg font-black rounded-2xl shadow-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              Đang lưu...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Save className="w-5 h-5" />
              Lưu thay đổi
            </span>
          )}
        </motion.button>
      </motion.div>

      {/* Achievement Snapshot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-5 border-2 border-yellow-100 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-black text-gray-800">Thành Tích Nổi Bật</h2>
          </div>
          <Link
            href="/student/backpack"
            className="flex items-center gap-1 text-sm font-semibold text-blue-500 hover:text-blue-600 transition-colors"
          >
            Xem tất cả
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {earnedBadges.length > 0 ? (
          <div className="flex gap-3">
            {earnedBadges.map((badge) => (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.08 }}
                className="flex-1 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-3 text-center"
              >
                {badge.icon_url ? (
                  <div className="text-3xl mb-1">{badge.icon_url}</div>
                ) : (
                  <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-1" />
                )}
                <div className="text-xs font-bold text-gray-700 leading-tight">
                  {badge.name}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Chưa có huy hiệu nào.</p>
            <p className="text-xs mt-1">Hãy học để mở khóa nhé! 💪</p>
          </div>
        )}
      </motion.div>

      {/* Success Toast */}
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
