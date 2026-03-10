-- ============================================================================
-- Seed initial progress for TV5 students (mid-year unlock)
--
-- Purpose: Students đang học đến Bài 15 Tuần 26 rồi, cần unlock
--          tất cả lessons từ đầu đến bài hiện tại để không bắt học lại từ đầu.
--
-- Logic:
--   Lấy tất cả TV5 lesson nodes có week_number <= CURRENT_WEEK
--   Insert "completed" progress cho tất cả students đã có trong hệ thống
--   ON CONFLICT DO NOTHING → không ghi đè progress thật của students 
--                             đã từng dùng hệ thống
--
-- Usage: Chạy 1 lần lúc go-live. Đầu năm học mới thì KHÔNG chạy lại
--        (students mới bắt đầu từ đầu, students cũ giữ nguyên progress).
-- ============================================================================

DO $$
DECLARE
  -- ⚙️ Cấu hình: Bài nào là bài hiện tại học sinh đang học?
  --    Thay đổi tuần này mỗi khi muốn unlock thêm bài mới cho cả lớp
  CURRENT_WEEK   constant int := 26;   -- Tuần 26 = Bài 15 Tập 2
  CURRENT_VOLUME constant int := 2;    -- 1 = Tập 1, 2 = Tập 2

  v_tv5_id   bigint;
  v_inserted int := 0;
BEGIN
  -- Lấy subject_id của TV5
  SELECT id INTO v_tv5_id FROM public.subjects WHERE code = 'TV5';
  IF v_tv5_id IS NULL THEN
    RAISE EXCEPTION 'TV5 subject not found!';
  END IF;

  -- Seed "completed" cho mọi student × mọi TV5 lesson node trong phạm vi đã học
  INSERT INTO public.student_node_progress (
    student_id,
    node_id,
    status,
    completed_at,
    last_accessed_at
  )
  SELECT
    p.id        AS student_id,
    n.id        AS node_id,
    'completed' AS status,
    now()       AS completed_at,
    now()       AS last_accessed_at
  FROM public.profiles p
  CROSS JOIN public.nodes n
  WHERE
    -- Chỉ lấy students (không phải teacher/admin)
    p.role = 'student'

    -- Chỉ lấy TV5 lesson nodes
    AND n.subject_id = v_tv5_id
    AND n.node_type  = 'lesson'

    -- Chỉ unlock đến tuần hiện tại (bao gồm cả Tập 1 và Tập 2 trước đó)
    AND (
      -- Toàn bộ Tập 1 (weeks 1-18) nếu đang ở Tập 2
      (CURRENT_VOLUME = 2 AND n.volume_number = 1)
      -- Hoặc cùng tập, tuần <= tuần hiện tại
      OR (n.volume_number = CURRENT_VOLUME AND n.week_number <= CURRENT_WEEK)
    )

  -- Không ghi đè progress thật (phòng trường hợp student đã dùng trước)
  ON CONFLICT (student_id, node_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RAISE NOTICE '✅ Seeded % progress records (students × nodes)', v_inserted;
  RAISE NOTICE '   Unlocked through: Tập %, Week %', CURRENT_VOLUME, CURRENT_WEEK;
END $$;
