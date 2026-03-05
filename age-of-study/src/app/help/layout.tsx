import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Navigation Layer */}
      <nav className="fixed top-0 left-0 w-full z-50 mix-blend-difference px-6 py-6 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/teacher/settings"
            className="group flex items-center gap-2 text-sm uppercase tracking-widest hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Quay lại Hệ thống</span>
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-bold tracking-tight">SECURITY DOCS</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-24 pb-32">{children}</main>
    </div>
  );
}
