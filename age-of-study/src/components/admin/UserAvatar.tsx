import Image from "next/image";
import { useState } from "react";

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  username?: string | null;
  size?: "sm" | "md" | "lg";
}

export default function UserAvatar({
  avatarUrl,
  name,
  username,
  size = "md",
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-16 h-16 text-2xl",
  };

  const initial = (name?.charAt(0) || username?.charAt(0) || "?").toUpperCase();

  // Show gradient fallback if no URL or if image failed to load
  if (!avatarUrl || imageError) {
    return (
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold`}
      >
        {initial}
      </div>
    );
  }

  // Check if avatarUrl is an emoji or a URL
  const isEmoji = !avatarUrl.startsWith("http") && !avatarUrl.startsWith("/");

  // If it's an emoji, display as text
  if (isEmoji) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-gray-100`}
      >
        <span
          className={
            size === "lg" ? "text-4xl" : size === "md" ? "text-2xl" : "text-xl"
          }
        >
          {avatarUrl}
        </span>
      </div>
    );
  }

  // Try to show actual image
  return (
    <div
      className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-gray-200`}
    >
      <Image
        src={avatarUrl}
        alt={name || username || "User avatar"}
        fill
        className="object-cover"
        onError={() => setImageError(true)}
        unoptimized // For external URLs that may not support optimization
      />
    </div>
  );
}
