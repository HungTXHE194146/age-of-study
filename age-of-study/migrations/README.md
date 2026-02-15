# Database Migrations Guide

Các file migration trong thư mục này phải được chạy theo thứ tự để đảm bảo schema đúng.

## 📋 Thứ tự chạy Migration

### 1. Migrations cơ bản (Đã có - chạy trước)
- `add_monthly_xp_field.sql` - Thêm monthly XP tracking
- `add_profile_settings_fields.sql` - Thêm settings cho profile
- `setup_admin_rls_policies.sql` - RLS policies cho admin
- `add_is_blocked_column.sql` - Thêm cột block user

### 2. Tier System (Leaderboard redesign)
```bash
# Option 1: Using Supabase CLI (recommended)
supabase db push migrations/add_tier_system.sql

# Option 2: Using psql with connection service
# First configure ~/.pg_service.conf with your database credentials
psql service=mydb -f migrations/add_tier_system.sql

# Option 3: Using psql with explicit connection (will prompt for password)
psql -h <host> -U <user> -d <database> -f migrations/add_tier_system.sql
```
**Chức năng:**
- Thêm tier system (Bronze/Silver/Gold/Diamond)
- Track tiến bộ cá nhân (previous_week_xp, previous_month_xp)
- Seed badges mới (effort-based, không chỉ result-based)
- Auto-calculate tier khi XP thay đổi

### 4. Class System (PHẢI chạy trước Test Improvements)
### 3. Class System (PHẢI chạy trước Test Improvements)
```bash
# Option 1: Using Supabase CLI (recommended)
supabase db push migrations/add_class_system.sql

# Option 2: Using psql with connection service
psql service=mydb -f migrations/add_class_system.sql

# Option 3: Using psql with explicit connection (will prompt for password)
psql -h <host> -U <user> -d <database> -f migrations/add_class_system.sql
```
**Chức năng:**
- Bảng `classes` - Quản lý lớp học
- Bảng `class_teachers` - Giáo viên ↔ Lớp (GVCN + GVBM)
- Bảng `class_students` - Học sinh ↔ Lớp
- Auto-generate class_code (8 ký tự)
- RLS policies đầy đủ
- Constraints: 1 học sinh chỉ thuộc 1 lớp active

### 4. Test System Improvements (Chạy SAU Class System)
```bash
# Option 1: Using Supabase CLI (recommended)
supabase db push migrations/add_test_improvements.sql

# Option 2: Using psql with connection service
psql service=mydb -f migrations/add_test_improvements.sql

# Option 3: Using psql with explicit connection (will prompt for password)
psql -h <host> -U <user> -d <database> -f migrations/add_test_improvements.sql
```
**Chức năng:**
- Thêm `subject_id` vào bảng `questions`
- Handle essay question type (correct_option_index = NULL)
- Auto-calculate `max_xp` cho tests
- Bảng `test_assignments` - Giao bài cho lớp
- Liên kết tests ↔ classes

### 5. Achievement Backpack System (Balo Thành Tích) 🎒
```bash
# Option 1: Using Supabase CLI (recommended)
supabase db push migrations/add_achievement_backpack.sql

# Option 2: Using psql with connection service
psql service=mydb -f migrations/add_achievement_backpack.sql

# Option 3: Using psql with explicit connection (will prompt for password)
psql -h <host> -U <user> -d <database> -f migrations/add_achievement_backpack.sql
```
**Chức năng:**
- **Badge Collection**: Track badges earned/unlocked (sử dụng bảng `badges` và `user_badges` có sẵn)
- **Avatar Wardrobe** (`avatar_shop`, `user_avatars`): Shop 20+ emoji avatars, mua bằng XP
- **Digital Certificates** (`certificates`): Giáo viên trao giấy khen cho học sinh
- **Secure Updates**: Database function `update_certificate_timestamps()` chỉ cho phép update timestamps
- **Smart Detection**: Avatar type detection dựa trên URL pattern, không phải length

**⚠️ Security Features:**
- Students chỉ update được `viewed_at`/`shared_at` của certificates (không thể sửa title/teacher_name)
- RLS policies đầy đủ cho tất cả tables
- SECURITY DEFINER function để enforce column-level restrictions

