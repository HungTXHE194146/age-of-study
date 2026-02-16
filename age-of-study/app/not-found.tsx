"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ left: number; top: number; delay: number; duration: number }>
  >([]);

  useEffect(() => {
    setMounted(true);
    // Generate deterministic particle positions after mount
    const particlePositions = Array.from({ length: 20 }, (_, i) => ({
      left: (i * 37) % 100, // deterministic distribution
      top: (i * 53) % 100,
      delay: (i * 0.25) % 5,
      duration: 5 + (i % 10),
    }));
    setParticles(particlePositions);
  }, []);

  const handleGoHome = () => {
    router.push("/student");
  };

  const handleGetHelp = () => {
    // Open support chat or redirect to help page
    // For now, redirect to settings where they can find help
    router.push("/settings");
  };

  const handleHelpClick = () => {
    router.push("/settings");
  };

  const handleHelpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleHelpClick();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1410] via-[#2d2416] to-[#1a1410] relative overflow-hidden flex items-center justify-center">
      {/* Animated background symbols */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-20 left-10 text-amber-700/10 text-6xl font-bold transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}`}
        >
          Σ
        </div>
        <div
          className={`absolute top-40 right-20 text-amber-700/10 text-5xl font-bold transition-all duration-1000 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}`}
        >
          π
        </div>
        <div
          className={`absolute bottom-40 left-20 text-amber-700/10 text-6xl font-bold transition-all duration-1000 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          A+
        </div>
        <div
          className={`absolute bottom-20 right-32 text-amber-700/10 text-5xl font-bold transition-all duration-1000 delay-400 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          √x
        </div>
        <div
          className={`absolute top-1/3 right-10 text-amber-700/10 text-4xl font-bold transition-all duration-1000 delay-100 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
        >
          🎓
        </div>
        <div
          className={`absolute bottom-1/3 left-32 text-amber-700/10 text-4xl font-bold transition-all duration-1000 delay-500 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
        >
          📚
        </div>
      </div>

      {/* Giant 404 in background */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          className={`text-[20rem] md:text-[30rem] font-black text-amber-900/10 select-none transition-all duration-1000 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          404
        </div>
      </div>

      {/* Small floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-500/20 rounded-full animate-float"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Question mark icon */}
      <button
        onClick={handleHelpClick}
        onKeyDown={handleHelpKeyDown}
        className="absolute top-12 right-12 w-12 h-12 bg-amber-900/30 rounded-full flex items-center justify-center text-amber-400 text-2xl border-2 border-amber-700/50 hover:bg-amber-800/40 transition-all cursor-pointer animate-bounce-slow focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#1a1410]"
        aria-label="Help"
        tabIndex={0}
      >
        ?
      </button>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 text-center">
        {/* Owl mascot */}
        <div
          className={`mb-8 transition-all duration-1000 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="relative inline-block">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full scale-150" />

            {/* Owl circle background */}
            <div className="relative w-64 h-64 mx-auto bg-gradient-to-b from-[#2a2520] to-[#1a1510] rounded-full flex items-center justify-center border-4 border-amber-900/30 shadow-2xl">
              {/* Simplified owl illustration using emojis/text */}
              <div className="text-8xl animate-sway">🦉</div>
            </div>

            {/* Decorative small icons around owl */}
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-600/80 rounded-full flex items-center justify-center text-2xl animate-float-slow shadow-lg">
              ✓
            </div>
            <div className="absolute top-8 -right-8 w-10 h-10 bg-amber-600/80 rounded-full flex items-center justify-center text-xl animate-float-slower shadow-lg">
              ⚡
            </div>
          </div>
        </div>

        {/* Title */}
        <h1
          className={`text-4xl md:text-5xl font-bold text-white mb-4 transition-all duration-1000 delay-400 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          Ôi không! Bạn bị lạc rồi! 🧭
        </h1>

        {/* Description */}
        <p
          className={`text-gray-300 text-lg mb-8 max-w-lg mx-auto transition-all duration-1000 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          Có vẻ như hòn đảo này không tồn tại trên bản đồ tri thức của chúng
          mình. Đừng lo nhé nhà thám hiểm!
        </p>

        {/* Action buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 transition-all duration-1000 delay-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          {/* Primary button */}
          <button
            onClick={handleGoHome}
            className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span className="relative z-10">Quay lại bản đồ chính</span>
            <span className="text-xl group-hover:translate-x-1 transition-transform">
              🗺️
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Secondary button */}
          <button
            onClick={handleGetHelp}
            className="group px-8 py-4 bg-transparent text-blue-300 font-semibold rounded-xl border-2 border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/10 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>Cần giúp đỡ? (Hỏi Cú Mèo)</span>
            <span className="text-xl group-hover:rotate-12 transition-transform">
              💬
            </span>
          </button>
        </div>

        {/* Footer */}
        <div
          className={`text-gray-500 text-sm transition-all duration-1000 delay-900 ${mounted ? "opacity-100" : "opacity-0"}`}
        >
          AGE OF STUDY • BẢN ĐỒ TRI THỨC {new Date().getFullYear()}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.2;
          }
          25% {
            opacity: 0.4;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
          75% {
            opacity: 0.4;
          }
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes float-slower {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes sway {
          0%,
          100% {
            transform: rotate(-5deg);
          }
          50% {
            transform: rotate(5deg);
          }
        }

        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-float-slow {
          animation: float-slow 3s ease-in-out infinite;
        }

        .animate-float-slower {
          animation: float-slower 4s ease-in-out infinite;
        }

        .animate-sway {
          animation: sway 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
