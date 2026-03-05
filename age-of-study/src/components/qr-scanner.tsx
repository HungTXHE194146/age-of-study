"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isTransitioningRef = useRef(false);
  const scannerId = "qr-reader";

  const stopScanner = async () => {
    if (isTransitioningRef.current) return;

    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      isTransitioningRef.current = true;
      try {
        await html5QrCodeRef.current.stop();
        setIsCameraActive(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      } finally {
        isTransitioningRef.current = false;
      }
    }
  };

  const startScanner = async () => {
    if (isTransitioningRef.current) return;

    setCameraError(null);
    setIsInitializing(true);
    isTransitioningRef.current = true;

    try {
      // Check for secure context and mediaDevices support
      const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const isSecure = typeof window !== 'undefined' && window.isSecureContext;

      if (!isSecure && !isLocalhost) {
        setCameraError("Máy ảnh chỉ hoạt động trên kết nối bảo mật (HTTPS). Em hãy nhờ thầy cô kiểm tra lại địa chỉ trang web nhé!");
        setIsInitializing(false);
        isTransitioningRef.current = false;
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Trình duyệt này quá cũ hoặc không hỗ trợ Máy ảnh. Em hãy thử mở bằng Safari (trên iPhone) hoặc Chrome mới nhất nhé!");
        setIsInitializing(false);
        isTransitioningRef.current = false;
        return;
      }

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerId);
      }

      // If already scanning for some reason, stop it first
      if (html5QrCodeRef.current.isScanning) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) { /* ignore */ }
      }

      const qrCodeSuccessCallback = (decodedText: string) => {
        stopScanner();
        onScanSuccess(decodedText);
      };

      const config = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * 0.7);
          return {
            width: qrboxSize,
            height: qrboxSize
          };
        },
        aspectRatio: 1.0,
        videoConstraints: {
          // Use 'ideal' instead of 'min' to be more lenient on mobile devices
          width: { ideal: 1280 },
          facingMode: "environment"
        },
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      // Strict 1-key object for camera selection
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        () => { } // Ignore scan failures
      );

      setIsCameraActive(true);
      setIsInitializing(false);
    } catch (err: any) {
      console.error("Camera start error:", err);
      setIsInitializing(false);

      const errorStr = err?.toString() || "";
      if (errorStr.includes("NotAllowedError") || errorStr.includes("Permission denied")) {
        setCameraError("Em hãy nhấn 'Cho phép' để mở máy ảnh nhé!");
      } else if (errorStr.includes("NotSupportedError") || errorStr.includes("streaming not supported")) {
        setCameraError("Điện thoại chưa cho phép trình duyệt quay phim. Em hãy vào Cài đặt của iPhone để kiểm tra nhé!");
      } else if (errorStr.includes("OverconstrainedError") || errorStr.includes("ConstraintNotSatisfiedError")) {
        // If 1280px is too much for the device, retry with default settings
        retryBasicScanner();
      } else {
        setCameraError("Máy ảnh bị lỗi rồi. Em hãy thử mở bằng ứng dụng Safari hoặc Chrome mới nhất nhé!");
      }
    } finally {
      isTransitioningRef.current = false;
    }
  };

  const retryBasicScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (decodedText) => {
            stopScanner();
            onScanSuccess(decodedText);
          },
          () => { }
        );
        setIsCameraActive(true);
        setIsInitializing(false);
        setCameraError(null);
      }
    } catch (err) {
      setCameraError("Không thể khởi động máy ảnh. Em hãy kiểm tra xem có ứng dụng nào khác đang dùng máy ảnh không nhé!");
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop()
          .catch(err => console.error("Unmount stop error", err));
      }
    };
  }, []);

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
              rotate: isCameraActive ? [0, -5, 5, -5, 0] : 0,
              scale: isCameraActive ? [1, 1.05, 1] : 1
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
            <div className="relative">
              <div
                id={scannerId}
                className="w-full relative rounded-3xl overflow-hidden border-4 border-dashed border-blue-200 bg-gray-50 aspect-square"
              ></div>

              {!isCameraActive && !cameraError && isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 rounded-3xl">
                  <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-gray-400 font-bold">Đang chuẩn bị...</p>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 rounded-3xl p-6 text-center">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-red-100">
                    <p className="text-gray-700 font-bold mb-4">{cameraError}</p>
                    <Button
                      onClick={startScanner}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl"
                    >
                      Thử mở lại máy ảnh 🔄
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {isCameraActive && (
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                <div className="aspect-square border-4 border-blue-500 rounded-[20px] animate-pulse"></div>
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