**📚 Xem thêm**: [SECURITY_FIXES.md](./SECURITY_FIXES.md) để hiểu chi tiết về security design

---

## 🚀 Chạy Tất Cả Cùng Lúc (Supabase Dashboard)

Nếu dùng Supabase Dashboard → SQL Editor:

```sql
-- Copy toàn bộ nội dung từng file theo thứ tự và paste vào SQL Editor
-- 1. add_tier_system.sql
-- 2. add_class_system.sql
-- 3. add_test_improvements.sql
-- 4. add_achievement_backpack.sql
```

---

## ⚠️ Lưu Ý Quan Trọng

### Dependencies
- `add_test_improvements.sql` phụ thuộc vào `classes` table từ `add_class_system.sql`
- Phải chạy `add_class_system.sql` TRƯỚC `add_test_improvements.sql`
- `add_achievement_backpack.sql` phụ thuộc vào `profiles` và `badges` tables (đã có sẵn)
- `add_achievement_backpack.sql` độc lập, có thể chạy bất kỳ lúc nào sau khi có profiles table

### Rollback

⚠️ **CRITICAL: Pre-Rollout Safety** ⚠️

**BEFORE running any rollback:**
1. **Create a full backup** of your database:
   ```bash
   pg_dump -h <host> -U <user> -d <database> > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test rollback in a development/staging environment first**

3. **Wrap the entire rollback in a transaction** so partial failures can be reverted:
   ```sql
   BEGIN;
   -- All DROP statements here
   -- If any errors occur, run: ROLLBACK;
   -- If successful, run: COMMIT;
   ```

4. **Review CASCADE drops carefully** - these will delete dependent data:
   - `DROP TABLE test_assignments CASCADE` - deletes all test assignments
   - `DROP TABLE classes CASCADE` - deletes all classes and related data
   - `DROP TABLE class_students CASCADE` - deletes all student-class relationships
   - `DROP TABLE class_teachers CASCADE` - deletes all teacher assignments
   - Consider using non-CASCADE drops where possible to prevent accidental data loss

Nếu cần rollback, chạy theo thứ tự NGƯỢC:

```sql
-- 1. Drop test improvements
DROP TABLE IF EXISTS test_assignments CASCADE;
ALTER TABLE tests DROP COLUMN IF EXISTS class_id;
ALTER TABLE tests DROP COLUMN IF EXISTS max_xp;
ALTER TABLE questions DROP COLUMN IF EXISTS subject_id;
DROP TRIGGER IF EXISTS trigger_sync_test_max_xp ON test_questions;
DROP FUNCTION IF EXISTS auto_update_test_max_xp();
DROP FUNCTION IF EXISTS normalize_question_data();
DROP FUNCTION IF EXISTS auto_fill_question_subject();

-- 2. Drop class system
DROP TABLE IF EXISTS class_students CASCADE;
DROP TABLE IF EXISTS class_teachers CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP FUNCTION IF EXISTS update_updated_at();
DROP FUNCTION IF EXISTS auto_generate_class_code();
DROP FUNCTION IF EXISTS generate_class_code();

-- 3. Drop tier system
DROP TRIGGER IF EXISTS trigger_update_tier ON profiles;
DROP FUNCTION IF EXISTS update_student_tier();
ALTER TABLE profiles DROP COLUMN IF EXISTS last_tier_update;
ALTER TABLE profiles DROP COLUMN IF EXISTS previous_month_xp;
ALTER TABLE profiles DROP COLUMN IF EXISTS previous_week_xp;
ALTER TABLE profiles DROP COLUMN IF EXISTS tier;
DROP TYPE IF EXISTS tier_level;
```

---

## 🧪 Verification Queries

Sau khi chạy migration, verify data:

### Check Tier System
```sql
-- Check tier distribution
SELECT tier, COUNT(*) FROM profiles WHERE role = 'student' GROUP BY tier;

-- Check badges
SELECT COUNT(*) FROM badges;
```

### Check Class System
```sql
-- Check classes created
SELECT * FROM classes;

