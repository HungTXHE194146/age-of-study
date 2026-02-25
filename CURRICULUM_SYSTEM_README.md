# Curriculum-Aware AI Question Generation System

## Tổng quan (Overview)

Hệ thống tạo câu hỏi tự động bằng AI dựa trên cấu trúc chương trình học và tài liệu giảng dạy. Giáo viên có thể tải lên sách giáo khoa (PDF/DOCX), hệ thống sẽ tự động phân chia nội dung theo từng bài học và tạo câu hỏi kiểm tra chính xác cho từng phần.

**The AI-powered curriculum-aware question generation system allows teachers to upload textbooks, which are automatically chunked by lesson structure, and generate precise quiz questions mapped to specific curriculum nodes.**

---

## Kiến trúc hệ thống (System Architecture)

### 1. Curriculum Tree (Cây chương trình học)

#### Cấu trúc chuẩn (Standard Structure):

**Toán 5:** Subject → Chapter → Lesson
```
Toán 5
  ├─ Chương 1: Ôn tập và bổ sung
  │   ├─ Bài 1: Ôn tập khái niệm phân số
  │   ├─ Bài 2: Ôn tập tính chất cơ bản của phân số
  │   └─ ...
  ├─ Chương 2: Số thập phân
  │   ├─ Bài 9: Khái niệm số thập phân
  │   └─ ...
```

**Tiếng Việt 5:** Subject → Theme → Week → Lesson → Content
```
Tiếng Việt 5
  ├─ Chủ điểm 1: Tổ quốc
  │   ├─ Tuần 1
  │   │   ├─ Bài 1: Thư gửi các học sinh (Tập đọc)
  │   │   ├─ Bài 1: Từ đồng nghĩa (Luyện từ và câu)
  │   │   ├─ Bài 1: Cấu tạo bài văn tả cảnh (Tập làm văn)
  │   │   └─ ...
  │   ├─ Tuần 2
  │   └─ ...
```

#### Metadata mở rộng (Extended Metadata):
```typescript
node_type: 'subject' | 'chapter' | 'week' | 'lesson' | 'content'
week_number: số tuần (1-35)
lesson_number: số bài trong chương
page_start, page_end: trang trong sách giáo khoa
content_label: nhãn nội dung (Tập đọc, Chính tả, ...)
order_index: thứ tự hiển thị
```

---

### 2. Document Upload & Smart Chunking

#### Quy trình (Workflow):

1. **Teacher uploads PDF/DOCX:**
   - Client extracts text using `pdf.js` or `mammoth`
   - Send extracted text to `/api/documents/upload`

2. **AI Smart Chunking:**
   - Gemini analyzes document structure
   - Identifies lesson boundaries (e.g., "Bài 1:", "Bài 2:")
   - Maps each chunk to a curriculum node
   - Returns confidence score (0-1)

3. **Admin Review & Confirm:**
   - UI shows AI-suggested mappings
   - Admin can adjust node assignments
   - POST `/api/documents/confirm` with corrections
   - Chunks marked as "confirmed" enter RAG knowledge base

#### API Routes:

**POST `/api/documents/upload`**
```json
{
  "title": "SGK Toán 5 - Tập 1",
  "subjectId": 1,
  "content": "Bài 1: Ôn tập khái niệm phân số\n\nĐịnh nghĩa: ...",
  "fileUrl": "https://..."
}
```
Response:
```json
{
  "documentId": "uuid",
  "totalChunks": 32,
  "chunks": [
    {
      "chunk_index": 0,
      "content": "Bài 1: Ôn tập khái niệm phân số...",
      "suggested_node_id": 123,
      "suggested_node_title": "Bài 1: Ôn tập khái niệm phân số",
      "confidence": 0.95
    }
  ]
}
```

