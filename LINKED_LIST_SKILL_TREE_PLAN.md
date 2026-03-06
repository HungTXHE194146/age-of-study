# Plan: Linked-List Skill Tree + Volume Support cho Tiếng Việt 5

> **Ngày tạo**: 06/03/2026  
> **Branch**: `hungtx/student-shop`  
> **Trạng thái**: 📋 Chưa bắt đầu

---

## 1. Tổng quan

Chuyển đổi cây kỹ năng (skill tree) môn Tiếng Việt 5 từ cấu trúc **tree phân cấp** hỗn loạn (300+ nodes) sang mô hình **linked-list** gọn gàng:

- **~70 lesson nodes** (2 bài/tuần × 35 tuần)
- Mỗi "Bài" gộp 3 loại nội dung: Tập đọc + Luyện từ và câu + Tập làm văn
- Trong mỗi tuần: **Bài 1 → Bài 2** nối qua `parent_node_id`
- Các tuần tách biệt, không nối cross-week
- Thêm cột `volume_number` phân chia **Tập 1** (tuần 1-18) vs **Tập 2** (tuần 19-35)
- Crawl **toàn bộ sách** (35 tuần) thay vì chỉ tập 1

---

## 2. Phân tích nguyên nhân (300+ nodes)

### 2.1 Dữ liệu trùng lặp từ 2 bộ sách

| Nguồn | Bộ sách | Số nodes | Cách tạo |
|--------|---------|----------|----------|
| Migration `add_curriculum_system.sql` | Sách **cũ** (Chủ điểm: Tổ quốc, "Thư gửi các học sinh"...) | ~120+ | SQL seed |
| Script `import-lesson-sections.ts` | **KNTT** (Kết nối tri thức: "Thanh âm của gió"...) | ~100+ | Crawl + import |

Hai bộ sách khác nhau hoàn toàn → title khác → không dedup được → cả hai cùng tồn tại = **300+**

### 2.2 Bug trong import script

| Bug | Chi tiết |
|-----|----------|
| Không set `node_type` | Tất cả nodes default `'lesson'` (tuần nên là `'week'`, section nên là `'content'`) |
| Dedup query sai | Script check `(subject_id, title, parent_node_id)` nhưng DB unique constraint là `(subject_id, title, node_type)` |
| Thiếu metadata | Không set `week_number`, `lesson_number`, `content_label`, `order_index` |

---

## 3. Quyết định kiến trúc

| Quyết định | Lựa chọn |
|------------|----------|
| Bộ sách | Chỉ giữ **KNTT** (Kết nối tri thức); xóa seed cũ |
| Cấu trúc node | **Linked list** trong mỗi tuần: Bài lẻ → Bài chẵn |
| Mỗi node là gì | 1 "Bài" = gộp Tập đọc + LTVC + TLV |
| Week/Chapter nodes | Giữ trong DB nhưng **ẩn** khỏi skill tree |
| Phân chia tập | Cột `volume_number` trên bảng `nodes` (1 hoặc 2) |
| Layout | Vertical chains (dọc) |
| Crawl | Cả 35 tuần (`curriculum-urls.ts` đã có sẵn) |
| Cross-week | **Không nối** — mỗi tuần là 1 chuỗi riêng |
| Toán 5 | Giữ nguyên tree structure hiện tại |

---

## 4. Tại sao linked list hoạt động với code hiện tại

Code trong `src/utils/skillTreeMapper.ts` đã hỗ trợ sẵn:

| Tính năng | Cách hoạt động | Status |
|-----------|----------------|--------|
| **Vẽ cạnh (edges)** | Tạo từ `parent_node_id` → Bài 2 trỏ vào Bài 1 → vẽ edge | ✅ Sẵn sàng |
| **Khóa node** | `isNodeLocked = !completedNodeIds.includes(parent_node_id)` → phải hoàn thành Bài 1 mới mở Bài 2 | ✅ Sẵn sàng |
| **React Flow render** | Chỉ cần feed lesson-only nodes với `parent_node_id` kiểu linked-list | ✅ Không cần sửa |

### Minh họa cấu trúc node mới

