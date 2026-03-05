"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  School,
  Clock,
  Bot,
  Sparkles,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  Shield,
} from "lucide-react";
import { updateSystemSettings } from "@/lib/settingsService";
import { SETTINGS_CONSTRAINTS } from "@/types/settings";
import type { SystemSettings, SystemSettingsUpdate } from "@/types/settings";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { MFASettings } from "@/components/auth/MFASettings";
import { useReauth } from "@/hooks/useReauth";
import { useAuthStore } from "@/store/useAuthStore";

// ============================================================================
// Helper: format relative time in Vietnamese
// ============================================================================
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

// ============================================================================
// Section Card wrapper
// ============================================================================
function SettingsSection({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4">
        <div
          className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

// ============================================================================
// Field components
// ============================================================================
function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} hint={hint} />
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value);
            if (isNaN(parsed)) return;
            onChange(Math.min(max, Math.max(min, parsed)));
          }}
          min={min}
          max={max}
          step={step}
          className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />{" "}
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
    </div>
  );
}

function SliderField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step = 0.05,
  descriptions,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  descriptions?: { low: string; high: string };
}) {
  return (
    <div>
      <FieldLabel label={label} hint={hint} />
      <div className="flex items-center gap-4">
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <span className="w-14 text-center text-sm font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
          {value.toFixed(2)}
        </span>
      </div>
      {descriptions && (
        <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
          <span>{descriptions.low}</span>
          <span>{descriptions.high}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main page
// ============================================================================
export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const { requireReauth, ReauthModal } = useReauth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [formData, setFormData] = useState<SystemSettingsUpdate>({});
  const [updatedByName, setUpdatedByName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      }

      const response = await fetch("/api/admin/settings", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to load");
      const result = await response.json();

      setSettings(result.data);
      setUpdatedByName(result.updatedByName);
      setFormData({
        school_name: result.data.school_name,
        school_year: result.data.school_year,
        default_daily_limit_minutes: result.data.default_daily_limit_minutes,
        ai_chat_temperature: parseFloat(result.data.ai_chat_temperature),
        ai_chat_max_tokens: result.data.ai_chat_max_tokens,
        ai_chat_rate_limit_per_minute:
          result.data.ai_chat_rate_limit_per_minute,
        ai_question_temperature: parseFloat(
          result.data.ai_question_temperature,
        ),
        ai_question_max_tokens: result.data.ai_question_max_tokens,
      });
      setHasChanges(false);
      setErrorMessage("");
    } catch {
      setErrorMessage(
        "Không thể tải cài đặt hệ thống. Vui lòng tải lại trang.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Track changes
  const updateField = <K extends keyof SystemSettingsUpdate>(
    field: K,
    value: SystemSettingsUpdate[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaveStatus("idle");
  };

  // Save
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus("idle");
      // Require re-authentication for sensitive action
      const canProceed = await requireReauth("update_system_settings");
      if (!canProceed) {
        setErrorMessage("Cần xác thực để lưu cài đặt hệ thống");
        setSaveStatus("error");
        return;
      }

      setErrorMessage("");

      await updateSystemSettings(formData);
      setHasChanges(false);
      setSaveStatus("success");

      // Re-fetch to get fresh data + updatedByName
      await loadSettings();
      setSaveStatus("success");

      // Auto-clear success after 3s
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Không thể lưu cài đặt",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form to saved values
  const handleReset = () => {
    if (!settings) return;
    setFormData({
      school_name: settings.school_name,
      school_year: settings.school_year,
      default_daily_limit_minutes: settings.default_daily_limit_minutes,
      ai_chat_temperature: parseFloat(String(settings.ai_chat_temperature)),
      ai_chat_max_tokens: settings.ai_chat_max_tokens,
      ai_chat_rate_limit_per_minute: settings.ai_chat_rate_limit_per_minute,
      ai_question_temperature: parseFloat(
        String(settings.ai_question_temperature),
      ),
      ai_question_max_tokens: settings.ai_question_max_tokens,
    });
    setHasChanges(false);
    setSaveStatus("idle");
    setErrorMessage("");
  };

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-500 text-sm">Đang tải cài đặt...</span>
        </div>
      </div>
    );
  }

  // --- Error: could not load ---
  if (!settings) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-red-800 mb-1">
            Lỗi tải cài đặt
          </h2>
          <p className="text-sm text-red-600 mb-4">{errorMessage}</p>
          <button
            onClick={loadSettings}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-gray-700" />
          Cài đặt hệ thống
        </h1>
        <p className="text-gray-600">
          Cấu hình thông tin trường, giới hạn thời gian học, và tham số AI
        </p>
      </div>

      {/* Save status banner */}
      {saveStatus === "success" && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Cài đặt đã được lưu thành công!</span>
        </div>
      )}
      {saveStatus === "error" && errorMessage && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* ============================================================ */}
        {/* SECTION 1: School info */}
        {/* ============================================================ */}
        <SettingsSection
          icon={School}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          title="Thông tin trường"
          description="Thông tin cơ bản về trường học"
        >
          <div>
            <FieldLabel label="Tên trường" />
            <input
              type="text"
              value={formData.school_name || ""}
              onChange={(e) => updateField("school_name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Trường Tiểu học Ninh Lai"
            />
          </div>

          <div>
            <FieldLabel label="Năm học" hint="Định dạng: 2025-2026" />
            <input
              type="text"
              value={formData.school_year || ""}
              onChange={(e) => updateField("school_year", e.target.value)}
              className="w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="2025-2026"
              pattern="\d{4}-\d{4}"
            />
          </div>
        </SettingsSection>

        {/* ============================================================ */}
        {/* SECTION 2: Learning limits */}
        {/* ============================================================ */}
        <SettingsSection
          icon={Clock}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
          title="Giới hạn thời gian học"
          description="Thiết lập thời gian học mặc định cho học sinh"
        >
          <NumberField
            label="Giới hạn thời gian học mỗi ngày (mặc định)"
            hint={`Áp dụng cho học sinh mới tạo. Khoảng ${SETTINGS_CONSTRAINTS.default_daily_limit_minutes.min}–${SETTINGS_CONSTRAINTS.default_daily_limit_minutes.max} phút.`}
            value={formData.default_daily_limit_minutes || 30}
            onChange={(v) => updateField("default_daily_limit_minutes", v)}
            min={SETTINGS_CONSTRAINTS.default_daily_limit_minutes.min}
            max={SETTINGS_CONSTRAINTS.default_daily_limit_minutes.max}
            unit="phút / ngày"
          />

          <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Đây là giá trị mặc định khi tạo học sinh mới. Giáo viên có thể
              điều chỉnh riêng cho từng học sinh trong trang quản lý lớp học.
            </span>
          </div>
        </SettingsSection>

        {/* ============================================================ */}
        {/* SECTION 3: AI Chatbot */}
        {/* ============================================================ */}
        <SettingsSection
          icon={Bot}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
          title="Tham số AI Chatbot (Cú Mèo)"
          description="Điều chỉnh hành vi của trợ lý AI khi trò chuyện với học sinh"
        >
          <SliderField
            label="Temperature"
            hint="Độ sáng tạo của câu trả lời. Thấp = chính xác hơn, Cao = đa dạng hơn."
            value={formData.ai_chat_temperature ?? 0.7}
            onChange={(v) => updateField("ai_chat_temperature", v)}
            min={SETTINGS_CONSTRAINTS.ai_chat_temperature.min}
            max={SETTINGS_CONSTRAINTS.ai_chat_temperature.max}
            step={SETTINGS_CONSTRAINTS.ai_chat_temperature.step}
            descriptions={{ low: "🎯 Chính xác", high: "🎨 Sáng tạo" }}
          />

          <NumberField
            label="Max Output Tokens"
            hint={`Giới hạn độ dài câu trả lời. Khoảng ${SETTINGS_CONSTRAINTS.ai_chat_max_tokens.min}–${SETTINGS_CONSTRAINTS.ai_chat_max_tokens.max} tokens.`}
            value={formData.ai_chat_max_tokens || 1500}
            onChange={(v) => updateField("ai_chat_max_tokens", v)}
            min={SETTINGS_CONSTRAINTS.ai_chat_max_tokens.min}
            max={SETTINGS_CONSTRAINTS.ai_chat_max_tokens.max}
            unit="tokens"
          />

          <NumberField
            label="Rate Limit"
            hint={`Số tin nhắn tối đa mỗi phút cho mỗi học sinh. Khoảng ${SETTINGS_CONSTRAINTS.ai_chat_rate_limit_per_minute.min}–${SETTINGS_CONSTRAINTS.ai_chat_rate_limit_per_minute.max}.`}
            value={formData.ai_chat_rate_limit_per_minute || 10}
            onChange={(v) => updateField("ai_chat_rate_limit_per_minute", v)}
            min={SETTINGS_CONSTRAINTS.ai_chat_rate_limit_per_minute.min}
            max={SETTINGS_CONSTRAINTS.ai_chat_rate_limit_per_minute.max}
            unit="tin nhắn / phút"
          />
        </SettingsSection>

        {/* ============================================================ */}
        {/* SECTION 4: AI Question Generator */}
        {/* ============================================================ */}
        <SettingsSection
          icon={Sparkles}
          iconColor="text-amber-600"
          iconBg="bg-amber-100"
          title="Tham số AI Tạo câu hỏi (Giáo sư Cú)"
          description="Điều chỉnh hành vi của AI khi giáo viên tạo câu hỏi tự động"
        >
          <SliderField
            label="Temperature"
            hint="Thấp = câu hỏi nhất quán, ít biến thể. Cao = đa dạng hơn nhưng có thể kém chính xác."
            value={formData.ai_question_temperature ?? 0.3}
            onChange={(v) => updateField("ai_question_temperature", v)}
            min={SETTINGS_CONSTRAINTS.ai_question_temperature.min}
            max={SETTINGS_CONSTRAINTS.ai_question_temperature.max}
            step={SETTINGS_CONSTRAINTS.ai_question_temperature.step}
            descriptions={{ low: "🎯 Nhất quán", high: "🎨 Đa dạng" }}
          />

          <NumberField
            label="Max Output Tokens"
            hint={`Ảnh hưởng đến số lượng câu hỏi AI có thể tạo. Khoảng ${SETTINGS_CONSTRAINTS.ai_question_max_tokens.min}–${SETTINGS_CONSTRAINTS.ai_question_max_tokens.max} tokens.`}
            value={formData.ai_question_max_tokens || 8000}
            onChange={(v) => updateField("ai_question_max_tokens", v)}
            min={SETTINGS_CONSTRAINTS.ai_question_max_tokens.min}
            max={SETTINGS_CONSTRAINTS.ai_question_max_tokens.max}
            unit="tokens"
          />
        </SettingsSection>

        {/* ============================================================ */}
        {/* SECTION 5: MFA Security */}
        {/* ============================================================ */}
        {user && (
          <SettingsSection
            icon={Shield}
            iconColor="text-green-600"
            iconBg="bg-green-100"
            title="Bảo mật tài khoản"
            description="Xác thực 2 yếu tố để bảo vệ tài khoản quản trị"
          >
            <MFASettings userId={user.id} />
          </SettingsSection>
        )}
      </div>

      {ReauthModal}
      {/* ============================================================ */}
      {/* Sticky save bar */}
      {/* ============================================================ */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-200 mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-xs text-gray-400">
          {settings.updated_at && (
            <span>
              Cập nhật lần cuối: {formatRelativeTime(settings.updated_at)}
              {updatedByName && ` bởi ${updatedByName}`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Hoàn tác
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
