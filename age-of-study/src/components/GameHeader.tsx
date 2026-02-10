"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";

// Navigation items
const navItems = [
  { href: "/", label: "Trang chủ", emoji: "🗺️" },
  { href: "/learn", label: "Học", emoji: "⚔️" },
  { href: "/ranking", label: "Xếp hạng", emoji: "🏆" },
  { href: "/badges", label: "Huy hiệu", emoji: "🎒" },
];

// Wiggle animation
const wiggle = {
  hover: {
    rotate: [0, -8, 8, -8, 8, 0],
    scale: 1.2,
    transition: { duration: 0.5 },
  },
};

export default function GameHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
    router.push("/login");
  };

  // Player stats (from auth store or defaults)
  const streak = user?.current_streak ?? 0;
  const xp = user?.total_xp ?? 0;
  const displayName = user?.full_name ?? user?.username ?? "Học sinh";

  return (
    <>
      {/* ===== DESKTOP HEADER (sticky top) ===== */}
      <header className="sticky top-0 z-50 hidden md:block">
        <div className="mx-4 mt-3">
          <div
            className="bg-white/95 backdrop-blur-sm rounded-full shadow-lg px-6 py-2 flex items-center justify-between"
            style={{
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
            }}
          >
            {/* === LEFT: Logo & Branding === */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-3xl">🦉</span>
              <span
                className="text-xl font-black tracking-tight"
                style={{
                  color: "#1a56db",
                  textShadow: "1px 1px 0 rgba(0,0,0,0.05)",
                  fontStyle: "italic",
                }}
              >
                Age Of Study
              </span>
            </Link>

            {/* === CENTER: Navigation === */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      variants={wiggle}
                      whileHover="hover"
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full cursor-pointer transition-colors ${
                        isActive
                          ? "bg-gradient-to-r from-orange-400 to-yellow-400 text-white shadow-md"
                          : "hover:bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      {isActive && (
                        <motion.span
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: "auto", opacity: 1 }}
                          className="text-sm font-bold whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            {/* === RIGHT: Player Stats === */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Streak Badge */}
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-full">
                <span className="text-lg">🔥</span>
                <span className="text-sm font-bold text-red-600">
                  {streak} Ngày
                </span>
              </div>

              {/* XP Badge */}
              <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 px-3.5 py-1.5 rounded-full">
                <span className="text-lg">⭐</span>
                <span className="text-sm font-bold text-yellow-700">
                  {xp} XP
                </span>
              </div>

              {/* Avatar with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-yellow-300 border-3 border-orange-400 flex items-center justify-center text-lg font-bold text-white shadow-md cursor-pointer"
                  style={{ borderWidth: "3px" }}
                  aria-label="Menu người dùng"
                >
                  {displayName.charAt(0).toUpperCase()}
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-14 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-56 z-50"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          @{user?.username ?? "student"}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <span className="text-lg">👤</span>
                          Hồ sơ của em
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <span className="text-lg">⚙️</span>
                          Cài đặt
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          <span className="text-lg">🚪</span>
                          Đăng xuất
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MOBILE HEADER (compact, stats only) ===== */}
      <header className="sticky top-0 z-50 md:hidden">
        <div className="bg-white/95 backdrop-blur-sm shadow-md px-4 py-2 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-2xl">🦉</span>
            <span
              className="text-base font-black"
              style={{ color: "#1a56db", fontStyle: "italic" }}
            >
              Age Of Study
            </span>
          </Link>

          {/* Stats + Avatar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-full">
              <span className="text-sm">🔥</span>
              <span className="text-xs font-bold text-red-600">{streak}</span>
            </div>
            <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-full">
              <span className="text-sm">⭐</span>
              <span className="text-xs font-bold text-yellow-700">{xp}</span>
            </div>

            {/* Mobile Avatar */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-yellow-300 border-2 border-orange-400 flex items-center justify-center text-sm font-bold text-white"
                aria-label="Menu người dùng"
              >
                {displayName.charAt(0).toUpperCase()}
              </button>

              {/* Mobile Dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-48 z-50"
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {displayName}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      👤 Hồ sơ
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      ⚙️ Cài đặt
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left border-t border-gray-100"
                    >
                      🚪 Đăng xuất
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MOBILE BOTTOM BAR ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-2 py-1 flex justify-around items-center">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center py-2 rounded-2xl mx-0.5 ${
                    isActive
                      ? "bg-gradient-to-t from-orange-400 to-yellow-400 text-white shadow-md"
                      : "text-gray-500"
                  }`}
                >
                  <span className={`${isActive ? "text-2xl" : "text-xl"}`}>
                    {item.emoji}
                  </span>
                  <span
                    className={`text-xs mt-0.5 font-semibold ${
                      isActive ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
