/**
 * OTP Input Component - Nhập mã 6 số
 * Auto-focus và auto-advance giữa các ô
 */

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  className,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    // Chỉ cho phép số
    if (digit && !/^\d$/.test(digit)) return;

    const newValue = Array.from({ length }, (_, i) => value[i] || "");
    newValue[index] = digit;
    onChange(newValue.join(""));

    // Auto-advance to next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current
        const newValue = value.padEnd(length, " ").split("");
        newValue[index] = "";
        onChange(newValue.join("").trimEnd());
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain").slice(0, length);

    // Chỉ cho phép số
    if (!/^\d+$/.test(pasteData)) return;

    onChange(pasteData.padEnd(length, " ").slice(0, length).replace(/ /g, ""));

    // Focus last filled input
    const nextIndex = Math.min(pasteData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-12 h-14 text-center text-3xl font-black font-handwritten rounded-lg border-2",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            "shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)]",
            error
              ? "border-red-600 focus:border-red-600 focus:ring-red-600 bg-red-50 text-red-700"
              : "border-black focus:border-blue-600 focus:ring-blue-600 bg-white text-black",
            disabled &&
              "bg-gray-100 cursor-not-allowed opacity-50 shadow-none hover:translate-x-0 hover:translate-y-0",
          )}
          autoComplete="off"
        />
      ))}
    </div>
  );
}
