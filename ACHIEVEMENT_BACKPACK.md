# Achievement Backpack System - Balo Thành Tích

## 📖 Tổng Quan

**Balo Thành Tích** là tính năng "star" kết nối học tập Online-Offline, biến game hóa thành động lực học tập thực sự!

### 🎯 3 Tính Năng Chính

#### A. Bộ Sưu Tập Huy Hiệu (Badge Collection)
- **Thiết kế**: Giống như cuốn sổ sưu tập tem hoặc thẻ bài Pokemon
- **Hiển thị TẤT CẢ badges** từ database
- **Earned badges**: Sáng rực rỡ, full màu, 3D effect
- **Locked badges**: Đen trắng (grayscale), mờ, có icon ổ khóa
- **Progress tracking**: Hiển thị tiến độ (VD: 5/7 ngày streak)
- **Modal chi tiết**: Click vào badge để xem requirements và progress

#### B. Tủ Đồ Avatar (Avatar Wardrobe)
- **Avatar shop**: Danh sách avatars có thể mua bằng XP
- **Categories**: Default, Animals, Fantasy, Premium
- **Pricing**: 0 XP (default) đến 300 XP (premium)
- **Purchase flow**: Confirmation modal trước khi mua
- **Instant switch**: Click để đổi avatar đang dùng
- **Visual feedback**: Confetti khi mua thành công

#### C. Bảng Khen Thưởng Số (Digital Certificates) ⭐ VŨ KHÍ ĂN ĐIỂM
- **Teacher issues**: Giáo viên tặng từ dashboard
- **Beautiful designs**: 3 templates (classic, modern, playful)
- **Categories**: Academic, Behavior, Participation, Special
- **"Khoe Bố Mẹ" button**: Download certificate as image
- **Share-ready**: PNG format, perfect for Zalo/Facebook
- **Offline connection**: Cầu nối giữa lớp học và gia đình

---

## 🗂️ File Structure

```
age-of-study/
├── migrations/
│   └── add_achievement_backpack.sql          # Database schema
├── src/
│   ├── types/
│   │   └── achievement.ts                    # TypeScript types
│   ├── lib/
│   │   └── achievementService.ts             # Business logic layer
│   └── components/
│       └── student/
│           ├── BadgeCollection.tsx           # Badge UI
│           ├── AvatarWardrobe.tsx            # Avatar UI
│           └── DigitalCertificates.tsx       # Certificate UI
└── app/
    └── (dashboard)/
        └── backpack/
            └── page.tsx                      # Main backpack page
```

---

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
cd age-of-study

# Using Supabase CLI (recommended)
supabase db push migrations/add_achievement_backpack.sql

# Or using psql
psql -h db.xxx.supabase.co -U postgres -d postgres -f migrations/add_achievement_backpack.sql
```

### 2. Install Required Dependencies

```bash
npm install html2canvas @types/html2canvas @types/canvas-confetti
```

**Dependencies:**
- `html2canvas`: Convert certificate DOM to downloadable image
- `canvas-confetti`: Celebration effects
- `framer-motion`: Animations (already installed)

### 3. Verify Tables Created

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_avatars', 'avatar_shop', 'certificates');

-- Check sample avatars
SELECT count(*) FROM avatar_shop;  -- Should be 20+

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('user_avatars', 'certificates', 'avatar_shop');
```

---

## 💻 Usage Guide

### For Students

#### Access the Backpack
1. Click "🎒 Balo" in navigation (GameHeader)
2. Navigate to `/backpack`
3. See 3 tabs: Badges | Avatars | Certificates

#### Collect Badges
- **View all badges**: See locked and earned
- **Check progress**: Some badges show "5/7 days"
- **Click for details**: Modal shows requirements
- **Automatic unlock**: System awards when conditions met

#### Buy Avatars
1. Go to Avatar tab
2. Filter by category (Animals, Fantasy, etc.)
3. Click locked avatar → Purchase modal
4. Confirm → XP deducted → Avatar unlocked
5. Click owned avatar → Instantly switched

#### View Certificates
1. Go to Certificates tab
2. Click certificate → View full design
3. Click "🎉 Khoe Bố Mẹ" → Downloads PNG
4. Share with parents on Zalo/Facebook

---

### For Teachers

#### Issue Certificates

