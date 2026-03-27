/**
 * Route-level loading UI for /student/skill-tree
 * Next.js automatically shows this while the page.tsx async component resolves.
 * Prevents blank screen during data fetching.
 */
export default function SkillTreeLoading() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
      {/* Animated skill tree skeleton */}
      <div className="flex flex-col items-center gap-6 animate-pulse">
        {/* Top node */}
        <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700" />

        {/* Connector line */}
        <div className="w-0.5 h-8 bg-slate-800" />

        {/* Middle row */}
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700" />
          <div className="w-16 h-16 rounded-full bg-indigo-900/50 border-2 border-indigo-800/50" />
          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700" />
        </div>

        {/* Connector line */}
        <div className="w-0.5 h-8 bg-slate-800" />

        {/* Bottom row */}
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-slate-800/70 border-2 border-slate-700/70" />
          <div className="w-14 h-14 rounded-full bg-slate-800/70 border-2 border-slate-700/70" />
          <div className="w-14 h-14 rounded-full bg-slate-800/70 border-2 border-slate-700/70" />
          <div className="w-14 h-14 rounded-full bg-slate-800/70 border-2 border-slate-700/70" />
        </div>
      </div>

      {/* Text */}
      <div className="flex items-center gap-2 mt-4">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0ms]" />
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:150ms]" />
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:300ms]" />
      </div>
      <p className="text-slate-400 text-sm font-medium tracking-wide">
        Đang tải bản đồ kỹ năng...
      </p>
    </div>
  );
}
