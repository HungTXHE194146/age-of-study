-- Migration: Add Magic Login (Teacher-generated one-time codes for students)
-- Run on: Supabase Dashboard → SQL Editor

-- 1. Add must_change_password flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

-- 2. Create table to store one-time login codes
CREATE TABLE IF NOT EXISTS public.magic_login_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone NULL
);

-- 3. Index for fast lookup by student_id + code
CREATE INDEX IF NOT EXISTS idx_magic_login_codes_student_id
  ON public.magic_login_codes (student_id);

CREATE INDEX IF NOT EXISTS idx_magic_login_codes_code
  ON public.magic_login_codes (code);

-- 4. Enable RLS
ALTER TABLE public.magic_login_codes ENABLE ROW LEVEL SECURITY;

-- 5. Teachers can insert codes for their students
CREATE POLICY "Teachers can create magic codes"
ON public.magic_login_codes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  )
);

-- 6. Teachers can view codes they created (to show in UI)
CREATE POLICY "Teachers can view their own codes"
ON public.magic_login_codes FOR SELECT
USING (created_by = auth.uid());