```
┌─────────────────────────────────────────────────────────────────────────┐
│ DATABASE (ẩn khỏi skill tree)                                          │
│                                                                         │
│  Chapter "Thế giới tuổi thơ" (node_type='chapter', volume_number=1)    │
│    ├── Week 1 (node_type='week', week_number=1)                        │
│    ├── Week 2 (node_type='week', week_number=2)                        │
│    └── ...                                                              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ SKILL TREE (hiển thị, node_type='lesson')                              │
│                                                                         │
│  Tập 1 (volume_number=1):                                              │
│                                                                         │
│    Week 1:                         Week 2:                              │
│    ┌──────────────────────┐        ┌──────────────────────┐             │
│    │ Bài 1: Thanh âm      │        │ Bài 3: Tuổi ngựa    │             │
│    │ của gió               │        │                      │             │
│    │ (parent=NULL)         │        │ (parent=NULL)        │             │
│    └──────────┬───────────┘        └──────────┬───────────┘             │
│               │                                │                        │
│               ▼                                ▼                        │
│    ┌──────────────────────┐        ┌──────────────────────┐             │
│    │ Bài 2: Cánh đồng hoa│        │ Bài 4: Bến sông     │             │
│    │                      │        │ tuổi thơ             │             │
│    │ (parent=Bài 1)       │        │ (parent=Bài 3)      │             │
│    └──────────────────────┘        └──────────────────────┘             │
│                                                                         │
│  Tập 2 (volume_number=2):                                              │
│                                                                         │
│    Week 19:                        Week 20:                             │
│    ┌──────────────────────┐        ┌──────────────────────┐             │
│    │ Bài 37: ...          │        │ Bài 39: ...         │             │
│    │ (parent=NULL)         │        │ (parent=NULL)        │             │
│    └──────────┬───────────┘        └──────────┬───────────┘             │
│               │                                │                        │
│               ▼                                ▼                        │
│    ┌──────────────────────┐        ┌──────────────────────┐             │
│    │ Bài 38: ...          │        │ Bài 40: ...         │             │
│    │ (parent=Bài 37)      │        │ (parent=Bài 39)     │             │
│    └──────────────────────┘        └──────────────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
```

Mỗi lesson node chứa nhiều `lesson_sections` rows (reading, grammar, writing).

---

## 5. Kế hoạch thực hiện

### Phase 1: Database Migration

> File mới: `migrations/add_volume_number.sql`

#### Step 1: Thêm cột `volume_number`

```sql
ALTER TABLE public.nodes 
  ADD COLUMN IF NOT EXISTS volume_number smallint;

ALTER TABLE public.nodes 
  ADD CONSTRAINT nodes_volume_number_check 
  CHECK (volume_number IN (1, 2));

CREATE INDEX idx_nodes_volume 
  ON public.nodes(subject_id, volume_number);
```

#### Step 2: Cập nhật unique constraint

```sql
DROP INDEX IF EXISTS idx_nodes_subject_title_type_unique;

CREATE UNIQUE INDEX idx_nodes_subject_title_type_volume 
  ON public.nodes(subject_id, title, node_type, volume_number) 
  WHERE subject_id IS NOT NULL;
```

#### Step 3: Cập nhật `get_skill_tree` RPC

- Thêm parameter `p_volume_number smallint DEFAULT NULL`
- Thêm `volume_number` và `week_number` vào RETURN TABLE
- Filter: `WHERE n.node_type = 'lesson'` (chỉ lesson nodes hiển thị)
- Filter: `AND (p_volume_number IS NULL OR n.volume_number = p_volume_number)`

#### Step 4: Cleanup dữ liệu TV5 cũ

- Xóa **toàn bộ** TV5 nodes (cả old seed lẫn KNTT import sai — tất cả đều hỏng)
- Cascade xóa: `lesson_sections`, `student_node_progress`, `questions`, `tests` liên quan
- Giữ nguyên Toán 5

---

### Phase 2: Rewrite Import Script (song song Phase 3)

> File: `scripts/import-lesson-sections.ts` — **viết lại hoàn toàn**

#### Step 5: Logic import mới

1. Parse crawled JSON (support `--volume 1|2` hoặc auto-detect từ filename)
2. Group crawled sections theo bài number trong mỗi tuần
3. Cho mỗi tuần, tạo 2 lesson nodes dạng linked list:

| Node | `parent_node_id` | `node_type` | `week_number` | `order_index` | `volume_number` |
|------|-------------------|-------------|---------------|---------------|-----------------|
| Bài lẻ | `NULL` | `'lesson'` | N | 1 | 1 or 2 |
| Bài chẵn | ID của Bài lẻ | `'lesson'` | N | 2 | 1 or 2 |