```typescript
// From teacher dashboard (to be implemented)
import { issueCertificate } from '@/lib/achievementService';

const awardCertificate = async () => {
  const result = await issueCertificate(
    teacherId,
    teacherName,
    {
      student_id: studentId,
      title: "Bé ngoan của lớp",
      description: "Đã làm tốt bài Toán hôm nay",
      category: "behavior",
      design_template: "playful"
    }
  );

  if (result.error) {
    alert("Có lỗi xảy ra!");
  } else {
    alert("Đã tặng bằng khen cho em!");
  }
};
```

**Certificate Categories:**
- `academic`: Học tập (blue icon)
- `behavior`: Hành vi (purple icon)
- `participation`: Tham gia (green icon)
- `special`: Đặc biệt (yellow icon)

**Design Templates:**
- `classic`: Khung vàng, phong cách truyền thống
- `modern`: Gradient xanh-tím, hiện đại
- `playful`: Màu sắc vui nhộn, viền đứt nét

---

## 🔧 Technical Details

### Database Schema

#### user_avatars
```sql
CREATE TABLE user_avatars (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id),
  avatar_code text NOT NULL,           -- Emoji or DiceBear code
  avatar_type text NOT NULL,           -- 'emoji' | 'dicebear'
  is_unlocked boolean DEFAULT false,
  unlocked_at timestamp,
  xp_cost integer DEFAULT 0,
  source text,                         -- 'purchase' | 'level_reward' | 'event' | 'default'
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, avatar_code)
);
```

#### avatar_shop
```sql
CREATE TABLE avatar_shop (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  avatar_code text NOT NULL UNIQUE,
  avatar_type text NOT NULL,
  display_name text NOT NULL,
  description text,
  xp_cost integer NOT NULL DEFAULT 0,
  required_level integer DEFAULT 1,
  is_active boolean DEFAULT true,
  is_premium boolean DEFAULT false,
  category text,                       -- 'default' | 'animals' | 'fantasy' | 'premium'
  sort_order integer DEFAULT 0,
  created_at timestamp DEFAULT now()
);
```

#### certificates
```sql
CREATE TABLE certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES profiles(id),
  teacher_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  category text,                       -- 'academic' | 'behavior' | 'participation' | 'special'
  design_template text DEFAULT 'classic',
  issued_at timestamp DEFAULT now(),
  viewed_at timestamp,                 -- When student first viewed
  shared_at timestamp,                 -- When student shared
  teacher_name text NOT NULL,          -- Cached for safety
  created_at timestamp DEFAULT now()
);
```

---

### Service Layer API

#### Badge Functions
```typescript
// Get all badges with user's status
getBadgeCollection(userId: string): Promise<BadgeWithStatus[]>

// Get progress for specific badge
getBadgeProgress(userId: string, badgeId: string): Promise<BadgeProgress>
```

#### Avatar Functions
```typescript
// Get avatar shop with ownership status
getAvatarWardrobe(userId: string): Promise<AvatarWithStatus[]>

// Purchase avatar
unlockAvatar(userId: string, input: UnlockAvatarInput): Promise<UserAvatar>

// Change active avatar
changeActiveAvatar(userId: string, avatarCode: string): Promise<boolean>
```

#### Certificate Functions
```typescript
// Get student's certificates
getStudentCertificates(studentId: string): Promise<CertificateWithTeacher[]>

// Issue certificate (teacher)
issueCertificate(
  teacherId: string,
  teacherName: string,
  input: IssueCertificateInput
): Promise<Certificate>

// Update view/share status
updateCertificateStatus(input: UpdateCertificateStatusInput): Promise<boolean>
```

---

## 🎨 UI/UX Highlights

### Design Principles
✅ **Clean Code**: Single responsibility, proper error handling
✅ **Accessible**: ARIA labels, keyboard navigation
✅ **Responsive**: Mobile-first, works on all screen sizes
✅ **Performant**: Optimistic updates, lazy loading
✅ **Delightful**: Animations, confetti, satisfying interactions

### Animation Details
- **Badge hover**: Scale 1.05, smooth transition
- **Badge unlock**: Confetti + color animation
- **Avatar purchase**: Confirmation modal + success confetti
- **Certificate view**: Smooth modal transition
- **Tab switching**: Slide animation, spring physics

