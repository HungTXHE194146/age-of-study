# AI Chatbot "Cú Mèo" 🦉 - Implementation Guide

## Overview

RAG-based AI tutoring assistant powered by Gemini 2.5 Flash that only answers based on provided teacher content (questions + documents).

### Architecture

```
Student asks → API Route /api/chat → Retrieval from Supabase → Gemini Stream → Response
                     ↓
              Cache check (reduces cost 60-80%)
                     ↓
              Rate limit (10 msgs/min)
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @google/generative-ai
```

Already added to `package.json`. Run `npm install` to sync.

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required vars:
- `GOOGLE_GEMINI_API_KEY` — Get free key from https://aistudio.google.com/app/apikey
- `SUPABASE_SERVICE_ROLE_KEY` — From Supabase dashboard → Settings → API

**SECURITY NOTE:** Never prefix server-only keys with `NEXT_PUBLIC_`.

### 3. Run Database Migration

Run the SQL migration in Supabase SQL Editor:

```bash
# Open Supabase dashboard → SQL Editor → New Query
# Copy/paste contents of: migrations/add_ai_chatbot_tables.sql
# Click "Run"
```

This creates:
- `documents` table (for teacher-uploaded content text)
- `chat_cache` table (stores cached AI responses)
- Full-text search indexes on `questions` and `documents`
- RLS policies

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 and log in as a **student**. The chatbot button (yellow owl) will appear in the bottom-right corner.

---

## How It Works

### RAG (Retrieval-Augmented Generation)

**Problem:** If we ask Gemini directly, it answers from its training data (the entire internet). Students could ask about video games or get answers outside the curriculum.

**Solution:** 
1. **Retrieval**: Before calling Gemini, retrieve relevant questions and documents from the database
2. **Augmented Generation**: Tell Gemini "ONLY answer based on this content" in the system prompt
3. **Result**: Chatbot can't answer questions outside the provided curriculum

Example:
```
Student: "Phân số là gì?"
→ Server searches DB for questions/docs about "phân số" 
→ Found: 10 quiz questions + 2 teacher documents about fractions
→ Gemini receives: SystemPrompt + Context (questions+docs) + Student question
→ Gemini answers ONLY using the provided context
```

### Streaming