4. Set `position_x/y` cho vertical layout:
   - Trong 1 tuần: space nodes dọc ~200px
   - Giữa các tuần: offset ngang ~300px
5. Insert content sections vào `lesson_sections` (3 sections/bài)
6. Tạo hidden week/chapter nodes cho metadata grouping

#### Step 6: Dedup + Idempotency

- `findOrCreateNode` dedup query: `(subject_id, title, node_type, volume_number)` — khớp unique constraint
- Flag `--clean`: xóa toàn bộ nodes của (subject, volume) trước khi re-import
- Chạy 2 lần → count không tăng

#### Step 7: Crawl toàn bộ sách

- `curriculum-urls.ts` đã có sẵn **35 tuần** URLs
- Cập nhật `crawl-loigiaihay.ts`: bỏ filter `tap-1`, crawl tất cả tuần
- Output: `tiengviet5-full.json` hoặc `tap1.json` + `tap2.json`
- Import script tự xác định `volume_number` theo `week_number`:
  - Tuần 1-18 → `volume_number = 1`
  - Tuần 19-35 → `volume_number = 2`

---

### Phase 3: Backend Services & API (song song Phase 2)

#### Step 8: Cập nhật TypeScript types

| File | Thay đổi |
|------|----------|
| `src/lib/gradeSkillTreeService.ts` | Thêm `volume_number?: number`, `week_number?: number` vào `Node` interface |
| `src/lib/curriculumService.ts` | Thêm `volume_number?: number` vào `CurriculumNode` |
| `src/lib/skillTreeService.ts` | Thêm `volume_number?: number` vào `Node` type |

#### Step 9: Cập nhật service queries

| Service | Function | Thay đổi |
|---------|----------|----------|
| `gradeSkillTreeService.ts` | `fetchSubjectSkillTree(subjectId, volumeNumber?)` | Filter `.eq('node_type', 'lesson')` + `.eq('volume_number', N)` |
| `curriculumService.ts` | `getCurriculumTree(subjectId, volumeNumber?)` | Same filters |
| `skillTreeService.ts` | `fetchSubjectSkillTree(subjectId, volumeNumber?)` | Pass volume to RPC |

#### Step 10: Cập nhật API routes

| Route | Thay đổi |
|-------|----------|
| `app/api/grade-skill-tree/route.ts` | Accept query param `?volume=1` |
| `app/api/generate-questions/route.ts` | Filter nodes theo volume |

---

### Phase 4: Frontend (sau Phase 3)

#### Step 11: Volume selector

- File: `app/student/skill-tree/page.tsx`
- Thêm tabs/toggle **"Tập 1" / "Tập 2"** cạnh subject selector
- Pass volume vào `fetchSubjectSkillTree(subjectId, volume)`
- Default Tập 1; chỉ hiện selector cho subjects có volume

#### Step 12: Color logic

- File: `src/utils/skillTreeMapper.ts`
- **Hiện tại**: màu cascade từ chapter → children. Lesson nodes không còn trỏ về chapter
- **Mới**: màu theo `week_number` group → `BRANCH_COLORS[week_number % 7]`
- Hiệu ứng: cùng tuần = cùng màu → phân nhóm trực quan dù không hiện chapter nodes

---

## 6. Danh sách files

### Files cần sửa

| File | Loại thay đổi |
|------|---------------|
| `migrations/add_volume_number.sql` | **MỚI** — migration + cleanup + RPC update |
| `scripts/import-lesson-sections.ts` | **VIẾT LẠI** — linked-list, grouped by bài, volume |
| `scripts/crawl-loigiaihay.ts` | Nhỏ — bỏ filter tap-1, crawl full book |
| `src/lib/gradeSkillTreeService.ts` | Thêm volume_number, filter node_type='lesson' |
| `src/lib/curriculumService.ts` | Thêm volume_number, same filters |
| `src/lib/skillTreeService.ts` | Pass volume to RPC, update Node type |
| `app/api/grade-skill-tree/route.ts` | Accept `?volume=N` |
| `app/student/skill-tree/page.tsx` | Volume selector UI |
| `src/utils/skillTreeMapper.ts` | Week-based color logic |

### Files tham khảo (không sửa)

| File | Lý do |
|------|-------|
| `migrations/add_curriculum_system.sql` | Schema + seed data hiện tại |
| `migrations/get_skill_tree.sql` | RPC hiện tại (sẽ replace trong migration mới) |
| `scripts/curriculum-urls.ts` | 35 tuần URLs (đã có sẵn, không cần sửa) |
| `src/components/VisualSkillTree.tsx` | Không cần sửa edge/mapper |

