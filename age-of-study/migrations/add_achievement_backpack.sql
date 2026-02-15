-- ============================================================================
-- ACHIEVEMENT BACKPACK SYSTEM
-- Migration: add_achievement_backpack.sql
-- Purpose: Add tables for student achievement backpack (avatars, certificates)
-- ============================================================================

-- 1. User Avatars Collection Table
-- Tracks which avatars a student has unlocked/purchased with XP
CREATE TABLE IF NOT EXISTS public.user_avatars (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  avatar_code text NOT NULL,  -- Avatar identifier (emoji or DiceBear code)
  avatar_type text NOT NULL CHECK (avatar_type IN ('emoji', 'dicebear')),
  is_unlocked boolean DEFAULT false,
  unlocked_at timestamp with time zone,
  xp_cost integer DEFAULT 0,  -- How much XP was spent to unlock
  source text,  -- 'purchase', 'level_reward', 'event', 'default'
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_user_avatar UNIQUE (user_id, avatar_code)
);

-- Index for faster user avatar queries
CREATE INDEX IF NOT EXISTS idx_user_avatars_user_id ON public.user_avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_user_avatars_unlocked ON public.user_avatars(user_id, is_unlocked);

-- 2. Certificates Table
-- Digital certificates awarded by teachers to students
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,  -- e.g., "Bé ngoan của lớp"
  description text,  -- e.g., "Đã làm tốt bài Toán"
  category text,  -- 'academic', 'behavior', 'participation', 'special'
  design_template text DEFAULT 'classic',  -- 'classic', 'modern', 'playful'
  issued_at timestamp with time zone DEFAULT now(),
  viewed_at timestamp with time zone,  -- When student first viewed it
  shared_at timestamp with time zone,  -- When student shared with parents
  
  -- Store teacher name at time of issuance (in case teacher is removed later)
  teacher_name text NOT NULL,
  
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for certificate queries
CREATE INDEX IF NOT EXISTS idx_certificates_student ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_teacher ON public.certificates(teacher_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON public.certificates(issued_at DESC);

-- 3. Avatar Shop/Catalog Table (Optional - for future extensibility)
-- Defines which avatars are available for purchase and their costs
CREATE TABLE IF NOT EXISTS public.avatar_shop (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  avatar_code text NOT NULL UNIQUE,
  avatar_type text NOT NULL CHECK (avatar_type IN ('emoji', 'dicebear')),
  display_name text NOT NULL,
  description text,
  xp_cost integer NOT NULL DEFAULT 0,
  required_level integer DEFAULT 1,  -- Minimum level to unlock
  is_active boolean DEFAULT true,  -- Can be purchased
  is_premium boolean DEFAULT false,  -- Special/rare avatar
  category text,  -- 'animals', 'fantasy', 'cool', 'cute', etc.
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Index for shop queries
CREATE INDEX IF NOT EXISTS idx_avatar_shop_active ON public.avatar_shop(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_avatar_shop_category ON public.avatar_shop(category);

-- 4. Seed default unlocked avatars for existing users
-- Give all existing students their current avatar as unlocked
-- Fixed: Improved emoji detection - check for URL patterns instead of unreliable length
INSERT INTO public.user_avatars (user_id, avatar_code, avatar_type, is_unlocked, unlocked_at, source)
SELECT 
  id as user_id,
  COALESCE(avatar_url, '😊') as avatar_code,
  CASE 
    -- If avatar_url contains URL patterns (http/https or slashes), it's a DiceBear URL
    WHEN avatar_url IS NULL THEN 'emoji'
    WHEN avatar_url LIKE '%http%' OR avatar_url LIKE '%/%' THEN 'dicebear'
    -- Otherwise assume it's an emoji (single character or multi-codepoint emoji)
    ELSE 'emoji'
  END as avatar_type,
  true as is_unlocked,
  now() as unlocked_at,
  'default' as source
FROM public.profiles
WHERE role = 'student'
ON CONFLICT (user_id, avatar_code) DO NOTHING;

-- 5. Seed avatar shop with default emoji avatars
INSERT INTO public.avatar_shop (avatar_code, avatar_type, display_name, description, xp_cost, category, sort_order)
VALUES
  -- Free default avatars (0 XP)
  ('😊', 'emoji', 'Mặt vui vẻ', 'Avatar mặc định dễ thương', 0, 'default', 1),
  ('🙂', 'emoji', 'Nụ cười nhẹ', 'Nụ cười tươi tắn', 0, 'default', 2),
  
  -- Animals (50 XP each)
  ('🐶', 'emoji', 'Chó con', 'Chú chó đáng yêu', 50, 'animals', 10),
  ('🐱', 'emoji', 'Mèo con', 'Chú mèo dễ thương', 50, 'animals', 11),
  ('🐼', 'emoji', 'Gấu trúc', 'Gấu trúc ngộ nghĩnh', 50, 'animals', 12),
  ('🐰', 'emoji', 'Thỏ con', 'Chú thỏ trắng', 50, 'animals', 13),
  ('🦊', 'emoji', 'Cáo nhỏ', 'Cáo thông minh', 50, 'animals', 14),
  ('🐯', 'emoji', 'Hổ con', 'Hổ dũng mãnh', 50, 'animals', 15),
  ('🦁', 'emoji', 'Sư tử', 'Chúa sơn lâm', 50, 'animals', 16),
  ('🐨', 'emoji', 'Gấu túi', 'Koala dễ thương', 50, 'animals', 17),
  
  -- Fantasy/Cool (100 XP each)
  ('🦄', 'emoji', 'Kỳ lân', 'Kỳ lân thần thoại', 100, 'fantasy', 20),
  ('🐉', 'emoji', 'Rồng', 'Rồng huyền thoại', 100, 'fantasy', 21),
  ('🦅', 'emoji', 'Đại bàng', 'Bay cao vút', 100, 'fantasy', 22),
  ('🦋', 'emoji', 'Bươm bướm', 'Bươm bướm xinh đẹp', 100, 'fantasy', 23),
  ('🌟', 'emoji', 'Ngôi sao', 'Ngôi sao sáng', 100, 'fantasy', 24),
  ('⚡', 'emoji', 'Tia chớp', 'Nhanh như chớp', 100, 'fantasy', 25),
  ('🔥', 'emoji', 'Ngọn lửa', 'Nhiệt huyết', 100, 'fantasy', 26),
  ('💎', 'emoji', 'Kim cương', 'Quý giá', 100, 'fantasy', 27),
  
  -- Premium (200+ XP)
  ('👑', 'emoji', 'Vương miện', 'Nhà vô địch', 200, 'premium', 30),
  ('🏆', 'emoji', 'Cúp vàng', 'Chiến thắng', 200, 'premium', 31),
  ('🦸', 'emoji', 'Siêu anh hùng', 'Cứu thế giới', 300, 'premium', 32),
  ('🚀', 'emoji', 'Tên lửa', 'Bay vào vũ trụ', 300, 'premium', 33)
ON CONFLICT (avatar_code) DO NOTHING;

-- 6. Database Functions for Secure Updates

-- Function to safely update only certificate timestamp columns
-- This prevents students from modifying title, description, teacher_name, etc.
CREATE OR REPLACE FUNCTION public.update_certificate_timestamps(
  p_certificate_id uuid,
  p_viewed_at timestamp with time zone DEFAULT NULL,
  p_shared_at timestamp with time zone DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the certificate belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM public.certificates
    WHERE id = p_certificate_id AND student_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Certificate not found or access denied';
  END IF;

  -- Only update the timestamp columns
  UPDATE public.certificates
  SET
    viewed_at = COALESCE(p_viewed_at, viewed_at),
    shared_at = COALESCE(p_shared_at, shared_at)
  WHERE id = p_certificate_id AND student_id = auth.uid();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_certificate_timestamps(uuid, timestamp with time zone, timestamp with time zone) TO authenticated;

-- 7. RLS (Row Level Security) Policies

-- Enable RLS
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_shop ENABLE ROW LEVEL SECURITY;

-- User Avatars Policies
-- Students can view their own avatars
CREATE POLICY "Students can view own avatars"
  ON public.user_avatars FOR SELECT
  USING (auth.uid() = user_id);

-- Students can insert their own avatar unlocks (when purchasing)
CREATE POLICY "Students can unlock avatars"
  ON public.user_avatars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Students can update their own avatars
CREATE POLICY "Students can update own avatars"
  ON public.user_avatars FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all avatars
CREATE POLICY "Admins can view all avatars"
  ON public.user_avatars FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'system_admin'
    )
  );

-- Certificate Policies
-- Students can view their own certificates
CREATE POLICY "Students can view own certificates"
  ON public.certificates FOR SELECT
  USING (auth.uid() = student_id);

-- Teachers can view certificates they issued
CREATE POLICY "Teachers can view issued certificates"
  ON public.certificates FOR SELECT
  USING (auth.uid() = teacher_id);

-- Teachers can issue certificates
CREATE POLICY "Teachers can issue certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'system_admin')
    )
  );

