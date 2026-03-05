/**
 * OwnedAvatarGrid – Display-only component for the Backpack.
 *
 * Shows all avatars the student owns. Lets them equip/change active avatar.
 * NO purchasing logic here — that's in the Shop (/student/shop).
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Check, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import type { UserAvatar } from "@/types/achievement";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { changeActiveAvatar } from "@/lib/achievementService";

interface OwnedAvatarGridProps {
  userId: string;
  currentAvatar: string | null;
  onAvatarChanged: () => void;
}

export default function OwnedAvatarGrid({
  userId,
  currentAvatar,
  onAvatarChanged,
}: OwnedAvatarGridProps) {
  const router = useRouter();
  const [avatars, setAvatars] = useState<UserAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadOwnedAvatars();
  }, [userId]);

  const loadOwnedAvatars = async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();

    const { data, error: dbError } = await supabase
      .from("user_avatars")
      .select("*")
      .eq("user_id", userId)
      .eq("is_unlocked", true)
      .order("unlocked_at", { ascending: false });

    if (dbError) {
      setError(dbError.message);
    } else {
      setAvatars(data ?? []);
    }
    setLoading(false);
  };

  const handleEquip = async (avatar: UserAvatar) => {
    if (avatar.avatar_code === currentAvatar || processing) return;
    setProcessing(true);

    const { error: err } = await changeActiveAvatar(userId, avatar.avatar_code);
    setProcessing(false);

    if (err) {
      alert(`❌ ${err}`);
      return;
    }

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    onAvatarChanged();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500" />
        <span className="ml-3 text-gray-500">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">❌ {error}</p>
        <button
          onClick={loadOwnedAvatars}
          className="mt-2 text-sm text-red-700 underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (avatars.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🎭</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Chưa có avatar nào
        </h3>
        <p className="text-gray-500 mb-6">
          Hãy ghé <strong>Cửa Hàng</strong> để mua avatar bằng XP!
        </p>
        <button
          onClick={() => router.push("/student/shop?tab=avatars")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          Mở Cửa Hàng
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-900">Avatar của bạn</h2>
        </div>
        <div className="text-sm text-gray-500">
          Đang sở hữu:{" "}
          <span className="font-bold text-sky-600">{avatars.length}</span>{" "}
          avatar
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Bấm vào avatar để trang bị.{" "}
        <button
          onClick={() => router.push("/student/shop?tab=avatars")}
          className="text-sky-600 hover:underline font-medium"
        >
          Mua thêm →
        </button>
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 pt-2">
        {avatars.map((avatar, index) => {
          const isActive = avatar.avatar_code === currentAvatar;

          return (
            <motion.button
              key={avatar.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: processing ? 1 : 1.1 }}
              whileTap={{ scale: processing ? 1 : 0.95 }}
              onClick={() => handleEquip(avatar)}
              disabled={processing}
              className={`
                relative p-3 rounded-xl border-2 transition-all
                ${
                  isActive
                    ? "bg-gradient-to-br from-green-50 to-emerald-100 border-green-400 ring-4 ring-green-200"
                    : "bg-white border-gray-200 hover:border-sky-400 shadow-sm hover:shadow-md"
                }
                ${processing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {isActive && (
                <div className="absolute top-1.5 right-1.5 bg-green-500 rounded-full p-0.5 shadow">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}

              <div className="text-3xl mb-1 flex items-center justify-center">
                {avatar.avatar_code}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
