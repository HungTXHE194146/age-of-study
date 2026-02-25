# Gemini Document Processing - Automated Import

## Overview

This approach uses **Gemini API's multimodal capabilities** to:
1. Read scanned PDF pages (text + images)
2. Extract structured content including image descriptions
3. Automatically insert into Supabase database

## Why This Approach?

✅ **Handles scanned PDFs**: No need for text layer
✅ **Processes images**: Describes diagrams, exercises, illustrations
✅ **Structured output**: Returns clean JSON matching our schema
✅ **Fully automated**: No manual copy-paste, no cut-off issues
✅ **Time efficient**: Run once, process 260 pages while you sleep

## Architecture

```
PDF (260 pages)
   ↓
Split into chunks (5-10 pages each)
   ↓
For each chunk:
   ├─ Upload to Gemini API (File API)
   ├─ Send prompt with JSON schema
   ├─ Gemini reads text + describes images
   ├─ Returns structured JSON
   └─ Insert directly to Supabase
   ↓
Complete database ready for website
```

## Setup

### 1. Get Gemini API Key

```bash
# Visit: https://aistudio.google.com/app/apikey
# Create API key (free tier: 15 requests/minute, 1M tokens/day)

# Save to .env file:
echo "GEMINI_API_KEY=your_api_key_here" >> .env
```

### 2. Install Dependencies

```bash
npm install @google/generative-ai pdf-lib
```

### 3. Prepare PDF Files

Place your textbook PDFs in:
```
data/source-pdfs/
├── tiengviet5-tap1.pdf
└── tiengviet5-tap2.pdf
```

## JSON Schema Design

Our structured output schema:

```typescript
{
  "lesson": {
    "title": "Tiếng Việt 5 - Tập 1 - Bài 1: Tuổi học trò",
    "chapter": "Chủ điểm 1: Thế giới tuổi thơ",
    "pages": "7-10",
    "sections": [
      {
        "type": "theory" | "example" | "exercise" | "image",
        "title": "Định nghĩa danh từ",
        "content": "Danh từ là từ chỉ tên người, sự vật, hiện tượng...",
        "imageDescription": "Hình vẽ 3 con voi đứng cạnh cây dừa...", // If type=image
        "examples": ["bàn", "ghế", "Hà Nội"],  // If applicable
        "exercises": [  // If type=exercise
          {
            "question": "Tìm danh từ trong câu: 'Bác Hồ sinh ở làng Sen'",
            "answer": "Bác Hồ, làng Sen",
            "explanation": "Là tên người và địa danh"
          }
        ]
      }
    ],
    "vocabulary": [  // Important terms
      {"term": "Danh từ", "definition": "Từ chỉ tên..."},
      {"term": "Động từ", "definition": "Từ chỉ hành động..."}
    ],
    "summary": "Bài học giới thiệu về danh từ, động từ..."
  }
}
```

## Prompt Template

The prompt sent to Gemini:

```
Bạn là chuyên gia phân tích sách giáo khoa Tiếng Việt tiểu học.

Nhiệm vụ: Đọc kỹ các trang sách được cung cấp và trích xuất TOÀN BỘ nội dung thành JSON có cấu trúc.

YÊU CẦU BẮT BUỘC:
1. Đọc và ghi lại 100% văn bản (không tóm tắt)
2. Với MỌI HÌNH ẢNH: Mô tả chi tiết bằng text
   - Hình minh họa: "Hình vẽ 3 con voi màu xám đứng cạnh cây dừa cao..."
   - Bảng biểu: "Bảng gồm 3 cột: Danh từ | Động từ | Tính từ. Hàng 1: bàn | chạy | đẹp..."
   - Bài tập hình ảnh: "Ảnh 1: Một bé gái đang đọc sách. Ảnh 2: Hai bé trai chơi bóng..."
3. Phân loại nội dung thành: theory, example, exercise, image
4. Với bài tập: Ghi cả đề bài VÀ đáp án (nếu có)
5. Trả về đúng JSON schema đã cho

CẤU TRÚC JSON:
{schema here}

QUAN TRỌNG:
- Không bỏ sót bất kỳ hình ảnh nào
- Hình ảnh là nguồn quan trọng để tạo câu hỏi sau này
- Giữ nguyên cách diễn đạt gốc trong sách
```

