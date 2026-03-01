/**
 * System Settings types — matches the `system_settings` database table.
 * Single-row table enforced by CHECK (id = 1).
 */

export interface SystemSettings {
  id: number

  // School info
  school_name: string
  school_year: string

  // Default learning limits
  default_daily_limit_minutes: number

  // AI Chatbot parameters
  ai_chat_temperature: number
  ai_chat_max_tokens: number
  ai_chat_rate_limit_per_minute: number

  // AI Question Generator parameters
  ai_question_temperature: number
  ai_question_max_tokens: number

  // Audit
  updated_at: string
  updated_by: string | null
}

/** Payload for updating system settings (omit read-only fields) */
export type SystemSettingsUpdate = Partial<
  Omit<SystemSettings, 'id' | 'updated_at' | 'updated_by'>
>

/** Validation constraints for settings fields */
export const SETTINGS_CONSTRAINTS = {
  default_daily_limit_minutes: { min: 5, max: 480 },
  ai_chat_temperature: { min: 0, max: 2, step: 0.05 },
  ai_chat_max_tokens: { min: 100, max: 8192 },
  ai_chat_rate_limit_per_minute: { min: 1, max: 100 },
  ai_question_temperature: { min: 0, max: 2, step: 0.05 },
  ai_question_max_tokens: { min: 100, max: 32000 },
} as const
