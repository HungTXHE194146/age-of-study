-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.badges (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  icon_url text,
  condition_type text,
  condition_value integer,
  CONSTRAINT badges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chat_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  question_id uuid,
  sender text CHECK (sender = ANY (ARRAY['user'::text, 'ai'::text])),
  message text NOT NULL,
  is_blocked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_logs_pkey PRIMARY KEY (id),
  CONSTRAINT chat_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT chat_logs_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.daily_usage (
  user_id uuid NOT NULL,
  study_date date NOT NULL DEFAULT CURRENT_DATE,
  total_seconds integer DEFAULT 0,
  CONSTRAINT daily_usage_pkey PRIMARY KEY (user_id, study_date),
  CONSTRAINT daily_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subject_id bigint,
  node_id bigint,
  title text NOT NULL,
  file_url text NOT NULL,
  extracted_text text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT documents_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id),
  CONSTRAINT documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
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
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nodes_pkey PRIMARY KEY (id),
  CONSTRAINT nodes_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT nodes_parent_node_id_fkey FOREIGN KEY (parent_node_id) REFERENCES public.nodes(id),
  CONSTRAINT nodes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
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
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  node_id bigint,
  document_id uuid,
  content jsonb NOT NULL,
  correct_option_index integer NOT NULL CHECK (correct_option_index >= 0 AND correct_option_index <= 3),
  difficulty text CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])),
  status USER-DEFINED DEFAULT 'pending'::question_status,
  source USER-DEFINED DEFAULT 'ai'::question_source,
  created_by uuid,
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id),
  CONSTRAINT questions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT questions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  question_id uuid,
  selected_option_index integer NOT NULL,
  is_correct boolean NOT NULL,
  xp_earned integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT quiz_attempts_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.student_progress (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  student_id uuid,
  node_id bigint,
  xp_accumulated integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  unlocked_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT student_progress_pkey PRIMARY KEY (id),
  CONSTRAINT student_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT student_progress_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id)
);
CREATE TABLE public.subjects (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subjects_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_badges (
  user_id uuid NOT NULL,
  badge_id text NOT NULL,
  earned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_badges_pkey PRIMARY KEY (user_id, badge_id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id)
);