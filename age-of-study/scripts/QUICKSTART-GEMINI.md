# 🚀 QUICK START: Gemini Textbook Import

## 1. Setup (5 minutes)

### Get Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API key"
3. Copy the key

### Add to .env file

```bash
# Open .env file in root directory and add:
GEMINI_API_KEY=your_api_key_here
```

### Install dependency

```bash
cd age-of-study
npm install pdf-lib
```

## 2. Prepare PDF

Place your textbook PDF in:
```
age-of-study/data/source-pdfs/tiengviet5-tap1.pdf
```

## 3. Get Subject ID

Run in Supabase SQL Editor:
```sql
SELECT id, name FROM subjects WHERE name LIKE '%Tiếng Việt%';
```

Example result:
```
id | name
---|-------------------
2  | Tiếng Việt 5
```

Use this ID in the next step.

## 4. Test First (RECOMMENDED)

Before processing the entire book, test with first 5 pages:

```bash
npx tsx scripts/test-gemini-extraction.ts data/source-pdfs/tiengviet5-tap1.pdf
```

This will:
- Extract first 5 pages
- Send to Gemini
- Save output to `data/test-output.json`

**Review the output:**
```bash
# Open and read the JSON file
code data/test-output.json
```

✅ **Check if:**
- Text is extracted correctly
- Images are described in detail
- Exercises include question + answer
- Vocabulary terms are captured
- Structure looks good

## 5. Run Full Import

If test looks good, run full import:

```bash
npx tsx scripts/gemini-import-textbook.ts data/source-pdfs/tiengviet5-tap1.pdf --subject-id=2
```

**What happens:**
1. Splits 130-page PDF into 13 chunks (10 pages each)
2. Processes each chunk with Gemini (~4 seconds per chunk)
3. Inserts directly to Supabase database
4. Creates text chunks for RAG
5. Shows progress in real-time

**Expected output:**
```
🚀 GEMINI TEXTBOOK IMPORT
============================================================
📁 Input PDF: data/source-pdfs/tiengviet5-tap1.pdf
📚 Subject ID: 2
🤖 Using Gemini 2.5 Flash
============================================================

📄 Loading PDF: data/source-pdfs/tiengviet5-tap1.pdf
📊 Total pages: 130
📦 Chunk size: 10 pages
🔢 Will create 13 chunks
  Creating chunk 1/13 (pages 1-10)...
  Creating chunk 2/13 (pages 11-20)...
  ...

🤖 [1/13] Processing chunk 1...
   📤 Uploading to Gemini...
   ✅ Uploaded (1.2 MB)
   🧠 Processing with Gemini...
   ✅ Extracted: "Tiếng Việt 5 - Tập 1 - Bài 1: Tuổi học trò"
      - Sections: 8
      - Vocabulary: 12
   💾 Inserting to Supabase...
   ✅ Document created (ID: 45)
   ✅ Created 15 text chunks
   ⏳ Waiting 4s before next request...

🤖 [2/13] Processing chunk 2...
...

📊 IMPORT STATISTICS
============================================================
Total pages processed: 130
PDF chunks processed: 13/13
Documents created: 13
Text chunks created: 195
Images described: 47
Exercises extracted: 89
Vocabulary terms: 156

⏱️  Total time: 12.5 minutes

✅ IMPORT COMPLETED!
```

## 6. Verify in Database

Check Supabase:

```sql
-- See imported documents
SELECT id, title, total_pages, status 
FROM documents 
WHERE subject_id = 2 
ORDER BY id DESC 
LIMIT 20;

-- See chunks
SELECT document_id, COUNT(*) as chunk_count
FROM document_chunks
GROUP BY document_id;
```

## 7. Test in UI

1. Go to Admin dashboard → Documents
2. Filter by Subject: "Tiếng Việt 5"
3. Click on a document to view details
4. Verify content looks correct

## Troubleshooting

### Error: "API key not found"

```bash
# Check if .env file has the key
cat .env | grep GEMINI_API_KEY

# If missing, add it:
echo "GEMINI_API_KEY=your_key_here" >> .env
```

### Error: "Rate limit exceeded"

+Gemini free tier: 5 RPM for Pro models / 15 RPM for Flash models (as of Dec 2025).
+Note: Free tier also has a daily limit (~25 requests/day for Pro), which may be
+hit during a 13-chunk full import. Consider enabling billing (Tier 1) for full runs.

**Solution:** Script automatically handles this with 4-second delays. If you still hit limits, you can:
1. Wait a few minutes
2. Re-run the script (it will skip already-processed chunks)
3. Or upgrade to Gemini Pro (300 req/min)

### Error: "Failed to parse JSON"

This means Gemini returned malformed JSON.

**Solution:**
1. Check `data/test-output.json` to see what's wrong
2. Adjust prompt in `scripts/gemini-types.ts` if needed
3. Re-run test

### Some chunks failed

If you see:
```
⚠️  Errors encountered: 2
   - Chunk 5: Failed to extract content
   - Chunk 11: Failed to insert to database
```

**Solution:**
1. Check error details above in the log
2. Re-run the script (it will process all chunks again, but faster since structure is same)
3. Or manually process failed chunks by splitting PDF into smaller parts

## Time & Cost Estimates

**For 260-page textbook (2 volumes):**

| Metric | Value |
|--------|-------|
| Processing time | ~15-20 minutes per volume |
| Total time | ~40 minutes for both |
| API cost (free tier) | $0.00 |
| API cost (paid tier) | ~$0.40 total |
| Token usage | ~1M tokens |
| Documents created | ~66 (one per lesson) |
| Text chunks | ~500 (for RAG) |

**Compare to manual NotebookLM:**
- Manual time: 5-6 hours
- **Time saved: 4.5-5.5 hours (93% faster)** ⚡

## Next Steps After Import

Once import is complete:

1. ✅ **Generate embeddings** for text chunks (for better RAG search)
2. ✅ **Map to curriculum nodes** (link lessons to curriculum tree)
3. ✅ **Test question generation** (verify AI can generate questions from imported content)
4. ✅ **Repeat for other subjects** (Toán 5, Khoa học 5, etc.)

## Tips for Best Results

### 1. High-Quality PDFs
- Use official PDF from publisher if possible
- Higher resolution = better text/image extraction

### 2. Batch Processing
Process multiple books at once:

```bash
# Process Tập 1
npx tsx scripts/gemini-import-textbook.ts data/source-pdfs/tiengviet5-tap1.pdf --subject-id=2

# Wait for completion, then Tập 2
npx tsx scripts/gemini-import-textbook.ts data/source-pdfs/tiengviet5-tap2.pdf --subject-id=2
```

### 3. Review Sample Outputs
Always run test script first and review output quality:
- Are image descriptions detailed enough?
- Are exercises complete?
- Is text accurately extracted?

### 4. Monitor Progress
Script shows real-time progress. You can:
- See which chunk is being processed
- Track statistics
- Identify errors immediately

## Get Help

If you encounter issues:

1. Check error message carefully
2. Review `GEMINI-IMPORT.md` for detailed info
3. Check Gemini API status: https://ai.google.dev/ 
4. Verify Supabase connection

## Success Checklist

- [ ] Gemini API key added to .env
- [ ] pdf-lib installed (`npm install pdf-lib`)
- [ ] PDF file placed in `data/source-pdfs/`
- [ ] Subject ID obtained from database
- [ ] Test script run successfully
- [ ] Test output reviewed and looks good
- [ ] Full import completed
- [ ] Documents visible in database
- [ ] Documents visible in Admin UI
- [ ] Ready to test question generation

✅ Once all checked → You're ready to import more textbooks!