Instead of waiting 3-5 seconds for the full response, Gemini sends text in small chunks (~50 tokens each). We pipe these chunks to the browser as Server-Sent Events, so the UI can display text as it arrives (like ChatGPT's typing effect).

### Caching Strategy

- Hash each question + subjectId → lookup in `chat_cache` table
- If found & not expired → return cached answer immediately (0 API cost, <100ms)
- If not found → call Gemini → save answer to cache for 24 hours
- **Expected savings:** 60-80% reduction in API calls (students in same class ask similar questions)

### Rate Limiting

- 10 messages per minute per student
- Simple implementation: count recent `chat_logs` in DB
- If exceeded → friendly error: "Cú Mèo đang bận, chờ chút nha~ 🦉"
- Prevents API spam and cost overrun

---

## Usage

### For Students

1. Open any page in the student dashboard (not during tests)
2. Click the yellow owl button floating on screen (draggable)
3. Type a question related to lessons
4. Chat history persists within the day
5. Click ↻ icon to start new conversation

### For Teachers (Future - not yet implemented)

Upload teaching materials:
1. Go to Teacher Dashboard → Documents
2. Upload PDF/DOCX files
3. System extracts text and stores in `documents` table
4. Students can now ask questions about this content via chatbot

---

## Cost Estimation

### Free Tier (Gemini 2.5 Flash)
- 30 requests/minute
- 1,500 requests/day
- **Sufficient for:** ~30 students (demo/pilot)

### Paid Tier
- ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens
- **With caching & optimization:** 
  - 30 students: $0/month (free tier)
  - 300 students: ~$30-50/month
  - 900 students: ~$100-150/month

**Note:** Costs are estimates based on ~5 questions/student/day with 5K token context per question.

---

## Architecture Decisions

### Why not vector database?

Elementary school curriculum is small (~200-500 questions per subject). Context window of Gemini 2.5 Flash (1M tokens) is huge. We can fit the entire subject in one prompt at ~50K tokens, which is:
- Simpler to implement (no embedding pipeline)
- Faster (no semantic search latency)
- Cheaper (no separate vector DB infrastructure)
- Accurate enough (full-text search handles elementary school vocabulary well)

**When to upgrade:** If content grows beyond 10K questions or latency/cost becomes an issue, add pgvector with embeddings.

### Why streaming instead of simple fetch?

1. **UX:** Students see progress immediately (text appearing) vs. 3-5s blank loading spinner
2. **Perceived speed:** Feels 2-3x faster even though total time is similar
3. **Standard practice:** All modern AI chat interfaces (ChatGPT, Claude, Gemini) stream
4. **Elementary school users:** Low patience — need instant feedback

### Why cache at DB level, not Redis?

- Keeps stack simple (one infrastructure: Supabase PostgreSQL)
- PostgreSQL is fast enough for 30-900 concurrent users (<5ms cache lookups)
- Free tier limitations (Supabase free tier has PostgreSQL but may not have Redis addon)
- Easy to inspect cache hits/misses via SQL console

**When to upgrade:** If >1000 concurrent users or cache lookups exceed 50ms p99, migrate cache to Redis.

---

## Files Created/Modified

### New Files
- `app/api/chat/route.ts` — API endpoint (400+ lines, core logic)
- `src/lib/chatService.ts` — Client-side streaming handler
- `src/lib/supabaseServer.ts` — Server-only Supabase client
- `migrations/add_ai_chatbot_tables.sql` — Database schema
- `.env.example` — Environment variable template

### Modified Files
- `src/components/student/FloatingChatbot.tsx` — Replaced mock with real AI streaming
- `package.json` — Added `@google/generative-ai` dependency
- `app/(dashboard)/layout.tsx` — Already integrated (shows chatbot for students only)

---

## Testing Checklist

- [ ] Run migration in Supabase
- [ ] Add environment variables
- [ ] Run `npm install` to get Gemini SDK
- [ ] Start dev server
- [ ] Log in as student
- [ ] Chatbot button appears (yellow owl)
- [ ] Send a message → see streaming response
- [ ] Ask same question again → verify instant cached response
- [ ] Send 15 messages rapidly → verify rate limit kicks in
- [ ] Check Supabase `chat_logs` table → verify messages saved
- [ ] Check `chat_cache` table → verify cached responses
- [ ] Refresh page → verify chat history loads
- [ ] Click ↻ button → verify chat clears

---

## Troubleshooting

### "Chưa đăng nhập" error
- Check `Authorization` header is being sent in `chatService.ts`
- Verify user session exists in `useAuthStore`

### "Có lỗi xảy ra" 500 error
- Check API route logs in terminal (server-side console.errors)
- Verify `GOOGLE_GEMINI_API_KEY` is set correctly in `.env.local`
- Check Gemini API key is valid: https://aistudio.google.com/app/apikey

### Streaming doesn't work (no text appears)
- Check browser console for fetch errors
- Verify `/api/chat` route is accessible (not 404)
- Check Content-Type is `text/event-stream` in network tab

### "Câu hỏi này nằm ngoài bài học" every time
- Check `documents` and `questions` tables have content
- Verify `status = 'available'` on questions (not 'draft' or 'archived')
- Check `retrieveContext()` function is returning non-empty context

### Rate limit too aggressive
- Edit `RATE_LIMIT_PER_MINUTE` in `app/api/chat/route.ts` (line 40)

### Cache not working
- Check `chat_cache` table exists (run migration)
- Verify `expires_at` is not in the past
- Check hash function is generating consistent keys

---

## Next Steps (Future Enhancements)

1. **Document Upload UI** — Teacher dashboard to upload PDF/DOCX and auto-extract text
2. **Subject Context** — Pass actual subjectId from current page to scope chatbot knowledge
3. **Conversation Analytics** — Dashboard showing most asked questions, cache hit rates
4. **Better Retrieval** — Implement semantic search with pgvector for 1000+ questions
5. **Voice Input** — Allow students to ask questions via voice (browser Speech Recognition API)
6. **Image Support** — Let students upload images of homework (Gemini multimodal)

---

## Contact

For questions or issues, refer to the main project README or open an issue in the repository.