**POST `/api/documents/confirm`**
```json
{
  "documentId": "uuid",
  "chunks": [
    { "chunk_id": "uuid", "node_id": 123, "status": "confirmed" },
    { "chunk_id": "uuid", "node_id": null, "status": "rejected" }
  ]
}
```

**GET `/api/documents/confirm?documentId=uuid`**
Returns all chunks for admin review UI.

**GET `/api/documents/confirm?subjectId=1`**
Returns all documents for a subject with chunk counts.

---

### 3. AI Question Generation

#### Key Features:

- **Context-Aware:** Retrieves only relevant document chunks for the selected lesson
- **Duplicate Prevention:** Checks existing questions in DB before generating
- **Variety:** Supports multiple question types (multiple choice, true/false, essay)
- **Difficulty Control:** Can generate easy/medium/hard or mixed difficulty
- **Custom Prompts:** Teachers can add free-form instructions

#### API Route:

**POST `/api/questions/generate`**
```json
{
  "subjectId": 1,
  "nodeId": 123,
  "difficulty": "mixed",
  "questionCount": 10,
  "questionType": "multiple_choice",
  "customPrompt": "Tập trung vào phần ứng dụng thực tế"
}
```

Response:
```json
{
  "success": true,
  "questions": [
    {
      "id": "uuid",
      "question": "Phân số 3/5 có nghĩa là gì?",
      "options": ["Chia 3 cho 5", "Chia 5 cho 3", "3 cộng 5", "5 trừ 3"],
      "correct_option_index": 0,
      "explanation": "Phân số 3/5 nghĩa là chia 3 thành 5 phần bằng nhau",
      "difficulty": "easy",
      "q_type": "multiple_choice"
    }
  ],
  "totalGenerated": 10
}
```

#### How it works:

1. **Context Retrieval:**
   - If `nodeId` is a chapter → get all descendant lesson chunks
   - If `nodeId` is a lesson → get only that lesson's chunks
   - Limit: ~20 chunks, ~3000 chars each → ~60K chars total (~15K tokens)

2. **Existing Questions Check:**
   - Fetch last 50 questions for this subject/node
   - Pass to Gemini as "avoid duplicates" list

3. **Gemini Prompt:**
   ```
   Môn học: Toán 5
   Phạm vi: Bài 1: Ôn tập khái niệm phân số
   Độ khó: Mixed (30% dễ, 50% trung bình, 20% khó)
   Số câu: 10
   Loại câu: Trắc nghiệm 4 đáp án
   
   NỘI DUNG BÀI HỌC:
   [Document chunks here...]
   
   CÂU HỎI ĐÃ CÓ (TRÁNH TRÙNG):
   1. Phân số là gì?
   2. Tử số và mẫu số là gì?
   ...
   ```

4. **Save to DB:**
   - Status: `available` (ready to use immediately)
   - Created by teacher (for accountability)

---

### 4. Updated Teacher Test Creation UI

#### Changes to "AI Generator" Tab:

**Before (fake AI):**
```typescript
// Just queried existing questions from DB randomly
const randomQuestions = await questionBankService.getQuestions(filter)
```

**After (real AI):**
```typescript
// Calls Gemini to generate new questions
const response = await fetch('/api/questions/generate', {
  method: 'POST',
  body: JSON.stringify({
    subjectId, nodeId, difficulty, questionCount, customPrompt
  })
})
```

#### Teacher Experience:

1. Select subject (e.g., Toán 5)
2. Select lesson (e.g., Bài 1: Ôn tập khái niệm phân số)
3. Go to "AI Generator" tab
4. Enter topic/instructions (e.g., "Tập trung vào ví dụ thực tế trong đời sống")
5. Choose difficulty, question count
6. Click "Generate Questions with AI"
7. Questions appear in review list → add to test

---

### 5. Upgraded Chatbot Context Scoping

