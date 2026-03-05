import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = "info",
  isVisible,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const variants = {
    success: {
      bg: "bg-green-500",
      icon: <CheckCircle className="w-6 h-6" />,
      border: "border-green-600",
    },
    error: {
      bg: "bg-red-500",
      icon: <XCircle className="w-6 h-6" />,
      border: "border-red-600",
    },
    warning: {
      bg: "bg-amber-500",
      icon: <AlertCircle className="w-6 h-6" />,
      border: "border-amber-600",
    },
    info: {
      bg: "bg-blue-500",
      icon: <Info className="w-6 h-6" />,
      border: "border-blue-600",
    },
  };

  const currentVariant = variants[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-4 right-4 z-[200] max-w-md"
        >
          <div
            className={`${currentVariant.bg} text-white px-6 py-4 rounded-xl shadow-2xl border-2 ${currentVariant.border} flex items-center gap-4`}
          >
            <div className="flex-shrink-0">{currentVariant.icon}</div>
            <p className="flex-1 font-medium">{message}</p>
            <button
              onClick={onClose}
              className="flex-shrink-0 hover:bg-white/20 rounded-lg p-1 transition-colors"
              aria-label="Đóng"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
