# Bulk Import Scripts

## 🚀 RECOMMENDED: Gemini API Import (NEW)

**For large textbooks (50+ pages) with images/diagrams**

✅ **100% automated** - No manual work
✅ **Preserves images** - AI describes all visuals
✅ **Structured output** - Clean JSON with metadata
✅ **15-20 minutes** for 260-page textbook (vs 5-6 hours manual)

### Quick Start

1. **Get API key:** https://aistudio.google.com/app/apikey
2. **Add to .env:** `GEMINI_API_KEY=your_key_here`
3. **Install:** `npm install pdf-lib`
4. **Run:** 
   ```bash
   npx tsx scripts/gemini-import-textbook.ts data/source-pdfs/tiengviet5.pdf --subject-id=2
   ```

**📖 Complete guide:** See [QUICKSTART-GEMINI.md](./QUICKSTART-GEMINI.md)

**📊 Comparison:** See [GEMINI-VS-NOTEBOOKLM.md](./GEMINI-VS-NOTEBOOKLM.md)

---

## Alternative: Manual NotebookLM Import (Legacy)

**Use this only for:**
- Small documents (< 10 pages)
- When you can't use Gemini API
- One-off quick extractions

## Preparation

### 1. Install dependencies
```bash
npm install tsx dotenv
```

### 2. Create data folder structure
```bash
mkdir -p data
```

### 3. Extract content from NotebookLM

**For each chapter:**
1. Upload PDF to NotebookLM
2. Use this prompt:
```
Hãy trích xuất toàn bộ nội dung văn bản của [CHƯƠNG X: TÊN].

Yêu cầu:
1. Giữ nguyên 100% nội dung gốc
2. Giữ format: tiêu đề, bullet points, numbering
3. Bỏ qua hình ảnh, chỉ lấy text
4. Bao gồm: lý thuyết, ví dụ, bài tập

Output: Chỉ nội dung thuần túy.
```
3. Copy output to `data/[subject]-[book]-[chapter].txt`

**Example file structure:**
```
data/
├── toan5-tap1-chuong1.txt
├── toan5-tap1-chuong2.txt
├── toan5-tap1-chuong3.txt
├── toan5-tap2-chuong1.txt
├── tiengviet5-tap1-chuong1.txt
└── ...
```

### 4. Configure documents

Edit `scripts/bulk-import-documents.ts`:

```typescript
const DOCUMENTS: DocumentConfig[] = [
  { 
    filePath: 'data/toan5-tap1-chuong1.txt', 
    subjectId: 1,  // Get from subjects table
    title: 'Toán 5 - Tập 1 - Chương 1: Số tự nhiên',
    chapter: 'Chương 1',
  },
  // Add all your documents...
]
```

**Find Subject IDs:**
```sql
-- Run in Supabase SQL Editor
SELECT id, name, code FROM subjects;
```

### 5. Run import

```bash
cd age-of-study
npx tsx scripts/bulk-import-documents.ts
```

**Expected output:**
```
🚀 Bulk Document Import Script
📁 Total documents to import: 30

============================================================
[1/30] 📄 Processing: Toán 5 - Tập 1 - Chương 1
  📖 Read 15234 characters
  ✅ Document created: ID abc-123
  ✂️  Creating 8 chunks...
  ✅ Inserted 8 chunks

[2/30] 📄 Processing: Toán 5 - Tập 1 - Chương 2
  📖 Read 12456 characters
  ✅ Document created: ID def-456
  ✂️  Creating 7 chunks...
  ✅ Inserted 7 chunks

...

============================================================
📊 Import Summary:
  ✅ Success: 30
  ❌ Failed: 0
  📈 Total: 30

✨ Import completed!
```

## Troubleshooting

### Error: "File not found"
- Check file path relative to project root
- Make sure `data/` folder exists

### Error: "Content too short"
- File must have at least 100 characters
- Check if file extraction was successful

### Error: "Database error"
- Check SUPABASE credentials in .env.local
- Verify subject_id exists in database

### Rate limiting
- Script includes 500ms delay between imports
- Can adjust in code if needed

## Tips

1. **Test first**: Import 2-3 chapters, verify in UI, then do full import
2. **Backup**: Keep original PDF and txt files
3. **Review**: Check a few documents in UI after import
4. **Re-run**: If something fails, fix config and re-run (won't create duplicates if you delete failed ones first)

## Alternative: Manual Import via UI

If you prefer not to use scripts:
1. Go to `/admin/documents`
2. Click "Thêm tài liệu"
3. Tab "Paste Text"
4. Paste content from txt file
5. Fill title and chapter
6. Click "Lưu nội dung"
7. Repeat for each chapter

**Time estimate:**
- Script: ~10 minutes for 30 chapters
- Manual UI: ~2-3 minutes per chapter = 60-90 minutes total
