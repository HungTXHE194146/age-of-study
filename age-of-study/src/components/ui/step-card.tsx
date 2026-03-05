"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function StepCard({
  stepNumber,
  title,
  description,
  icon,
  children,
  className = "",
}: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className={`group relative bg-[#111] border border-white/20 p-8 sm:p-12 overflow-hidden transition-all duration-300 hover:border-white/50 ${className}`}
      style={{ borderRadius: "0px" }} // Sharp geometry rule
    >
      {/* Background massive number for tension */}
      <div className="absolute -top-10 -right-4 text-[180px] font-black text-white/[0.03] select-none pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:text-white/[0.05]">
        {stepNumber}
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-shrink-0 w-16 h-16 bg-white flex items-center justify-center text-black font-bold text-2xl">
          {icon || stepNumber}
        </div>

        <div className="flex-grow space-y-4">
          <h3 className="text-3xl font-bold tracking-tight">{title}</h3>
          <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">
            {description}
          </p>

          {children && (
            <div className="pt-6 mt-6 border-t border-white/10">{children}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