-- SECURITY FIX: Students CANNOT directly UPDATE certificates via SQL
-- They must use the update_certificate_timestamps() function which restricts updates
-- to only viewed_at and shared_at columns. This prevents tampering with title, 
-- description, teacher_name, or other immutable fields.
-- Note: No UPDATE policy is created here intentionally for security.

-- Admins can update all certificate fields (for corrections/management)
CREATE POLICY "Admins can update certificates"
  ON public.certificates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'system_admin'
    )
  );

-- Admins can view all certificates
CREATE POLICY "Admins can view all certificates"
  ON public.certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'system_admin'
    )
  );

-- Avatar Shop Policies
-- Everyone can view active shop items
CREATE POLICY "Everyone can view avatar shop"
  ON public.avatar_shop FOR SELECT
  USING (is_active = true);

-- Admins can manage shop items
CREATE POLICY "Admins can manage avatar shop"
  ON public.avatar_shop FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'system_admin'
    )
  );

-- 8. Comments for documentation
COMMENT ON TABLE public.user_avatars IS 'Tracks which avatars each student has unlocked';
COMMENT ON TABLE public.certificates IS 'Digital certificates awarded by teachers to students';
COMMENT ON TABLE public.avatar_shop IS 'Catalog of available avatars for purchase';
COMMENT ON FUNCTION public.update_certificate_timestamps IS 'Securely updates only viewed_at and shared_at columns for certificates owned by the current user';

COMMENT ON COLUMN public.user_avatars.avatar_code IS 'Avatar identifier - emoji character or DiceBear seed';
COMMENT ON COLUMN public.user_avatars.source IS 'How avatar was obtained: purchase, level_reward, event, default';
COMMENT ON COLUMN public.certificates.design_template IS 'Certificate design theme: classic, modern, playful';
COMMENT ON COLUMN public.certificates.category IS 'Certificate category: academic, behavior, participation, special';
COMMENT ON COLUMN public.certificates.viewed_at IS 'Timestamp when student first viewed certificate - update via update_certificate_timestamps() function';
COMMENT ON COLUMN public.certificates.shared_at IS 'Timestamp when student shared certificate with parents - update via update_certificate_timestamps() function';
