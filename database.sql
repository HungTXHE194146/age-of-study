-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_id bigint,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  xp_earned integer DEFAULT 0,
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.avatar_shop (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  avatar_code text NOT NULL UNIQUE,
  avatar_type text NOT NULL CHECK (avatar_type = ANY (ARRAY['emoji'::text, 'dicebear'::text])),
  display_name text NOT NULL,
  description text,
  xp_cost integer NOT NULL DEFAULT 0,
  required_level integer DEFAULT 1,
  is_active boolean DEFAULT true,
  is_premium boolean DEFAULT false,
  category text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT avatar_shop_pkey PRIMARY KEY (id)
);
CREATE TABLE public.badges (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  icon_url text,
  condition_type text,
  condition_value integer,
  CONSTRAINT badges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  teacher_id uuid,
  title text NOT NULL,
  description text,
  category text,
  design_template text DEFAULT 'classic'::text,
  issued_at timestamp with time zone DEFAULT now(),
  viewed_at timestamp with time zone,
  shared_at timestamp with time zone,
  teacher_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT certificates_pkey PRIMARY KEY (id),
  CONSTRAINT certificates_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT certificates_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.chat_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_hash text NOT NULL UNIQUE,
  subject_id bigint,
  original_message text NOT NULL,
  response text NOT NULL,
  hit_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval),
  CONSTRAINT chat_cache_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chat_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  question_id uuid,
  sender text CHECK (sender = ANY (ARRAY['user'::text, 'ai'::text])),
  message text NOT NULL,
  is_blocked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  conversation_id text,
  subject_id bigint,
  CONSTRAINT chat_logs_pkey PRIMARY KEY (id),
  CONSTRAINT chat_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT chat_logs_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id)
);
CREATE TABLE public.class_students (
  class_id bigint NOT NULL,
  student_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  left_at timestamp with time zone,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'transferred'::text, 'withdrawn'::text])),
  CONSTRAINT class_students_pkey PRIMARY KEY (class_id, student_id),
  CONSTRAINT class_students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT class_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.class_teachers (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  class_id bigint,
  teacher_id uuid,
  subject_id bigint,
  is_homeroom boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT class_teachers_pkey PRIMARY KEY (id),
  CONSTRAINT class_teachers_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT class_teachers_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id),
  CONSTRAINT class_teachers_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id)
);
CREATE TABLE public.classes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  grade integer NOT NULL CHECK (grade >= 1 AND grade <= 5),
  school_year text NOT NULL,
  class_code text NOT NULL UNIQUE,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'archived'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT classes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.document_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  node_id bigint,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT document_chunks_pkey PRIMARY KEY (id),
  CONSTRAINT document_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT document_chunks_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id)
);
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid,
  subject_id bigint,
  node_id bigint,
  title text NOT NULL,
  content text NOT NULL,
  file_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  file_name text,
  file_type text DEFAULT 'pdf'::text,
  total_pages integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'confirmed'::text CHECK (status = ANY (ARRAY['confirmed'::text, 'pending'::text, 'processing'::text, 'error'::text])),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id),
  CONSTRAINT documents_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT documents_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id)
);
CREATE TABLE public.lesson_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  node_id bigint,
  section_type USER-DEFINED NOT NULL DEFAULT 'other'::section_type_enum,
  title text NOT NULL,
  content text NOT NULL DEFAULT ''::text,
  qa_pairs jsonb DEFAULT '[]'::jsonb,
  remember text,
  images jsonb DEFAULT '[]'::jsonb,
  source_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lesson_sections_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_sections_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id)
);
CREATE TABLE public.magic_login_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  code text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  CONSTRAINT magic_login_codes_pkey PRIMARY KEY (id),
  CONSTRAINT magic_login_codes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT magic_login_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.nodes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  subject_id bigint,
  title text NOT NULL,
  description text,
  required_xp integer DEFAULT 50,
  parent_node_id bigint,
  position_x integer,
  position_y integer,
  created_at timestamp with time zone DEFAULT now(),
  node_type text DEFAULT 'lesson'::text CHECK (node_type = ANY (ARRAY['subject'::text, 'chapter'::text, 'week'::text, 'lesson'::text, 'content'::text])),
  week_number integer,
  lesson_number integer,
  page_start integer,
  page_end integer,
  content_label text,
  order_index integer DEFAULT 0,
  source_position text DEFAULT 'bottom'::text CHECK (source_position = ANY (ARRAY['top'::text, 'bottom'::text, 'left'::text, 'right'::text])),
  target_position text DEFAULT 'top'::text CHECK (target_position = ANY (ARRAY['top'::text, 'bottom'::text, 'left'::text, 'right'::text])),
  CONSTRAINT nodes_pkey PRIMARY KEY (id),
  CONSTRAINT nodes_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT nodes_parent_node_id_fkey FOREIGN KEY (parent_node_id) REFERENCES public.nodes(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  role USER-DEFINED DEFAULT 'student'::user_role,
  total_xp integer DEFAULT 0,
  weekly_xp integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  last_study_date date,
  freeze_count integer DEFAULT 0,
  daily_limit_minutes integer DEFAULT 30,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_blocked boolean DEFAULT false,
  age integer,
  grade integer,
  favorite_subject text,
  profile_completed_reward_claimed boolean DEFAULT false,
  monthly_xp integer NOT NULL DEFAULT 0,
  tier USER-DEFINED DEFAULT 'bronze'::tier_level,
  previous_week_xp integer DEFAULT 0,
  previous_month_xp integer DEFAULT 0,
  last_tier_update timestamp with time zone DEFAULT now(),
  dob text,
  gender text,
  ethnicity text,
  phone_number text,
  enroll_status text,
  sessions_per_week text,
  must_change_password boolean DEFAULT false,
  last_active_at timestamp with time zone,
  email text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  node_id bigint,
  content jsonb NOT NULL,
  correct_option_index integer,
  difficulty text CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])),
  status text DEFAULT 'available'::text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  q_type USER-DEFINED DEFAULT 'multiple_choice'::question_type,
  model_answer text,
  subject_id bigint,
  explanation text,
  embedding USER-DEFINED,
  tags ARRAY DEFAULT '{}'::text[],
  source_document_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id),
  CONSTRAINT questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT questions_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id)
);
CREATE TABLE public.student_node_progress (
  student_id uuid NOT NULL,
  node_id bigint NOT NULL,
  status text DEFAULT 'not_started'::text CHECK (status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])),
  score text,
  last_accessed_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  submit_count smallint DEFAULT '1'::smallint CHECK (submit_count > 0),
  CONSTRAINT student_node_progress_pkey PRIMARY KEY (student_id, node_id),
  CONSTRAINT student_node_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT student_node_progress_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id)
);
CREATE TABLE public.subjects (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  grade_level text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subjects_pkey PRIMARY KEY (id)
);
CREATE TABLE public.system_settings (
  id integer NOT NULL DEFAULT 1 CHECK (id = 1),
  school_name text NOT NULL DEFAULT 'Trường Tiểu học Ninh Lai'::text,
  school_year text NOT NULL DEFAULT '2025-2026'::text,
  default_daily_limit_minutes integer NOT NULL DEFAULT 30 CHECK (default_daily_limit_minutes >= 5 AND default_daily_limit_minutes <= 480),
  ai_chat_temperature numeric NOT NULL DEFAULT 0.70 CHECK (ai_chat_temperature >= 0::numeric AND ai_chat_temperature <= 2::numeric),
  ai_chat_max_tokens integer NOT NULL DEFAULT 1500 CHECK (ai_chat_max_tokens >= 100 AND ai_chat_max_tokens <= 8192),
  ai_chat_rate_limit_per_minute integer NOT NULL DEFAULT 10 CHECK (ai_chat_rate_limit_per_minute >= 1 AND ai_chat_rate_limit_per_minute <= 100),
  ai_question_temperature numeric NOT NULL DEFAULT 0.30 CHECK (ai_question_temperature >= 0::numeric AND ai_question_temperature <= 2::numeric),
  ai_question_max_tokens integer NOT NULL DEFAULT 8000 CHECK (ai_question_max_tokens >= 100 AND ai_question_max_tokens <= 32000),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT system_settings_pkey PRIMARY KEY (id),
  CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.test_assignments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  test_id uuid,
  class_id bigint,
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  due_date timestamp with time zone,
  CONSTRAINT test_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT test_assignments_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.tests(id),
  CONSTRAINT test_assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT test_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.test_questions (
  test_id uuid NOT NULL,
  question_id uuid NOT NULL,
  points integer DEFAULT 10,
  display_order integer DEFAULT 0,
  CONSTRAINT test_questions_pkey PRIMARY KEY (test_id, question_id),
  CONSTRAINT test_questions_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.tests(id),
  CONSTRAINT test_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.test_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_id uuid,
  student_id uuid,
  score integer DEFAULT 0,
  total_questions integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  started_at timestamp with time zone DEFAULT now(),
  submitted_at timestamp with time zone,
  status text DEFAULT 'in_progress'::text,
  CONSTRAINT test_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT test_submissions_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.tests(id),
  CONSTRAINT test_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.tests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type USER-DEFINED DEFAULT 'practice'::test_type,
  node_id bigint,
  settings jsonb DEFAULT '{"time_limit": 30, "allow_retry": true}'::jsonb,
  is_published boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  subject_id bigint,
  max_xp integer DEFAULT 0,
  class_id bigint,
  CONSTRAINT tests_pkey PRIMARY KEY (id),
  CONSTRAINT tests_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id),
  CONSTRAINT tests_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT tests_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT tests_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
CREATE TABLE public.user_avatars (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  avatar_code text NOT NULL,
  avatar_type text NOT NULL CHECK (avatar_type = ANY (ARRAY['emoji'::text, 'dicebear'::text])),
  is_unlocked boolean DEFAULT false,
  unlocked_at timestamp with time zone,
  xp_cost integer DEFAULT 0,
  source text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_avatars_pkey PRIMARY KEY (id),
  CONSTRAINT user_avatars_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_badges (
  user_id uuid NOT NULL,
  badge_id text NOT NULL,
  earned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_badges_pkey PRIMARY KEY (user_id, badge_id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id)
);