## Scripts

### Main Script: `gemini-import-textbook.ts`

Processes entire textbook automatically:

```bash
# Process one book
npx tsx scripts/gemini-import-textbook.ts data/source-pdfs/tiengviet5-tap1.pdf

# Process all books in folder
npx tsx scripts/gemini-import-textbook.ts data/source-pdfs/
```

Flow:
1. Split PDF into 10-page chunks
2. Upload each chunk to Gemini File API
3. Send chunk + prompt to Gemini
4. Receive structured JSON
5. Parse and validate
6. Insert to Supabase (documents + chunks + metadata)
7. Log progress (with retry on errors)
8. Generate summary report

### Test Script: `test-gemini-extraction.ts`

Test with first 5 pages before running full import:

```bash
npx tsx scripts/test-gemini-extraction.ts data/source-pdfs/tiengviet5-tap1.pdf
```

Output:
- Extracted JSON (saved to `data/test-output.json`)
- Token usage stats
- Validation report
- Preview of what will be inserted

## Rate Limits & Optimization

**Gemini API Free Tier:**
- 15 requests/minute
- 1M tokens/day (~500 pages)
- Max 2MB per file upload

**Our strategy:**
- Process 10 pages/request = ~26 requests for 260 pages
- Delay between requests: 4 seconds (15 req/min = 1 req/4s)
- Total time: ~2 minutes processing + ~10 minutes for Gemini
- **Total: ~15-20 minutes for entire 260-page book** 🚀

**If you have Gemini Pro (paid):**
- 300 requests/minute
- 10M tokens/day
- Can process entire 260 pages in ~5 minutes

## Cost Estimation

**Free tier:**
- ✅ Completely free
- ✅ Enough for 500 pages/day
- ✅ Perfect for 260-page textbooks

**Paid tier (if needed later):**
- Gemini Pro: ~$0.35 per 1M input tokens
- 260 pages ≈ 500k tokens
- Cost: ~$0.20 per textbook
- **Total for all subjects (10 books): ~$2** 💰

## Error Handling

Script includes:
- ✅ Automatic retry (3 attempts) on API errors
- ✅ Rate limit detection and backoff
- ✅ Resume from last successful page
- ✅ Detailed error logs
- ✅ Partial success tracking (if 50/66 succeed, you know which 16 failed)

## Advantages Over NotebookLM

| Feature | NotebookLM | Gemini API |
|---------|------------|------------|
| **Automation** | ❌ Manual | ✅ Fully automated |
| **Scanned PDFs** | ⚠️ Limited | ✅ Native support |
| **Image description** | ❌ Lost | ✅ Detailed descriptions |
| **Cut-off issues** | ❌ At 50% | ✅ None |
| **Structured output** | ❌ Plain text | ✅ Clean JSON |
| **Time for 260 pages** | 5-6 hours | 15-20 minutes |
| **Direct DB insert** | ❌ Need script | ✅ Built-in |

## Next Steps

1. Get Gemini API key (5 minutes)
2. Create test script to validate approach (30 minutes)
3. Run test on first 10 pages (2 minutes)
4. Review output quality
5. If good → Run full import (15-20 minutes)
6. Verify in Supabase (5 minutes)
7. Test in UI (5 minutes)

**Total time: ~1 hour from start to finish** (vs 5-6 hours manual)

## Future Enhancements

Once working:
- [ ] Parallel processing (multiple books at once)
- [ ] Auto-mapping to curriculum nodes
- [ ] Image extraction and storage in cloud storage
- [ ] OCR fallback for failed pages
- [ ] Progress dashboard during import
