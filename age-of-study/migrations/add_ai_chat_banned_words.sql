-- Migration: Add ai_chat_banned_words to system_settings
-- Reversible: Yes

-- Add column with default empty string
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS ai_chat_banned_words text NOT NULL DEFAULT '';

-- Add a comment to the column for documentation
COMMENT ON COLUMN public.system_settings.ai_chat_banned_words IS 'Comma-separated list of banned words that the AI chatbot will refuse to answer. Evaluated lowercase substring format.';
