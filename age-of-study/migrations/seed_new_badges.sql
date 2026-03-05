-- ============================================================================
-- Seed: New Diverse Badges for AgeOfStudy
-- Mở rộng bộ badge từ 11 lên 30+, không trùng với badge hiện có.
-- Run in Supabase SQL Editor.
-- ============================================================================

INSERT INTO public.badges (id, name, description, icon_url, condition_type, condition_value, xp_reward)
VALUES

  -- ── Streak Ladder (bổ sung 3, 14, 60, 100) ─────────────────────────────
  -- Existing: streak_7 (7 ngày), streak_30 (30 ngày)
  ('streak_3',   'Khởi Động',         'Học 3 ngày liên tiếp — một khởi đầu tốt!',         '🌱', 'streak',       3,   30),
  ('streak_14',  'Hai Tuần Vàng',     'Học liên tục 14 ngày không nghỉ.',                  '📅', 'streak',      14,  150),
  ('streak_60',  'Lửa Không Tắt',     'Học liên tục 60 ngày — ý chí của chiến binh!',      '🔥', 'streak',      60,  500),
  ('streak_100', 'Huyền Thoại',       'Học liên tục 100 ngày. Bất khả chiến bại!',         '🌟', 'streak',     100, 1000),

  -- ── Quiz Count Ladder (bổ sung 5, 10, 25, 50, 200, 500) ────────────────
  -- Existing: first_quiz (1 quiz), quiz_master (100 quiz)
  ('quiz_5',    'Vào Guồng',          'Hoàn thành 5 bài quiz đầu tiên.',                   '✏️', 'quiz_count',   5,   30),
  ('quiz_10',   'Ham Học Hỏi',        'Hoàn thành 10 bài quiz.',                           '📖', 'quiz_count',  10,   50),
  ('quiz_25',   'Học Sinh Siêng',     'Hoàn thành 25 bài quiz.',                           '💡', 'quiz_count',  25,  100),
  ('quiz_50',   'Cần Cù Bù Thông',    'Hoàn thành 50 bài quiz. Nỗ lực đáng khen!',        '🏋️', 'quiz_count',  50,  200),
  ('quiz_200',  'Máy Học',            'Hoàn thành 200 bài quiz. Không thể dừng lại!',      '🤖', 'quiz_count', 200,  800),
  ('quiz_500',  'Bách Khoa Toàn Thư', 'Hoàn thành 500 bài quiz. Bạn là kho tri thức!',    '🧠', 'quiz_count', 500, 2000),

  -- ── Rank Expanded (Top 1 & Top 10, bổ sung cả weekly & monthly) ────────
  -- Existing: top_weekly (rank_weekly = 3), top_monthly (rank_monthly = 3)
  ('rank_top1_weekly',   'Quán Quân Tuần',   'Đứng #1 bảng xếp hạng tuần.',            '🥇', 'rank_weekly',   1, 300),
  ('rank_top1_monthly',  'Quán Quân Tháng',  'Đứng #1 bảng xếp hạng tháng.',           '👑', 'rank_monthly',  1, 600),
  ('rank_top10_weekly',  'Top 10 Tuần',      'Lọt Top 10 bảng xếp hạng tuần.',         '🏅', 'rank_weekly',  10,  75),
  ('rank_top10_monthly', 'Top 10 Tháng',     'Lọt Top 10 bảng xếp hạng tháng.',        '🎖️', 'rank_monthly', 10, 150),

  -- ── Improvement Extended (100% và 200%, bổ sung thêm ngưỡng) ───────────
  -- Existing: improvement_50 (50%)
  ('improvement_100', 'Bứt Phá',   'Gấp đôi XP so với tuần trước (+100%).',            '🚀', 'improvement', 100, 200),
  ('improvement_200', 'Thần Tốc',  'Tăng trưởng 200% XP so với tuần trước. Wow!',      '⚡', 'improvement', 200, 400),

  -- ── Persistence Extended (bền bỉ nhiều lần hơn) ─────────────────────────
  -- Existing: persistent (persistence = 1)
  ('persistent_5',  'Tinh Thần Thép',  'Thử lại và hoàn thành quiz dù thất bại 5 lần.', '🛡️', 'persistence', 5, 100),
  ('persistent_10', 'Ý Chí Sắt Đá',   'Kiên trì đến cùng dù gặp khó khăn 10 lần.',    '⚔️', 'persistence', 10, 200),

  -- ── Tier Badge bổ sung (Bronze — mọi người đều có thể đạt) ─────────────
  -- Existing: tier_silver (2), tier_gold (3), tier_diamond (4)
  ('tier_bronze', 'Huy Hiệu Đồng', 'Chào mừng bạn đến với AgeOfStudy! Đạt Tier Đồng.', '🥉', 'tier', 1, 25)

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Tổng kết:
--  11 badge cũ + 19 badge mới = 30 badge
--  Điều kiện phủ: streak (x6), quiz_count (x7), rank (x6), improvement (x3),
--                 persistence (x3), tier (x4)
-- ============================================================================