-- Check class codes are unique
SELECT class_code, COUNT(*) FROM classes GROUP BY class_code HAVING COUNT(*) > 1;

-- Check 1 student only in 1 active class
SELECT student_id, COUNT(*) 
FROM class_students 
WHERE status = 'active' 
GROUP BY student_id 
HAVING COUNT(*) > 1;
```

### Check Test Improvements
```sql
-- Check subject_id populated
SELECT COUNT(*) as total, COUNT(subject_id) as with_subject FROM questions;

-- Check max_xp calculation
SELECT id, title, max_xp, 
  (SELECT SUM(points) FROM test_questions WHERE test_id = tests.id) as calculated 
FROM tests LIMIT 5;

-- Check essay questions
SELECT COUNT(*) FROM questions 
WHERE q_type = 'essay' AND correct_option_index IS NOT NULL;
-- Should be 0
```

---

## 📊 Database Schema Overview

### Tier System
- `profiles.tier` - Student tier (bronze/silver/gold/diamond)
- `profiles.previous_week_xp` - For improvement calculation
- `badges` - 11 badges total (effort + result based)

### Class System
- `classes` - Lớp học (grade 1-5)
- `class_teachers` - GVCN (is_homeroom=true) và GVBM
- `class_students` - 1 student → 1 active class

### Test System
- `questions.subject_id` - Auto-sync từ node_id
- `tests.max_xp` - Auto-calculate từ test_questions
- `test_assignments` - Giao bài cho lớp (many-to-many)

---

## 🐛 Common Issues

### Issue: "column already exists"
**Solution:** Migration đã chạy rồi. Skip hoặc dùng `IF NOT EXISTS`

### Issue: Foreign key constraint violation
**Solution:** Check thứ tự migration. `add_class_system.sql` phải chạy trước `add_test_improvements.sql`

### Issue: RLS blocking queries
**Solution:** Check `auth.uid()` và role của user. System admin có full access.

---

## 📝 Next Steps Sau Migration

1. **Seed test data** (optional):
```sql
-- Tạo lớp mẫu
INSERT INTO classes (name, grade, school_year, status) VALUES
  ('Lớp 4A', 4, '2025-2026', 'active');

-- Thêm GVCN
INSERT INTO class_teachers (class_id, teacher_id, subject_id, is_homeroom)
SELECT 1, id, 1, true FROM profiles WHERE role = 'teacher' LIMIT 1;
```

2. **Update Frontend Types** - Đồng bộ TypeScript types với schema mới

3. **Test Dashboard** - Verify teacher/admin dashboards hiển thị data đúng

4. **Seed test data** (optional - use deterministic queries):
```sql
-- Tạo lớp mẫu
INSERT INTO classes (name, grade, school_year, status) VALUES
  ('Lớp 4A', 4, '2025-2026', 'active')
RETURNING id; -- Note the returned id for next step

-- Thêm GVCN using deterministic selection
WITH sample_data AS (
  SELECT 
    (SELECT id FROM classes WHERE name = 'Lớp 4A' AND school_year = '2025-2026' LIMIT 1) as class_id,
    (SELECT id FROM profiles WHERE role = 'teacher' ORDER BY created_at LIMIT 1) as teacher_id,
    (SELECT id FROM subjects ORDER BY id LIMIT 1) as subject_id
)
INSERT INTO class_teachers (class_id, teacher_id, subject_id, is_homeroom)
SELECT class_id, teacher_id, subject_id, true FROM sample_data
WHERE class_id IS NOT NULL AND teacher_id IS NOT NULL AND subject_id IS NOT NULL;
```

---

## 🔧 Patches & Hot Fixes

### Patch: Fix Student Join Class RLS (2026-02-14)
```bash
psql $DATABASE_URL -f migrations/patch_class_student_rls.sql
```
**Problem:** Students got 406 error when trying to join classes via join code.

**Root Cause:** Missing RLS policy for students to INSERT into `class_students` table.

**Solution:** Added `"Students can join classes"` policy allowing students to insert their own memberships.

**Verification:**
```sql
-- Check policy exists
SELECT policyname FROM pg_policies 
WHERE tablename = 'class_students' AND policyname = 'Students can join classes';
```
