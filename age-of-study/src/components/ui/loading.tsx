"use client";

import { useEffect, useRef } from "react";

interface LoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fullScreen?: boolean;
  className?: string;
}

export default function Loading({
  message = "Đang tải...",
  size = "md",
  fullScreen = false,
  className = "",
}: LoadingProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically load dotlottie-player script
    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs";
      script.type = "module";
      document.head.appendChild(script);

      return () => {
        // Cleanup if needed
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, []);

  const sizeMap = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-48 h-48",
    xl: "w-64 h-64",
  };

  const containerClass = fullScreen
    ? "min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
    : `flex flex-col items-center justify-center ${className}`;

  return (
    <div ref={containerRef} className={containerClass}>
      <div className={`${sizeMap[size]} relative`}>
        {/* @ts-ignore - Web component not recognized by TS */}
        <dotlottie-player
          src="/Sandy Loading.lottie"
          background="transparent"
          speed="1"
          loop
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      {message && (
        <p className="mt-4 text-gray-600 dark:text-gray-300 text-center font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}

// Simplified version for inline use (e.g., in tables)
export function LoadingInline({
  message = "Đang tải...",
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <div className="w-8 h-8">
        {/* @ts-ignore */}
        <dotlottie-player
          src="/Sandy Loading.lottie"
          background="transparent"
          speed="1"
          loop
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <span className="text-gray-500">{message}</span>
    </div>
  );
}

// Loading spinner for small spaces
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return (
    <div className={sizeMap[size]}>
      {/* @ts-ignore */}
      <dotlottie-player
        src="/Sandy Loading.lottie"
        background="transparent"
        speed="1.2"
        loop
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
