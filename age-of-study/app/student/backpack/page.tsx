/**
 * Achievement Backpack Page (Balo Thành Tích)
 *
 * Shows only what the student OWNS:
 * - Badges (Huy Hiệu)
 * - Owned Avatars (Avatar đã sở hữu — no shopping, just display)
 * - Certificates (Bằng Khen)
 *
 * Avatar purchasing has moved to /student/shop.
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Backpack, Trophy, Smile, Award, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import BadgeCollection from "@/components/student/BadgeCollection";
import DigitalCertificates from "@/components/student/DigitalCertificates";
import OwnedAvatarGrid from "@/components/student/OwnedAvatarGrid";

type TabType = "badges" | "avatars" | "certificates";

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

const TABS: Tab[] = [
  {
    id: "badges",
    label: "Huy Hiệu",
    icon: Trophy,
    color: "from-yellow-500 to-orange-500",
    description: "Bộ sưu tập huy hiệu",
  },
  {
    id: "avatars",
    label: "Avatar",
    icon: Smile,
    color: "from-sky-500 to-blue-500",
    description: "Avatar đã sở hữu",
  },
  {
    id: "certificates",
    label: "Bằng Khen",
    icon: Award,
    color: "from-blue-500 to-cyan-500",
    description: "Bằng khen từ giáo viên",
  },
];

export default function BackpackPage() {
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("badges");

  const handleAvatarChanged = async () => {
    await checkAuth();
  };

  if (!user) {
    return null;
  }

  const activeTabData = TABS.find((tab) => tab.id === activeTab)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Back Button & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>

              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Backpack className="w-8 h-8 text-sky-600" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Balo Thành Tích
                  </h1>
                  <p className="text-sm text-gray-600">
                    Kho tàng của {user.full_name || "bạn"}
                  </p>
                </div>
              </div>
            </div>

            {/* User XP Display */}
            <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-full border-2 border-yellow-300">
              <span className="text-2xl">✨</span>
              <div>
                <div className="text-xs text-gray-600">XP của bạn</div>
                <div className="text-lg font-bold text-yellow-600">
                  {user.total_xp.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-all
                    ${
                      isActive
                        ? "bg-white shadow-lg scale-105"
                        : "bg-white/60 hover:bg-white/80"
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute inset-0 bg-gradient-to-r ${tab.color} opacity-10 rounded-lg`}
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}

                  <Icon
                    className={`w-5 h-5 relative z-10 ${isActive ? "text-sky-600" : "text-gray-600"}`}
                  />

                  <span
                    className={isActive ? "text-gray-900" : "text-gray-600"}
                  >
                    {tab.label}
                  </span>

                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r ${tab.color} rounded-full`}
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Description */}
        <motion.div
          key={`${activeTab}-description`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-md border border-gray-200">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <activeTabData.icon className="w-5 h-5 text-gray-600" />
            </motion.div>
            <span className="font-semibold text-gray-700">
              {activeTabData.description}
            </span>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={`${activeTab}-content`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
        >
          {activeTab === "badges" && <BadgeCollection userId={user.id} />}

          {activeTab === "avatars" && (
            <OwnedAvatarGrid
              userId={user.id}
              currentAvatar={user.avatar_url}
              onAvatarChanged={handleAvatarChanged}
            />
          )}

          {activeTab === "certificates" && (
            <DigitalCertificates
              studentId={user.id}
              studentName={user.full_name || user.username || "Học sinh"}
            />
          )}
        </motion.div>

        {/* Stats Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <StatsCard
            icon="🏆"
            label="Streak hiện tại"
            value={`${user.current_streak} ngày`}
            color="from-orange-400 to-red-400"
          />
          <StatsCard
            icon="⚡"
            label="XP tuần này"
            value={user.weekly_xp.toLocaleString()}
            color="from-blue-400 to-cyan-400"
          />
          <StatsCard
            icon="🌟"
            label="XP tháng này"
            value={user.monthly_xp.toLocaleString()}
            color="from-sky-400 to-blue-400"
          />
        </motion.div>
      </div>
    </div>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

interface StatsCardProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

function StatsCard({ icon, label, value, color }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white rounded-xl p-4 shadow-md border border-gray-200"
    >
      <div className="flex items-center gap-3">
        <div
          className={`text-3xl bg-gradient-to-br ${color} w-12 h-12 rounded-lg flex items-center justify-center shadow-lg`}
        >
          {icon}
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            {label}
          </div>
          <div className="text-xl font-bold text-gray-900">{value}</div>
        </div>
      </div>
    </motion.div>
  );
}