#### Before:
- Chatbot retrieved questions + documents by `subject_id` only
- ~30K tokens per request (entire subject's content)

#### After:
- Retrieves `document_chunks` with `node_id` filter
- If student is viewing "Bài 1", only Bài 1's chunks are loaded
- ~5K tokens per request (one lesson's content)
- **6x reduction in token cost**
- More precise answers

---

## Database Schema

### New Tables:

#### `document_chunks`
```sql
CREATE TABLE document_chunks (
  id uuid PRIMARY KEY,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  node_id bigint REFERENCES nodes(id),
  chunk_index integer,
  content text,
  metadata jsonb,
  status text CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at timestamp with time zone DEFAULT now()
);
```

### Extended Tables:

#### `nodes` (new columns)
```sql
ALTER TABLE nodes ADD COLUMN node_type text;
ALTER TABLE nodes ADD COLUMN week_number integer;
ALTER TABLE nodes ADD COLUMN lesson_number integer;
ALTER TABLE nodes ADD COLUMN page_start integer;
ALTER TABLE nodes ADD COLUMN page_end integer;
ALTER TABLE nodes ADD COLUMN content_label text;
ALTER TABLE nodes ADD COLUMN order_index integer;
```

#### `subjects` (fixed type mismatch)
```sql
ALTER TABLE subjects ADD COLUMN grade_level text;
ALTER TABLE subjects ADD COLUMN updated_at timestamp with time zone;
```

---

## Services & Libraries

### Client-Side Services:

#### `curriculumService.ts`
```typescript
// Fetch hierarchical curriculum tree
await curriculumService.getCurriculumTree(subjectId)

// Build parent-child tree structure
const tree = curriculumService.buildTree(flatNodes)

// Get breadcrumb path
const path = curriculumService.getBreadcrumb(flatNodes, nodeId)
// => ["Toán 5", "Chương 2", "Bài 12: So sánh số thập phân"]

// Get all descendant leaf nodes
const leafIds = curriculumService.getDescendantLeafIds(flatNodes, chapterId)
```

#### `documentService.ts`
```typescript
// Upload with AI chunking
const result = await documentService.uploadDocument(
  title, subjectId, content, fileUrl
)

// Review chunks
const chunks = await documentService.getDocumentChunks(documentId)

// Confirm mappings
await documentService.confirmChunks(documentId, [
  { chunk_id, node_id, status: 'confirmed' }
])

// List documents by subject
const docs = await documentService.getDocumentsBySubject(subjectId)
```

---

## Migration Steps

### ⚠️ Important: Run in 3 Parts

Due to Supabase SQL editor limitations with large files, the migration is split into 3 parts.

**See detailed instructions:** [migrations/MIGRATION_INSTRUCTIONS.md](age-of-study/migrations/MIGRATION_INSTRUCTIONS.md)

**Quick Summary:**
```bash
# In Supabase SQL Editor, run in order:
1. migrations/add_curriculum_system_part1_schema.sql    # Schema changes
2. migrations/add_curriculum_system_part2_toan5.sql     # Toán 5 data
3. migrations/add_curriculum_system_part3_tiengviet5.sql # Tiếng Việt 5 data
```

This will:
- Add new columns to `nodes` table
- Create `document_chunks` table
- Seed Toán 5 & Tiếng Việt 5 curriculum
- Add helper functions (`get_curriculum_tree`, `get_descendant_node_ids`)
- Fix `subjects.grade_level` type mismatch

### 2. Verify Seeded Data
```sql
-- Check Toán 5 curriculum
SELECT * FROM get_curriculum_tree(1);

-- Check Tiếng Việt 5 curriculum
SELECT * FROM get_curriculum_tree(2);

-- Verify subjects
SELECT * FROM subjects WHERE code IN ('TOAN5', 'TV5');
```

### 3. Set Environment Variables
Already set (from AI Chatbot phase):
```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Install Dependencies (if needed)
```bash
npm install
```

### 5. Test API Routes

**Test Question Generation:**
```bash
curl -X POST http://localhost:3000/api/questions/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "subjectId": 1,
    "nodeId": null,
    "difficulty": "mixed",
    "questionCount": 5,
    "questionType": "multiple_choice"
  }'
```

**Test Document Upload:**
(Use the UI since client needs to extract text from PDF first)

---

## Usage Guide

### For Admin/Principal:

1. **Upload Textbook:**
   - Go to Document Management page (TBD: admin UI)
   - Upload PDF of "SGK Toán 5 - Tập 1"
   - Wait for AI smart chunking (~30s for 200-page book)
   - Review suggested lesson mappings
   - Adjust any incorrect mappings
   - Click "Confirm"

2. **Monitor Documents:**
   - View all documents by subject
   - See chunk counts (pending/confirmed)
   - Delete outdated materials

### For Teachers:

1. **Create Test with AI:**
   - Go to Teacher → Tests → Create New
   - Select subject (e.g., Toán 5)
   - Select lesson (e.g., Bài 12: So sánh số thập phân)
   - Go to "AI Generator" tab
   - Enter instructions: "Tập trung vào so sánh phân số thập phân"
   - Choose difficulty: Mixed
   - Choose count: 10 questions
   - Click "Generate Questions with AI"
   - Review generated questions → add to test

2. **Check Question Quality:**
   - All AI questions have explanations
   - Questions reference document content
   - No duplicates
   - Appropriate difficulty for grade level

### For Students:

**Chatbot is now more precise:**
- Student: "Làm sao để so sánh 0.5 và 0.75?"
- Cú Mèo: [retrieves only "Bài 12: So sánh số thập phân" content]
  "Để so sánh hai số thập phân, ta so sánh từng hàng từ trái sang phải... 
   Vậy 0.5 < 0.75 vì hàng phần mười: 5 < 7. Bạn hiểu chưa? 🦉"

---

## Cost and Performance

### Gemini API Usage:

**Question Generation (per request):**
- Context: ~60K chars (~15K tokens input)
- Output: ~8K tokens (10 questions with explanations)
- Total: ~23K tokens per generation
- Cost (free tier): ~0 VND / ~$0 (within 1500 RPD limit)
- Time: 10-20 seconds

**Document Chunking (per upload):**
- Input: ~200K chars (~50K tokens)
- Output: ~32 chunks metadata (~2K tokens)
- Total: ~52K tokens per document
- Cost: ~0 VND / ~$0
- Time: ~30 seconds

**Chatbot (before upgrade):**
- ~30K tokens per request

**Chatbot (after upgrade):**
- ~5K tokens per request
- **6x reduction** → can serve 6x more students with same API quota

### Free Tier Limits:
- 1500 requests per day (RPD)
- 250K tokens per minute (TPM)
- For 30 students:
  - ~600 chatbot messages/day (20 per student)
  - ~30 question generation sessions/day (1 per teacher)
  - **Still within free tier** ✅

---

## Roadmap

### Phase 1: ✅ COMPLETED
- [x] DB migration + curriculum seed
- [x] Curriculum service
- [x] Document upload API with AI chunking
- [x] Document confirm API
- [x] AI question generation API
- [x] Document management service
- [x] Update teacher test creation UI
- [x] Chatbot context upgrade (automatic via chunks)

### Phase 2: TO DO
- [ ] **Admin Document Management UI:**
  - Page: `/admin/documents`
  - Upload PDF/DOCX
  - Review AI-chunked mappings
  - Adjust node assignments
  - Delete old documents

- [ ] **Curriculum Tree Selector Component:**
  - Hierarchical dropdown for node selection
  - Used in test creation, question bank filters
  - Breadcrumb display

- [ ] **Question Bank Filters:**
  - Filter by curriculum node (not just subject)
  - Show node path in question list

### Phase 3: FUTURE
- [ ] **Bulk Question Import:**
  - Upload Excel with questions → auto-map to nodes

- [ ] **Question Quality Metrics:**
  - Track which AI questions students find difficult
  - Auto-flag questions with <50% correct rate

- [ ] **Multi-Grade Support:**
  - Seed Toán 3,  4, Tiếng Việt 3, 4
  - Support other subjects (Tiếng Anh, Khoa học, ...)

---

## Troubleshooting

### Error: "Chưa có cấu trúc chương trình"
**Cause:** Selected subject has no curriculum nodes.  
**Fix:** Run migration SQL to seed curriculum, or manually add nodes.

### Error: "Không thể tạo câu hỏi"
**Cause:** No document content available for the selected lesson.  
**Fix:** Upload textbook and confirm chunks first.

### Questions are low quality / off-topic
**Cause:** Document chunks poorly mapped or missing.  
**Fix:** Review document chunk mappings in admin UI, reassign to correct nodes.

### AI chunking fails (returns 1 chunk for whole document)
**Cause:** Document text has no clear lesson boundaries.  
**Fix:** Add manual markers (e.g., "Bài 1:", "Bài 2:") or split document before upload.

### TypeScript errors with Supabase client
**Fix:** Use `as any` cast for untyped table inserts:
```typescript
const { data } = await (supabase.from('questions') as any).insert(...)
```

---

## Files Created/Modified

### New Files:
1. `migrations/add_curriculum_system.sql` — DB migration
2. `src/lib/curriculumService.ts` — Curriculum tree operations
3. `src/lib/documentService.ts` — Document management
4. `app/api/documents/upload/route.ts` — Upload + AI chunking
5. `app/api/documents/confirm/route.ts` — Admin review & confirm
6. `app/api/questions/generate/route.ts` — AI question generation
7. `CURRICULUM_SYSTEM_README.md` — This file

### Modified Files:
1. `app/teacher/tests/create/page.tsx` — Updated AI Generator tab to use real AI

---

## Technical Notes

### Why Smart Chunking?
- **Problem:** A 200-page textbook contains ~32 lessons. If we store the whole book as one document, the AI can't tell which lesson a question should target.
- **Solution:** Use Gemini to split the document into lesson-sized chunks, each mapped to a curriculum node.
- **Benefit:** Precise question generation ("generate 10 questions for Bài 12") and precise chatbot context.

### Why Curriculum Tree?
- **Problem:** Flat subject/topic structure limits question scoping and document organization.
- **Solution:** Hierarchical tree (Chapter → Lesson → Content) mirrors actual textbook structure.
- **Benefit:** Teachers can navigate by curriculum, students get context-aware help.

### Why Confirmation Step?
- **Problem:** AI chunking has ~80-95% accuracy (based on document quality).
- **Solution:** Admin reviews and adjusts mappings before chunks enter knowledge base.
- **Benefit:** Ensures high-quality RAG context, no garbage data.

### Fallback Mechanisms:
1. **If AI chunking fails:** Falls back to regex-based "Bài X:" splitting
2. **If no documents exist:** Generates questions from lesson title only (lower quality)
3. **If duplicate questions detected:** Gemini is instructed to avoid them

---

## Support

**For technical issues:**
- Check TypeScript errors: `npm run build`
- Check Supabase logs: Dashboard → Logs
- Check Gemini usage: Google AI Studio → Usage

**For content issues:**
- Verify curriculum seeded: `SELECT * FROM nodes WHERE subject_id = 1`
- Check document chunks: `SELECT * FROM document_chunks WHERE status = 'confirmed'`
- Test question quality: Generate 5 questions → manually review

---

## License & Credits

- **Gemini 2.5 Flash:** Google's AI model for question generation
- **Supabase:** PostgreSQL database with RLS
- **pdf.js / mammoth:** Client-side document extraction
- **Next.js 16:** Full-stack React framework

Built for **Age of Study** — Trường Tiểu Học Ninh Lai.
