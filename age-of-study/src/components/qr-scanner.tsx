"use client";

import { useState } from "react";
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { X, Camera, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const handleScan = (result: IDetectedBarcode[]) => {
    if (result && result.length > 0) {
      onScanSuccess(result[0].rawValue);
    }
  };

  const handleError = (error: any) => {
    console.error("QR Scanner Error:", error);
    if (error?.message?.includes("Permission denied") || error?.name === "NotAllowedError") {
      setCameraError("Em hãy nhấn 'Cho phép' để mở máy ảnh nhé!");
    } else {
      setCameraError("Máy ảnh bị lỗi hoặc không tìm thấy. Em hãy nhờ thầy cô kiểm tra nhé!");
    }
    setIsInitializing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-blue-600/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative border-8 border-white"
      >
        <div className="p-8 pb-4 text-center">
          <motion.div
            animate={{
              rotate: [0, -5, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="inline-block mb-4"
          >
            <div className={`w-20 h-20 ${cameraError ? 'bg-red-100' : 'bg-amber-100'} rounded-full flex items-center justify-center shadow-inner`}>
              {cameraError ? (
                <AlertCircle className="w-10 h-10 text-red-500" />
              ) : (
                <Camera className="w-10 h-10 text-orange-500" />
              )}
            </div>
          </motion.div>
          <h3 className="font-black text-2xl text-blue-900 leading-tight">
            {cameraError ? "Hic, máy ảnh chưa mở được!" : "Giơ thẻ QR trước máy ảnh nhé! 📸"}
          </h3>
          <p className="text-blue-600 font-medium mt-2">
            {cameraError || "Đưa thẻ vào ô vuông để bắt đầu học bài"}
          </p>
        </div>

        <div className="px-8 pb-8">
          <div className="relative group">
            <div className="relative rounded-3xl overflow-hidden border-4 border-white/20 bg-gray-950 aspect-square shadow-2xl shadow-blue-900/20">
              {!cameraError ? (
                <div className="absolute inset-0 z-0">
                  <Scanner
                    onScan={handleScan}
                    onError={handleError}
                    sound={false}
                    components={{
                      onOff: false,
                      torch: true,
                      zoom: false,
                      finder: false
                    }}
                    styles={{
                      container: { width: '100%', height: '100%' },
                      video: { objectFit: 'cover', width: '100%', height: '100%' }
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 p-6 text-center">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-red-100">
                    <p className="text-gray-700 font-bold mb-4">{cameraError}</p>
                    <Button
                      onClick={() => {
                        setCameraError(null);
                        setIsInitializing(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl"
                    >
                      Thử mở lại máy ảnh 🔄
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Viewfinder Overlay - Sạch sẽ và hiện đại hơn */}
            {!cameraError && (
              <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                {/* Lớp phủ tối xung quanh vùng quét */}
                <div
                  className="absolute inset-0 bg-black/40"
                  style={{
                    clipPath: 'polygon(0% 0%, 0% 100%, 15% 100%, 15% 15%, 85% 15%, 85% 85%, 15% 85%, 15% 100%, 100% 100%, 100% 0%)'
                  }}
                />

                {/* Khung quét với 4 góc trắng */}
                <div className="w-[70%] aspect-square relative">
                  {/* Góc trên bên trái */}
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                  {/* Góc trên bên phải */}
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                  {/* Góc dưới bên trái */}
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                  {/* Góc dưới bên phải */}
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={onClose}
                className="w-full py-8 text-xl font-black bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-2xl shadow-[0_8px_0_rgb(194,120,0)] border-b-0 active:translate-y-[4px] active:shadow-[0_4px_0_rgb(194,120,0)] transition-all flex items-center justify-center gap-3"
              >
                <ArrowLeft className="w-6 h-6 stroke-[3px]" />
                QUAY LẠI 🏠
              </Button>
            </motion.div>

            <p className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
              Nếu không được, hãy hỏi thầy cô nhé!
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>

      <div className="absolute top-10 left-10 text-4xl animate-bounce delay-100">⭐</div>
      <div className="absolute bottom-10 right-10 text-4xl animate-bounce delay-300">🎈</div>
      <div className="absolute top-20 right-20 text-4xl animate-pulse">🚀</div>
      <div className="absolute bottom-20 left-20 text-4xl animate-pulse delay-500">🎨</div>
    </motion.div>
  );
}
