import { GoogleGenerativeAI } from '@google/generative-ai'
import { SupabaseClient } from '@supabase/supabase-js'

export interface LessonContent {
  lesson: {
    title: string
    chapter: string
    pages: string
    sections: ContentSection[]
    vocabulary: VocabularyTerm[]
    summary: string
  }
}

export interface ContentSection {
  type: 'theory' | 'example' | 'exercise' | 'image' | 'story' | 'poem'
  title: string
  content: string
  imageDescription?: string
  examples?: string[]
  exercises?: any[]
}

export interface VocabularyTerm {
  term: string
  definition: string
  examples?: string[]
}

export const EXTRACTION_PROMPT = `Bạn là chuyên gia phân tích sách giáo khoa Tiếng Việt tiểu học Việt Nam.

NHIỆM VỤ: Đọc kỹ nội dung được cung cấp và trích xuất TOÀN BỘ thành JSON có cấu trúc.

⚠️ QUAN TRỌNG VỀ FORMAT OUTPUT:
- Trả về ĐÚNG FORMAT JSON
- KHÔNG wrap trong markdown code blocks
- KHÔNG thêm text giải thích hay lưu ý gì thêm

FORMAT JSON BẮT BUỘC:
{
  "lesson": {
    "title": "Tên bài học đầy đủ",
    "chapter": "Chủ điểm",
    "pages": "Trang",
    "sections": [
      {
        "type": "theory | example | exercise | image | story | poem",
        "title": "Tiêu đề phần",
        "content": "Nội dung đầy đủ...",
        "imageDescription": "Mô tả hình ảnh (nếu type=image)",
        "examples": ["vd1", "vd2"]
      }
    ],
    "vocabulary": [
      {"term": "từ", "definition": "nghĩa"}
    ],
    "summary": "Tóm tắt bài học"
  }
}
`

/**
 * Process text content with Gemini to extract structured curriculum data
 */
export async function processWithGemini(content: string): Promise<LessonContent> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash', // Use a fast and efficient model for this task
    generationConfig: { responseMimeType: "application/json" }
  })

  const result = await model.generateContent([
    { text: EXTRACTION_PROMPT },
    { text: `NỘI DUNG CẦN PHÂN TÍCH:\n\n${content}` }
  ])

  const text = result.response.text()
  return JSON.parse(text) as LessonContent
}

/**
 * Insert extracted content into Supabase documents and sections tables
 */
export async function insertDocumentToDb(
  supabase: SupabaseClient,
  params: {
    title: string
    fileName: string
    fileType: string
    content: string
    subjectId: number
    teacherId: string | null
    extracted: LessonContent
  }
) {
  const { title, fileName, fileType, content, subjectId, teacherId, extracted } = params
  const { lesson } = extracted

  // 1. Insert main document
  const { data: document, error: docError } = await supabase
    .from('documents')
    .insert({
      subject_id: subjectId,
      teacher_id: teacherId,
      title: title || lesson.title,
      file_name: fileName,
      file_type: fileType,
      content: content,
      total_pages: 1, // Defaulting if not multi-page PDF
      status: 'confirmed',
      metadata: {
        chapter: lesson.chapter,
        pages: lesson.pages,
        summary: lesson.summary
      }
    })
    .select('id')
    .single()

  if (docError || !document) {
    throw new Error(`Lỗi lưu tài liệu: ${docError?.message}`)
  }

  const documentId = document.id

  // 2. Insert sections
  if (lesson.sections && lesson.sections.length > 0) {
    const sectionRecords = lesson.sections.map((s, idx) => ({
      document_id: documentId,
      section_index: idx,
      section_type: s.type,
      title: s.title,
      content: s.content || '',
      image_description: s.imageDescription,
      metadata: {
        examples: s.examples,
        exercises: s.exercises
      }
    }))

    const { error: sectionsError } = await supabase
      .from('document_sections')
      .insert(sectionRecords)

    if (sectionsError) {
      console.error('Error inserting document sections:', sectionsError)
    }
  }

  // 3. Insert vocabulary
  if (lesson.vocabulary && lesson.vocabulary.length > 0) {
    const vocabRecords = lesson.vocabulary.map(v => ({
      document_id: documentId,
      term: v.term,
      definition: v.definition,
      metadata: { examples: v.examples }
    }))

    const { error: vocabError } = await supabase
      .from('document_vocabulary')
      .insert(vocabRecords)

    if (vocabError) {
      console.error('Error inserting vocabulary:', vocabError)
    }
  }

  // 4. Create text chunks for RAG (legacy support / search)
  // Simply chunking the full content by 2000 chars roughly
  const chunks = chunkText(content, 2000)
  const chunkRecords = chunks.map((c, i) => ({
    document_id: documentId,
    chunk_index: i,
    content: c,
    status: 'pending',
    metadata: { type: 'text' }
  }))

  const { error: chunksError } = await supabase
    .from('document_chunks')
    .insert(chunkRecords)

  if (chunksError) {
    console.error('Error inserting chunks:', chunksError)
  }

  return { documentId, totalChunks: chunks.length }
}

function chunkText(text: string, size: number): string[] {
  const result: string[] = []
  for (let i = 0; i < text.length; i += size) {
    result.push(text.substring(i, i + size))
  }
  return result
}
