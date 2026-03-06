/**
 * Student Shop Page – /student/shop
 *
 * Two sections: Streak Freezer + Avatar Shop
 * Design: Sharp geometry, Deep Amber on Charcoal, no bento, no purple.
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  Flame,
  Snowflake,
  CheckCircle,
  AlertCircle,
  Shirt,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getShopItems,
  purchaseFreezer,
  type ShopItem,
} from "@/lib/achievementService";
import AvatarWardrobe from "@/components/student/AvatarWardrobe";

// ─── Spring preset ─────────────────────────────────────────────────────────────
const SPRING = { type: "spring", stiffness: 360, damping: 22 } as const;

// ─── Toast ──────────────────────────────────────────────────────────────────────
type Toast = { type: "success" | "error"; message: string; id: number };

// ─── Tabs ────────────────────────────────────────────────────────────────────────
type ShopTab = "items" | "avatars";

const SHOP_TABS: { id: ShopTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "items",
    label: "Vật Phẩm",
    icon: <ShoppingCart className="w-4 h-4" />,
  },
  { id: "avatars", label: "Avatar", icon: <Shirt className="w-4 h-4" /> },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ShopPage() {
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();
  const shopItems = getShopItems();

  const [activeTab, setActiveTab] = useState<ShopTab>("items");
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(shopItems.map((i) => [i.id, 1])),
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [localFreezeCount, setLocalFreezeCount] = useState<number | null>(null);
  const [localXP, setLocalXP] = useState<number | null>(null);

  if (!user) return null;

  const currentXP = localXP ?? user.total_xp;
  const currentFreezeCount = localFreezeCount ?? user.freeze_count;

  function addToast(type: Toast["type"], message: string) {
    const id = Date.now();
    setToasts((prev) => [...prev, { type, message, id }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }

  function adjustQuantity(itemId: string, delta: number, item: ShopItem) {
    setQuantities((prev) => {
      const next = Math.max(
        1,
        Math.min(item.maxQuantity, (prev[itemId] ?? 1) + delta),
      );
      return { ...prev, [itemId]: next };
    });
  }

  async function handlePurchase(item: ShopItem) {
    if (!user) return;
    const qty = quantities[item.id] ?? 1;

    if (item.id === "streak_freezer") {
      setLoading(item.id);
      const { data, error } = await purchaseFreezer(
        user.id,
        qty,
        item.xpCostPer,
      );
      setLoading(null);

      if (error) {
        addToast("error", error);
      } else if (data) {
        setLocalXP(data.newXP);
        setLocalFreezeCount(data.newFreezeCount);
        addToast("success", `Mua thành công ${qty} Streak Freezer! 🧊`);
        checkAuth();
      }
    }
  }

  const handleAvatarChanged = async () => {
    await checkAuth();
    setLocalXP(null);
  };

  return (
    <div className="min-h-screen bg-[#111] text-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#111]/90 backdrop-blur border-b border-[#2A2A2A]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Quay lại"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Quay lại</span>
          </button>

          <h1 className="text-xl font-black tracking-tight text-white uppercase flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            Cửa Hàng
          </h1>

          <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 px-3 py-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black text-amber-400 tabular-nums">
              {currentXP.toLocaleString("vi-VN")} XP
            </span>
          </div>
        </div>
      </header>

      {/* ── Stats strip ── */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-2">
        <div className="grid grid-cols-3 divide-x divide-[#2A2A2A] border border-[#2A2A2A]">
          <StatPill
            icon={<Flame className="w-4 h-4 text-orange-400" />}
            label="Streak"
            value={`${user.current_streak} ngày`}
          />
          <StatPill
            icon={<Snowflake className="w-4 h-4 text-sky-400" />}
            label="Freezers"
            value={currentFreezeCount.toString()}
            highlight
          />
          <StatPill
            icon={<Zap className="w-4 h-4 text-amber-400" />}
            label="Tổng XP"
            value={currentXP.toLocaleString("vi-VN")}
          />
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex border-b border-[#2A2A2A]">
          {SHOP_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-3 text-sm font-black uppercase tracking-wider transition-colors relative
                ${activeTab === tab.id ? "text-amber-400" : "text-gray-500 hover:text-gray-300"}
              `}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="shopTabLine"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"
                  transition={SPRING}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === "items" && (
          <motion.main
            key="items"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-4xl mx-auto px-4 py-8 space-y-6"
          >
            <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
              Vật phẩm có sẵn
            </p>

            {shopItems.map((item) => {
              const qty = quantities[item.id] ?? 1;
              const totalCost = qty * item.xpCostPer;
              const canAfford = currentXP >= totalCost;
              const isLoading = loading === item.id;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={SPRING}
                  className="border border-[#2A2A2A] bg-[#191919] p-6 flex flex-col sm:flex-row gap-6"
                >
                  <div className="text-5xl sm:text-6xl leading-none select-none shrink-0 self-start sm:self-center">
                    {item.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400/70 mb-1 block">
                          {item.category}
                        </span>
                        <h2 className="text-xl font-black tracking-tight text-white">
                          {item.name}
                        </h2>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-black text-amber-400 tabular-nums">
                          {item.xpCostPer.toLocaleString("vi-VN")}
                          <span className="text-sm font-normal text-amber-400/60 ml-1">
                            XP / cái
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-5 flex items-center gap-3 flex-wrap">
                      {/* Quantity selector */}
                      <div className="flex items-center border border-[#333]">
                        <button
                          onClick={() => adjustQuantity(item.id, -1, item)}
                          className="px-3 py-2 text-gray-400 hover:text-white hover:bg-[#2A2A2A] transition-colors"
                          aria-label="Giảm"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 text-base font-black tabular-nums min-w-[3rem] text-center">
                          {qty}
                        </span>
                        <button
                          onClick={() => adjustQuantity(item.id, 1, item)}
                          className="px-3 py-2 text-gray-400 hover:text-white hover:bg-[#2A2A2A] transition-colors"
                          aria-label="Tăng"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-sm font-mono text-gray-500">
                        ={" "}
                        <span
                          className={
                            canAfford
                              ? "text-amber-400 font-black"
                              : "text-red-400 font-black"
                          }
                        >
                          {totalCost.toLocaleString("vi-VN")} XP
                        </span>
                      </div>

                      <motion.button
                        onClick={() => handlePurchase(item)}
                        disabled={isLoading || !canAfford}
                        whileHover={
                          canAfford && !isLoading ? { scale: 1.03 } : {}
                        }
                        whileTap={
                          canAfford && !isLoading ? { scale: 0.97 } : {}
                        }
                        transition={SPRING}
                        className={`
                          w-full sm:w-auto sm:ml-auto px-6 py-2.5 font-black text-sm uppercase tracking-wider transition-colors
                          ${
                            canAfford && !isLoading
                              ? "bg-amber-400 text-black hover:bg-amber-300 cursor-pointer"
                              : "bg-[#2A2A2A] text-gray-600 cursor-not-allowed"
                          }
                        `}
                      >
                        {isLoading ? (
                          <motion.span
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                          >
                            Đang mua...
                          </motion.span>
                        ) : canAfford ? (
                          "Mua"
                        ) : (
                          "Thiếu XP"
                        )}
                      </motion.button>
                    </div>

                    <p className="mt-2 text-[11px] text-gray-600 font-mono">
                      Tối đa {item.maxQuantity} cái mỗi lần mua · Hiện có:{" "}
                      <span className="text-sky-400">
                        {currentFreezeCount} ❄️
                      </span>
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.main>
        )}

        {activeTab === "avatars" && (
          <motion.div
            key="avatars"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-4xl mx-auto px-4 py-8"
          >
            <div className="bg-white rounded-xl p-6">
              <AvatarWardrobe
                userId={user.id}
                currentAvatar={user.avatar_url}
                userXP={currentXP}
                onAvatarChanged={handleAvatarChanged}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toasts ── */}
      <div className="fixed bottom-24 md:bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={SPRING}
              className={`
                flex items-center gap-3 px-4 py-3 text-sm font-semibold pointer-events-auto
                ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}
              `}
            >
              {toast.type === "success" ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

function StatPill({ icon, label, value, highlight }: StatPillProps) {
  return (
    <div className="flex flex-col items-center py-4 gap-1">
      <div className="flex items-center gap-1 text-gray-500 text-xs uppercase tracking-widest font-mono">
        {icon}
        {label}
      </div>
      <span
        className={`text-xl font-black tabular-nums ${highlight ? "text-sky-400" : "text-white"}`}
      >
        {value}
      </span>
    </div>
  );
}