### Loading States
- Spinner + descriptive text
- Skeleton screens for cards
- Disabled states during actions
- Error messages with retry buttons

### Mobile Optimization
- Touch-friendly tap targets (min 44x44px)
- Bottom sheet modals on mobile
- Simplified layouts for small screens
- Proper safe area handling

---

## 🧪 Testing Checklist

### Badge Collection
- [ ] All badges load correctly
- [ ] Earned badges show in color
- [ ] Locked badges are grayscale
- [ ] Progress bars display correctly
- [ ] Modal shows requirements
- [ ] Badge details are accurate

### Avatar Wardrobe
- [ ] Shop loads all avatars
- [ ] Categories filter correctly
- [ ] XP balance displayed
- [ ] Purchase confirmation works
- [ ] XP deducted on purchase
- [ ] Avatar switches immediately
- [ ] Can't buy without enough XP
- [ ] Owned avatars highlighted

### Digital Certificates
- [ ] Teacher can issue certificate
- [ ] Student sees notification
- [ ] Certificate displays beautifully
- [ ] All templates render correctly
- [ ] Download creates PNG file
- [ ] Image quality is good
- [ ] Teacher name shows correctly
- [ ] Viewed/shared timestamps update

---

## 🚨 Common Issues & Solutions

### Issue: html2canvas not found
```bash
# Solution: Install the package
npm install html2canvas @types/html2canvas
```

### Issue: Certificate image is blurry
```typescript
// Solution: Increase scale in html2canvas options
const canvas = await html2canvas(element, {
  scale: 2,  // Increase to 3 or 4 for higher quality
  backgroundColor: '#ffffff',
});
```

### Issue: Badges not auto-unlocking
```sql
-- Solution: Check badge conditions in database
SELECT * FROM badges WHERE condition_type = 'streak';

-- Verify user's current values
SELECT current_streak, total_xp FROM profiles WHERE id = 'xxx';
```

### Issue: RLS blocking student access
```sql
-- Solution: Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_avatars';

-- Test policy as student
SET ROLE authenticated;
SET session.user_id = 'student-uuid';
SELECT * FROM user_avatars WHERE user_id = current_setting('session.user_id')::uuid;
```

---

## 📈 Future Enhancements

### Phase 2 Features
- [ ] Badge auto-award system (cron job checking conditions)
- [ ] Achievement notifications (push/email)
- [ ] Social sharing (Facebook, Zalo direct integration)
- [ ] Achievement leaderboard (who has most badges)
- [ ] Seasonal/limited edition avatars
- [ ] Certificate templates editor (for teachers)
- [ ] Print-friendly certificate layouts
- [ ] Bulk certificate issuance (for whole class)

### Phase 3 Features
- [ ] Badge trading system (peer-to-peer)
- [ ] Avatar animation support (GIFs, Lottie)
- [ ] Certificate categories filter
- [ ] Achievement statistics dashboard
- [ ] Parent notification when certificate issued
- [ ] Certificate verification QR code
- [ ] Achievement milestones (25%, 50%, 75%, 100%)

---

## 🎓 Learning Outcomes

### For Students
✅ **Motivation**: Visible progress and rewards
✅ **Goal-setting**: Clear targets to achieve
✅ **Pride**: Share accomplishments with family
✅ **Collection mindset**: Completionist behavior

### For Teachers
✅ **Recognition tool**: Easy to reward students
✅ **Online-offline bridge**: Connect classroom with home
✅ **Differentiation**: Multiple ways to acknowledge effort
✅ **Communication**: Share student progress with parents

### For Parents
✅ **Visibility**: See child's achievements
✅ **Engagement**: Celebrate together
✅ **Trust**: Verified teacher recognition
✅ **Motivation**: Encourage continued effort

---

## 📞 Support

### Documentation
- Main README: `/README.md`
- Migration guide: `/migrations/README.md`
- SRS: `/SRS.md`
- This file: `/docs/ACHIEVEMENT_BACKPACK.md`

### Code References
- Types: `/src/types/achievement.ts`
- Service: `/src/lib/achievementService.ts`
- Components: `/src/components/student/`
- Page: `/app/(dashboard)/backpack/page.tsx`

---

**Built with ❤️ following clean code principles by a senior developer mindset**
**Following the instruction: "Tuân thủ clean code như 1 senior, không lười code để rồi gây ra bug tiềm năng"**
