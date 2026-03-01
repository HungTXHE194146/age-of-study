-- Migration: Add system_settings table for admin-configurable settings
-- This table stores global system configuration as a single-row table.
-- Only system_admin can update; all authenticated users can read.

-- ============================================================================
-- 1. CREATE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_settings (
  -- Single-row enforcement: id is always 1
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  -- School info
  school_name text NOT NULL DEFAULT 'Trường Tiểu học Ninh Lai',
  school_year text NOT NULL DEFAULT '2025-2026',

  -- Default learning limits (applied to new users)
  default_daily_limit_minutes integer NOT NULL DEFAULT 30 CHECK (default_daily_limit_minutes BETWEEN 5 AND 480),

  -- AI Chatbot parameters
  ai_chat_temperature numeric(3,2) NOT NULL DEFAULT 0.70 CHECK (ai_chat_temperature BETWEEN 0 AND 2),
  ai_chat_max_tokens integer NOT NULL DEFAULT 1500 CHECK (ai_chat_max_tokens BETWEEN 100 AND 8192),
  ai_chat_rate_limit_per_minute integer NOT NULL DEFAULT 10 CHECK (ai_chat_rate_limit_per_minute BETWEEN 1 AND 100),

  -- AI Question Generator parameters
  ai_question_temperature numeric(3,2) NOT NULL DEFAULT 0.30 CHECK (ai_question_temperature BETWEEN 0 AND 2),
  ai_question_max_tokens integer NOT NULL DEFAULT 8000 CHECK (ai_question_max_tokens BETWEEN 100 AND 32000),

  -- Audit fields
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- 2. INSERT DEFAULT ROW
-- ============================================================================
INSERT INTO system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. AUTO-UPDATE updated_at TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS system_settings_updated_at ON system_settings;
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_timestamp();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read settings
CREATE POLICY "system_settings_select"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only system_admin can update settings
CREATE POLICY "system_settings_update"
  ON system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'system_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'system_admin'
    )
  );

-- Prevent deletion of the settings row
CREATE POLICY "system_settings_no_delete"
  ON system_settings
  FOR DELETE
  TO authenticated
  USING (false);

-- Prevent inserting additional rows (single-row table)
CREATE POLICY "system_settings_no_insert"
  ON system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (false);
