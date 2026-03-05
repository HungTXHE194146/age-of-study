/**
 * MFA Settings Component - Quản lý 2FA trong Settings Page
 */

"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnrollMFAModal } from "./EnrollMFAModal";
import { VerifyMFAModal } from "./VerifyMFAModal";
import { mfaService } from "@/lib/mfaService";
import type { MFAStatus, MFAFactor } from "@/types/mfa";

interface MFASettingsProps {
  userId: string;
}

export function MFASettings({ userId }: MFASettingsProps) {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [unenrollPassword, setUnenrollPassword] = useState("");
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMFAStatus();
  }, [userId]);

  const loadMFAStatus = async () => {
    setIsLoading(true);
    const { data, error } = await mfaService.getMFAStatus(userId);

    if (error) {
      setError(error);
    } else {
      setMfaStatus(data);
    }

    setIsLoading(false);
  };

  const handleEnrollSuccess = () => {
    setShowEnrollModal(false);
    loadMFAStatus();
  };

  const handleUnenroll = async () => {
    if (!unenrollPassword.trim()) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    const targetFactor =
      mfaStatus?.factors.find((f) => f.status === "verified") ||
      mfaStatus?.factors[0];

    if (!targetFactor?.id) {
      setError("Không tìm thấy phương thức xác thực để tắt");
      return;
    }

    console.log("[DEBUG MFA Unenroll] targetFactor:", targetFactor);

    setIsUnenrolling(true);
    setError(null);

    console.log("[DEBUG MFA Unenroll] unenroll factor_id:", targetFactor.id);

    const { success, error } = await mfaService.unenroll(
      targetFactor.id,
      unenrollPassword,
    );

    console.log("[DEBUG MFA Unenroll] unenroll result:", { success, error });

    setIsUnenrolling(false);

    if (success) {
      setShowUnenrollModal(false);
      setUnenrollPassword("");
      loadMFAStatus();
    } else {
      setError(error || "Có lỗi xảy ra");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* MFA Status Card */}
      <div className="border-2 border-black rounded-xl p-6 space-y-4 bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 border-2 border-black rounded-xl flex items-center justify-center -rotate-3 hover:translate-y-0.5 hover:shadow-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${
                mfaStatus?.enabled ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              <Shield
                className={`w-6 h-6 ${
                  mfaStatus?.enabled ? "text-green-800" : "text-gray-800"
                }`}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-black font-handwritten text-gray-900">
                  Xác thực 2 yếu tố (2FA)
                </h3>
                {mfaStatus?.enabled ? (
                  <span className="flex items-center gap-1 px-3 py-1 bg-green-100 border-2 border-green-900 text-green-900 text-xs font-bold uppercase rounded-sm">
                    <CheckCircle className="w-3 h-3" />
                    Đã bật
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 border-2 border-gray-900 text-gray-900 text-xs font-bold uppercase rounded-sm">
                    <XCircle className="w-3 h-3" />
                    Chưa bật
                  </span>
                )}
              </div>

              <p className="text-base font-medium text-gray-700 mb-3">
                Thêm lớp bảo mật cho tài khoản của bạn bằng cách yêu cầu mã xác
                thực từ điện thoại khi đăng nhập.
              </p>

              {mfaStatus?.enabled && mfaStatus.enrolled_at && (
                <p className="text-xs text-gray-500">
                  Đã bật từ:{" "}
                  {new Date(mfaStatus.enrolled_at).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-2">
          {!mfaStatus?.enabled ? (
            <button
              onClick={() => setShowEnrollModal(true)}
              className="inline-flex items-center justify-center rounded-md border-2 border-black bg-blue-100 px-6 py-2 text-lg font-bold text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
            >
              <Shield className="w-5 h-5 mr-2" />
              Bật 2FA Ngay
            </button>
          ) : (
            <button
              onClick={() => setShowUnenrollModal(true)}
              className="inline-flex items-center justify-center rounded-md border-2 border-black bg-white px-6 py-2 text-lg font-bold text-red-600 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-red-50 transition-all cursor-pointer"
            >
              Tắt 2FA
            </button>
          )}
        </div>

        {/* Warning if not enabled */}
        {!mfaStatus?.enabled && (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border-2 border-dashed border-yellow-400 rounded-lg mt-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div className="text-base font-medium text-yellow-900">
              <strong className="font-bold font-handwritten text-lg uppercase tracking-wider block mb-1">
                Khuyến nghị quan trọng:
              </strong>
              Hãy bật 2FA để bảo vệ tài khoản của bạn khỏi truy cập trái phép,
              đặc biệt nếu bạn là giáo viên hoặc quản trị viên.
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showEnrollModal && (
        <EnrollMFAModal
          userId={userId}
          onSuccess={handleEnrollSuccess}
          onClose={() => setShowEnrollModal(false)}
        />
      )}

      {showUnenrollModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-2 border-black max-w-md w-full overflow-hidden">
            <div className="border-b-2 border-dashed border-gray-300 px-6 py-4 bg-red-50/50">
              <h2 className="text-2xl font-black font-handwritten text-gray-900">
                Tắt xác thực 2 yếu tố
              </h2>
              <p className="text-sm font-medium text-gray-600 mt-1">
                Nhập mật khẩu để xác nhận
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 border-2 border-red-900 rounded-md">
                <p className="text-base font-medium text-red-900">
                  <strong className="font-bold">Cảnh báo:</strong> Tắt 2FA sẽ
                  làm giảm mức độ bảo mật của tài khoản.
                </p>
              </div>

              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={unenrollPassword}
                  onChange={(e) => setUnenrollPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-600 font-bold transition-all"
                  placeholder="Nhập mật khẩu của bạn"
                  disabled={isUnenrolling}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-2 border-dashed border-red-400 rounded-lg">
                  <p className="text-sm font-bold text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleUnenroll}
                  disabled={isUnenrolling || !unenrollPassword.trim()}
                  className="flex-1 inline-flex items-center justify-center rounded-md border-2 border-black bg-red-500 px-6 py-2 text-lg font-bold text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUnenrolling ? "Đang xử lý..." : "Xác Nhận Tắt"}
                </button>
                <button
                  onClick={() => {
                    setShowUnenrollModal(false);
                    setUnenrollPassword("");
                    setError(null);
                  }}
                  disabled={isUnenrolling}
                  className="flex-1 inline-flex items-center justify-center rounded-md border-2 border-black bg-gray-100 px-6 py-2 text-lg font-bold text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