---

## 7. Kiểm thử

### 7.1 Database verification

```sql
-- Sau cleanup: 0 TV5 nodes
SELECT count(*) FROM nodes 
WHERE subject_id = (SELECT id FROM subjects WHERE code='TV5');
-- Expected: 0

-- Sau import tập 1:
SELECT count(*), node_type, volume_number FROM nodes 
WHERE subject_id = (SELECT id FROM subjects WHERE code='TV5') 
GROUP BY node_type, volume_number;
-- Expected: 36 lesson (vol=1) + week/chapter nodes

-- Sau import tập 2:
-- Expected: thêm 34 lesson (vol=2) + week/chapter nodes
```

### 7.2 Linked list verification

```sql
SELECT 
  n.title, 
  n.week_number,
  n.order_index,
  p.title as prev_node 
FROM nodes n 
LEFT JOIN nodes p ON n.parent_node_id = p.id 
WHERE n.node_type='lesson' AND n.volume_number=1 
ORDER BY n.week_number, n.order_index;
-- Expected: mỗi Bài chẵn trỏ về Bài lẻ cùng tuần, Bài lẻ có NULL parent
```

### 7.3 Idempotency

```bash
# Chạy import 2 lần → count KHÔNG tăng
npx tsx scripts/import-lesson-sections.ts --clean
npx tsx scripts/import-lesson-sections.ts
# → Cùng số lượng nodes
```

### 7.4 API test

```bash
# Chỉ trả lesson nodes tập 1
GET /api/grade-skill-tree?grade=5&volume=1
# Expected: 36 lesson nodes với linked edges
```

### 7.5 UI test

- Skill tree hiện vertical chains theo tuần
- Node locking hoạt động (hoàn thành Bài 1 → mở khóa Bài 2)
- Volume tabs chuyển đúng dữ liệu

### 7.6 Build + lint

```bash
npm run lint && npx tsc --noEmit
# Expected: pass
```

---

## 8. Lưu ý & Edge cases

### 8.1 Tuần ôn tập

Tuần 9, 18, 35 (ôn tập/kiểm tra) có thể **không phải** cấu trúc 2 bài tiêu chuẩn. Import script cần handle linh hoạt số bài/tuần.

### 8.2 Toán 5

Giữ nguyên tree structure hiện tại. Linked-list chỉ áp dụng cho TV5 trước. Schema hỗ trợ cả hai pattern vì:
- `volume_number = NULL` cho subjects không có tập → queries trả tất cả nodes
- `node_type` filter chỉ áp dụng khi cần

### 8.3 Teacher rearrangement

Giáo viên hiện có thể kéo thả node và nối lại edge trong VisualSkillTree. Tính năng này vẫn hoạt động vì thay đổi `parent_node_id` = thay đổi thứ tự linked list. Tuy nhiên, nên cân nhắc **restrict reconnect** cho curriculum nodes chính thức.

### 8.4 Student progress data cũ

`student_node_progress` cho TV5 nodes bị xóa sẽ mất. Cần:
- Cascade delete hoặc cleanup thủ công
- Thông báo nếu có student đang học TV5

### 8.5 Migration `add_curriculum_system.sql`

Các blocks seed TV5 cũ trong migration sẽ thành dead code sau cleanup. Nên thêm guard hoặc comment lại để tránh re-seed nếu chạy lại migration. Toán 5 seeds vẫn OK.

---

## 9. So sánh trước/sau

| Tiêu chí | Trước | Sau |
|-----------|-------|-----|
| Tổng nodes TV5 | 300+ (hỗn loạn) | ~70 lesson + ~50 hidden = ~120 |
| Bộ sách | 2 bộ trộn lẫn | Chỉ KNTT |
| Node types | Tất cả default 'lesson' | Đúng type: lesson/week/chapter |
| Volume support | Không có | `volume_number` (1 hoặc 2) |
| Cấu trúc visual | Tree phân cấp rối | Linked-list chains theo tuần |
| Node locking | Dựa trên tree parent | Dựa trên bài trước trong tuần |
| Dedup | Sai logic → trùng lặp | Khớp unique constraint → idempotent |
| Crawl scope | Chỉ tập 1 | Cả 2 tập (35 tuần) |
