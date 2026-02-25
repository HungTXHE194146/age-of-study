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
  CONSTRAINT chat_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
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
CREATE TABLE public.daily_usage (
  user_id uuid NOT NULL,
  study_date date NOT NULL DEFAULT CURRENT_DATE,
  total_seconds integer DEFAULT 0,
  CONSTRAINT daily_usage_pkey PRIMARY KEY (user_id, study_date),
  CONSTRAINT daily_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
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
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id),
  CONSTRAINT questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT questions_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id)
);
CREATE TABLE public.quiz_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid,
  question_id uuid,
  selected_option_index integer NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_answers_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_answers_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.test_submissions(id),
  CONSTRAINT quiz_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
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
  CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.subjects (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subjects_pkey PRIMARY KEY (id)
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
CREATE TABLE public.user_badges (
  user_id uuid NOT NULL,
  badge_id text NOT NULL,
  earned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_badges_pkey PRIMARY KEY (user_id, badge_id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id)
);