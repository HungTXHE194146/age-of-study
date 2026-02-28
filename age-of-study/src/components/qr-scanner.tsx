"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize scanner when component mounts
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
        showTorchButtonIfSupported: true,
      },
      false,
    );

    const onScanFailure = (errorMsg: string) => {
      // Ignore routine scan failures (when no QR code is in frame)
      // We only log if it's a persistent camera issue
      console.warn("QR Scan failure:", errorMsg);
    };

    scannerRef.current.render((decodedText) => {
      // Pause scanner immediately upon success to prevent multiple triggers
      if (scannerRef.current) {
        scannerRef.current.pause(true);
      }
      onScanSuccess(decodedText);
    }, onScanFailure);

    // Cleanup when component unmounts
    return () => {
      if (scannerRef.current) {
        try {
          // If the scanner hasn't finished initializing, calling clear() might fail
          // the html5-qrcode library has a known issue where it doesn't clean up the camera
          // completely if unmounted during initialization or sometimes even when running

          // Pause first to stop the scanning loop
          scannerRef.current.pause(true);

          scannerRef.current.clear().catch((err) => {
            console.error("Failed to clear html5QrcodeScanner. ", err);
          });

          // Hard cleanup of all video tracks just to be safe
          const videoElements = document.querySelectorAll("#qr-reader video");
          videoElements.forEach((video) => {
            const mediaStream = (video as HTMLVideoElement)
              .srcObject as MediaStream;
            if (mediaStream) {
              mediaStream.getTracks().forEach((track) => track.stop());
            }
          });
        } catch (e) {
          console.error("Error during scanner cleanup", e);
        }
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
            <QrCode className="w-5 h-5 text-blue-600" />
            Giơ thẻ có mã QR để đăng nhập
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4">
          <div
            id="qr-reader"
            className="w-full relative rounded-xl overflow-hidden border-2 border-dashed border-gray-300"
          ></div>

          <div className="mt-6 text-center text-sm text-gray-500">
            Đảm bảo thẻ mã QR nằm gọn trong khung hình vuông. Bạn có thể cần cho
            phép trình duyệt truy cập Máy ảnh.
          </div>

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full mt-4 border-gray-300 text-gray-700"
          >
            Hủy và trở lại đăng nhập bằng chữ
          </Button>
        </div>
      </div>
    </div>
  );
}
