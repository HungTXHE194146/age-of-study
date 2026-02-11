"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { Settings, LogOut } from "lucide-react";
import "./GameHeader.css";

/* ─────────────────────────────────────
   Navigation items
   ───────────────────────────────────── */
interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: "🏠", label: "Trang chủ", href: "/learn" },
  { icon: "⚔️", label: "Học tập", href: "/learn/skill-tree" },
  { icon: "🏆", label: "Xếp hạng", href: "/leaderboard" },
  { icon: "🎒", label: "Balo", href: "/inventory" },
];

/* ─────────────────────────────────────
   Spring configs for Framer Motion
   ───────────────────────────────────── */
const SPRING = { type: "spring", stiffness: 400, damping: 17 } as const;

const WIGGLE_VARIANTS = {
  idle: { rotate: 0 },
  hover: {
    rotate: [0, 12, -10, 8, -6, 3, 0],
    transition: { duration: 0.5 },
  },
};

const BOUNCE_ACTIVE = {
  initial: { y: 0 },
  animate: {
    y: [0, -4, 0],
    transition: { duration: 0.4 },
  },
};

const DROPDOWN_VARIANTS = {
  hidden: { opacity: 0, y: -8, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

/* ─────────────────────────────────────
   Helper: user initials
   ───────────────────────────────────── */
function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/* ─────────────────────────────────────
   Helper: format XP
   ───────────────────────────────────── */
function formatXP(xp: number): string {
  if (xp >= 10000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toLocaleString("vi-VN");
}

/* ═════════════════════════════════════
   GameHeader Component
   ═════════════════════════════════════ */
export default function GameHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push("/login");
  };

  const streak = user?.current_streak ?? 0;
  const xp = user?.total_xp ?? 0;
  const avatarUrl = user?.avatar_url;
  const displayName = user?.full_name || user?.username;

  return (
    <>
      {/* ────── DESKTOP / TABLET HEADER ────── */}
      <header className="hud-bar sticky top-0 z-50 rounded-b-2xl md:rounded-b-3xl">
        <div className="mx-auto flex items-center justify-between px-4 py-2 md:px-6 max-w-7xl">
          {/* ── LEFT: Logo ── */}
          <div
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => router.push("/")}
            role="button"
            tabIndex={0}
            aria-label="Go to homepage"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push("/");
              }
            }}
          >
            {/* Owl mascot emoji fallback */}
            <span
              className="text-3xl leading-none select-none"
              role="img"
              aria-label="Owl mascot"
            >
              🦉
            </span>
            <span className="bubble-text hidden sm:inline">Age Of Study</span>
          </div>

          {/* ── CENTER: Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/60 rounded-full px-2 py-1.5 border border-gray-100">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/learn" && pathname.startsWith(item.href));

              return (
                <motion.div
                  key={item.href}
                  className={`hud-nav-item ${isActive ? "hud-nav-item--active" : ""}`}
                  variants={WIGGLE_VARIANTS}
                  initial="idle"
                  whileHover="hover"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => router.push(item.href)}
                  role="link"
                  tabIndex={0}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(item.href);
                    }
                  }}
                >
                  <motion.span
                    className="hud-nav-icon"
                    {...(isActive ? BOUNCE_ACTIVE : {})}
                  >
                    {item.icon}
                  </motion.span>
                  <span className="hud-nav-label">{item.label}</span>
                </motion.div>
              );
            })}
          </nav>

          {/* ── RIGHT: Stats + Avatar ── */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Streak Badge */}
            <motion.div
              className="hud-badge hud-badge--streak"
              whileHover={{ scale: 1.08 }}
              transition={SPRING}
            >
              <span role="img" aria-label="Streak">
                🔥
              </span>
              <span>{streak} Ngày</span>
            </motion.div>

            {/* XP Badge */}
            <motion.div
              className="hud-badge hud-badge--xp"
              whileHover={{ scale: 1.08 }}
              transition={SPRING}
            >
              <span role="img" aria-label="XP">
                ⭐
              </span>
              <span>{formatXP(xp)} XP</span>
            </motion.div>

            {/* Avatar + Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <motion.button
                className="hud-avatar"
                onClick={() => setDropdownOpen((prev) => !prev)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING}
                aria-label="Menu người dùng"
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName || "Avatar"}
                    loading="lazy"
                  />
                ) : (
                  getInitials(displayName)
                )}
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    className="hud-dropdown"
                    variants={DROPDOWN_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    role="menu"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-[#F0E6D6]">
                      <p className="font-bold text-sm text-gray-800 truncate">
                        {displayName || "Học sinh"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatXP(xp)} XP · Chuỗi {streak} ngày
                      </p>
                    </div>

                    <div
                      className="hud-dropdown-item"
                      role="menuitem"
                      tabIndex={0}
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push("/settings");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setDropdownOpen(false);
                          router.push("/settings");
                        }
                      }}
                    >
                      <Settings size={16} />
                      <span>Cài đặt</span>
                    </div>

                    <div className="hud-dropdown-divider" />

                    <div
                      className="hud-dropdown-item hud-dropdown-item--danger"
                      role="menuitem"
                      tabIndex={0}
                      onClick={handleLogout}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleLogout();
                        }
                      }}
                    >
                      <LogOut size={16} />
                      <span>Đăng xuất</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ────── MOBILE BOTTOM BAR ────── */}
      <nav className="md:hidden hud-bottom-bar" aria-label="Mobile navigation">
        <div className="hud-bottom-bar-inner">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/learn" && pathname.startsWith(item.href));

            return (
              <motion.div
                key={item.href}
                className={`hud-bottom-item ${isActive ? "hud-bottom-item--active" : ""}`}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push(item.href)}
                role="link"
                tabIndex={0}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(item.href);
                  }
                }}
              >
                <motion.span
                  className="hud-bottom-icon"
                  {...(isActive ? BOUNCE_ACTIVE : {})}
                >
                  {item.icon}
                </motion.span>
                <span className="hud-bottom-label">{item.label}</span>
              </motion.div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
