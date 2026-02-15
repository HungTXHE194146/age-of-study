/**
 * Avatar Wardrobe Component
 * 
 * Displays student's avatar collection:
 * - Shows all available avatars from the shop
 * - Owned avatars are highlighted
 * - Click to equip/change active avatar
 * - Shows XP cost for locked avatars
 * - Can purchase new avatars with XP
 * 
 * Clean code practices:
 * - Clear state management with loading/error states
 * - Proper user feedback for actions
 * - Confirmation before spending XP
 * - Optimistic UI updates
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Crown, Sparkles, Lock, Check, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AvatarWithStatus } from '@/types/achievement';
import {
  getAvatarWardrobe,
  unlockAvatar,
  changeActiveAvatar,
} from '@/lib/achievementService';

interface AvatarWardrobeProps {
  userId: string;
  currentAvatar: string | null;
  userXP: number;
  onAvatarChanged: () => void; // Callback to refresh user data
}

export default function AvatarWardrobe({
  userId,
  currentAvatar,
  userXP,
  onAvatarChanged,
}: AvatarWardrobeProps) {
  const [avatars, setAvatars] = useState<AvatarWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarWithStatus | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAvatars();
  }, [userId]);

  const loadAvatars = async () => {
    setLoading(true);
    setError(null);

    const response = await getAvatarWardrobe(userId);

    if (response.error) {
      setError(response.error);
      setLoading(false);
      return;
    }

    setAvatars(response.data ?? []);
    setLoading(false);
  };

  const handleEquipAvatar = async (avatar: AvatarWithStatus) => {
    if (!avatar.is_owned) {
      // Show purchase modal
      setSelectedAvatar(avatar);
      return;
    }

    // Equip avatar
    setProcessing(true);

    const response = await changeActiveAvatar(userId, avatar.avatar_code);

    if (response.error) {
      alert(`❌ ${response.error}`);
      setProcessing(false);
      return;
    }

    // Success!
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    onAvatarChanged(); // Refresh parent component
    setProcessing(false);
  };

  const handlePurchaseAvatar = async (avatar: AvatarWithStatus) => {
    if (!avatar.can_afford) {
      alert('❌ Bạn không đủ XP để mua avatar này!');
      return;
    }

    setProcessing(true);

    const response = await unlockAvatar(userId, {
      avatar_code: avatar.avatar_code,
      avatar_type: avatar.avatar_type,
      xp_cost: avatar.xp_cost,
      source: 'purchase',
    });

    if (response.error) {
      alert(`❌ ${response.error}`);
      setProcessing(false);
      setSelectedAvatar(null);
      return;
    }

    // Success! Confetti time!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Reload avatars and refresh parent
    await loadAvatars();
    onAvatarChanged();
    setProcessing(false);
    setSelectedAvatar(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-600">Đang tải tủ đồ...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">❌ {error}</p>
        <button
          onClick={loadAvatars}
          className="mt-2 text-sm text-red-700 underline hover:text-red-800"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Group avatars by category
  const categories = ['all', ...Array.from(new Set(avatars.map((a) => a.category).filter(Boolean)))];
  const filteredAvatars =
    selectedCategory === 'all'
      ? avatars
      : avatars.filter((a) => a.category === selectedCategory);

  const ownedCount = avatars.filter((a) => a.is_owned).length;
  const totalCount = avatars.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-purple-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tủ Đồ Avatar</h2>
              <p className="text-sm text-gray-600">
                Bấm vào avatar để thay đổi hình đại diện
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Đã sở hữu</div>
            <div className="text-3xl font-bold text-purple-600">
              {ownedCount}/{totalCount}
            </div>
          </div>
        </div>

        {/* XP Balance */}
        <div className="flex items-center gap-2 bg-white/60 backdrop-blur rounded-lg px-4 py-2 border border-purple-200">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-semibold text-gray-700">
            Số XP hiện tại:
          </span>
          <span className="text-lg font-bold text-yellow-600">{userXP}</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category as string)}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors
              ${
                selectedCategory === category
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {getCategoryLabel(category as string)}
          </button>
        ))}
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {filteredAvatars.map((avatar, index) => (
          <AvatarCard
            key={avatar.id}
            avatar={avatar}
            index={index}
            isActive={avatar.avatar_code === currentAvatar}
            onClick={() => handleEquipAvatar(avatar)}
            disabled={processing}
          />
        ))}
      </div>

      {/* Purchase Confirmation Modal */}
      <AnimatePresence>
        {selectedAvatar && !selectedAvatar.is_owned && (
          <PurchaseModal
            avatar={selectedAvatar}
            userXP={userXP}
            onConfirm={() => handlePurchaseAvatar(selectedAvatar)}
            onCancel={() => setSelectedAvatar(null)}
            processing={processing}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Avatar Card Component
// ============================================================================

interface AvatarCardProps {
  avatar: AvatarWithStatus;
  index: number;
  isActive: boolean;
  onClick: () => void;
  disabled: boolean;
}

function AvatarCard({ avatar, index, isActive, onClick, disabled }: AvatarCardProps) {
  const isOwned = avatar.is_owned;
  const isPremium = avatar.is_premium;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-3 rounded-xl border-2 transition-all
        ${
          isActive
            ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-400 ring-4 ring-green-200'
            : isOwned
              ? 'bg-white border-gray-300 hover:border-purple-400 shadow-sm hover:shadow-md'
              : 'bg-gray-50 border-gray-200 hover:border-purple-300'
        }
        ${isPremium ? 'ring-2 ring-yellow-300' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1 shadow-lg">
          <Crown className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Locked Overlay */}
      {!isOwned && (
        <div className="absolute top-2 left-2 bg-gray-700/80 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
          <Lock className="w-3 h-3 text-white" />
          <span className="text-[10px] font-bold text-white">{avatar.xp_cost}</span>
        </div>
      )}

      {/* Active Checkmark */}
      {isActive && (
        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-lg">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Avatar Display */}
      <div
        className={`
        text-4xl mb-2 flex items-center justify-center
        ${!isOwned ? 'grayscale opacity-60' : ''}
      `}
      >
        {avatar.avatar_code}
      </div>

      {/* Avatar Name */}
      <div className="text-xs font-semibold text-gray-700 text-center line-clamp-1">
        {avatar.display_name}
      </div>

      {/* XP Cost for Locked Avatars */}
      {!isOwned && (
        <div className="text-[10px] text-gray-500 text-center mt-1 flex items-center justify-center gap-1">
          <ShoppingBag className="w-3 h-3" />
          {avatar.xp_cost} XP
        </div>
      )}
    </motion.button>
  );
}

// ============================================================================
// Purchase Confirmation Modal
// ============================================================================

interface PurchaseModalProps {
  avatar: AvatarWithStatus;
  userXP: number;
  onConfirm: () => void;
  onCancel: () => void;
  processing: boolean;
}

function PurchaseModal({
  avatar,
  userXP,
  onConfirm,
  onCancel,
  processing,
}: PurchaseModalProps) {
  const canAfford = userXP >= avatar.xp_cost;
  const remainingXP = userXP - avatar.xp_cost;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-md w-full bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-2xl border-2 border-purple-200"
      >
        <button
          onClick={onCancel}
          disabled={processing}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors disabled:opacity-50"
        >
          ✕
        </button>

        {/* Avatar Preview */}
        <div className="text-center mb-6">
          <div className="text-8xl mb-4">{avatar.avatar_code}</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {avatar.display_name}
          </h3>
          {avatar.description && (
            <p className="text-sm text-gray-600">{avatar.description}</p>
          )}
        </div>

        {/* Price Info */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
            <span className="text-sm font-semibold text-gray-700">Giá:</span>
            <span className="text-lg font-bold text-purple-600 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              {avatar.xp_cost} XP
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
            <span className="text-sm font-semibold text-gray-700">XP hiện tại:</span>
            <span className="text-lg font-bold text-gray-900">{userXP} XP</span>
          </div>

          <div
            className={`
            flex justify-between items-center p-3 rounded-lg
            ${canAfford ? 'bg-green-100' : 'bg-red-100'}
          `}
          >
            <span className="text-sm font-semibold text-gray-700">Sau khi mua:</span>
            <span
              className={`text-lg font-bold ${canAfford ? 'text-green-600' : 'text-red-600'}`}
            >
              {remainingXP} XP
            </span>
          </div>
        </div>

        {/* Warning if can't afford */}
        {!canAfford && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">
              <p className="font-semibold mb-1">Không đủ XP!</p>
              <p>Bạn cần thêm {avatar.xp_cost - userXP} XP nữa.</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={!canAfford || processing}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {processing ? '⏳ Đang mua...' : '✨ Mua ngay'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    all: '🌈 Tất cả',
    default: '😊 Mặc định',
    animals: '🐾 Động vật',
    fantasy: '🦄 Thần thoại',
    premium: '👑 Cao cấp',
    cool: '😎 Ngầu',
    cute: '🥰 Dễ thương',
  };

  return labels[category] || category;
}
