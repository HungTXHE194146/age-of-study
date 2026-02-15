-- ============================================================================
-- AI CHATBOT SYSTEM TABLES
-- Migration: add_ai_chatbot_tables.sql
-- Purpose: Add documents table (RAG knowledge base) and chat_cache table
-- ============================================================================

-- ============================================================================
-- 1. DOCUMENTS TABLE - Stores extracted text from teacher-uploaded materials
-- ============================================================================
-- WHY: Chatbot needs a knowledge base to answer from. Teachers upload PDF/DOCX,
-- we extract the text and store it here. This avoids re-parsing files on every 
-- chat request (parsing PDF takes ~2s vs reading text from DB takes ~10ms).

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  subject_id bigint,
  node_id bigint,
  title text NOT NULL,
  content text NOT NULL,           -- Extracted text from the uploaded file
  file_url text,                    -- Optional: link to original file in Supabase Storage
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id),
  CONSTRAINT documents_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT documents_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id)
);

-- Index for querying documents by subject (most common query pattern for RAG)
CREATE INDEX IF NOT EXISTS idx_documents_subject_id ON public.documents(subject_id);
CREATE INDEX IF NOT EXISTS idx_documents_teacher_id ON public.documents(teacher_id);

-- Full-text search index on documents content
-- WHY: Instead of sending ALL documents to Gemini (expensive), we use PostgreSQL 
-- full-text search to find only relevant documents. This reduces token cost ~6x.
-- Using 'simple' config because Vietnamese tokenization in 'vietnamese' config 
-- may not be available on all Supabase instances.
CREATE INDEX IF NOT EXISTS idx_documents_content_fts 
  ON public.documents USING gin(to_tsvector('simple', content));

-- RLS policies for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own documents
CREATE POLICY "Teachers can insert own documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can view own documents" ON public.documents
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own documents" ON public.documents
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own documents" ON public.documents
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

-- Students can view documents (needed for RAG context retrieval)
-- In production, scope this to documents in their enrolled classes
CREATE POLICY "Students can view documents" ON public.documents
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- 2. CHAT_CACHE TABLE - Caches AI responses to reduce API calls
-- ============================================================================
-- WHY: Many students ask similar questions ("Phân số là gì?"). Without cache,
-- each identical question costs ~30K tokens. With cache, we serve the answer 
-- from DB in <100ms at zero API cost. Expected to reduce Gemini calls by 60-80%.

CREATE TABLE IF NOT EXISTS public.chat_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_hash text NOT NULL,      -- MD5 hash of (message + subject_id) for fast lookup
  subject_id bigint,
  original_message text NOT NULL,   -- The original question (for debugging/review)
  response text NOT NULL,           -- Cached AI response
  hit_count integer DEFAULT 0,      -- Track popularity for cache optimization
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
  
  CONSTRAINT chat_cache_pkey PRIMARY KEY (id),
  CONSTRAINT chat_cache_question_hash_key UNIQUE (question_hash)
);

-- Index for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_chat_cache_hash ON public.chat_cache(question_hash);
CREATE INDEX IF NOT EXISTS idx_chat_cache_expires ON public.chat_cache(expires_at);

-- RLS: Only server (service_role) should manage cache
ALTER TABLE public.chat_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read cache (for API route using user's JWT)
CREATE POLICY "Anyone can read cache" ON public.chat_cache
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- 3. ADD FULL-TEXT SEARCH INDEX ON EXISTING QUESTIONS TABLE
-- ============================================================================
-- WHY: Same reason as documents - selective retrieval reduces token cost.
-- We search question content (JSONB) for relevant quiz questions to include
-- in the AI's context when answering student questions.

-- Note: questions.content is JSONB with structure: {"question": "...", "options": [...], "explanation": "..."}
-- We index the 'question' and 'explanation' fields for full-text search
CREATE INDEX IF NOT EXISTS idx_questions_content_fts 
  ON public.questions USING gin(
    to_tsvector('simple', 
      COALESCE(content->>'question', '') || ' ' || COALESCE(content->>'explanation', '')
    )
  );

-- ============================================================================
-- 4. ADD CONVERSATION_ID TO CHAT_LOGS (for grouping messages into sessions)
-- ============================================================================
ALTER TABLE public.chat_logs 
  ADD COLUMN IF NOT EXISTS conversation_id text;

ALTER TABLE public.chat_logs 
  ADD COLUMN IF NOT EXISTS subject_id bigint REFERENCES public.subjects(id);

CREATE INDEX IF NOT EXISTS idx_chat_logs_user_conversation 
  ON public.chat_logs(user_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at 
  ON public.chat_logs(created_at);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.documents IS 'Stores extracted text from teacher-uploaded teaching materials for RAG-based AI chatbot';
COMMENT ON TABLE public.chat_cache IS 'Caches AI chatbot responses to reduce Gemini API calls and costs';
COMMENT ON COLUMN public.chat_cache.question_hash IS 'MD5 hash of normalized(message) + subject_id for deduplication';
COMMENT ON COLUMN public.chat_logs.conversation_id IS 'Groups chat messages into conversation sessions';

-- ============================================================================
-- USAGE
-- ============================================================================
-- Run this migration in Supabase SQL Editor or via CLI:
--   supabase db push
-- 
-- Verify:
--   SELECT * FROM public.documents LIMIT 1;
--   SELECT * FROM public.chat_cache LIMIT 1;
-- ============================================================================
