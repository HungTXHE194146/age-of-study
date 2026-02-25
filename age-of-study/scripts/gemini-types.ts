/**
 * TypeScript types for Gemini structured output schema
 */

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
  imageDescription?: string  // Required if type='image'
  examples?: string[]
  exercises?: Exercise[]
}

export interface Exercise {
  question: string
  answer?: string
  explanation?: string
  imageDescription?: string  // If exercise has accompanying image
  hints?: string[]
}

export interface VocabularyTerm {
  term: string
  definition: string
  examples?: string[]
}

/**
 * Gemini JSON Schema for Structured Output
 * 
 * Pass this to Gemini API's generationConfig.responseSchema
 */
export const LESSON_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    lesson: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Full lesson title (e.g., 'Tiếng Việt 5 - Tập 1 - Bài 1: Tuổi học trò')"
        },
        chapter: {
          type: "string",
          description: "Chapter or theme name (e.g., 'Chủ điểm 1: Thế giới tuổi thơ')"
        },
        pages: {
          type: "string",
          description: "Page range (e.g., '7-10')"
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["theory", "example", "exercise", "image", "story", "poem"],
                description: "Type of content section"
              },
              title: {
                type: "string",
                description: "Section title or heading"
              },
              content: {
                type: "string",
                description: "Full text content (100% of original text, no summarization)"
              },
              imageDescription: {
                type: "string",
                description: "REQUIRED if type='image'. Detailed description of the image/diagram/illustration"
              },
              examples: {
                type: "array",
                items: { type: "string" },
                description: "List of example words/phrases if applicable"
              },
              exercises: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: {
                      type: "string",
                      description: "Exercise question text"
                    },
                    answer: {
                      type: "string",
                      description: "Answer if provided in textbook"
                    },
                    explanation: {
                      type: "string",
                      description: "Explanation if provided"
                    },
                    imageDescription: {
                      type: "string",
                      description: "Description of image if exercise includes visual component"
                    },
                    hints: {
                      type: "array",
                      items: { type: "string" },
                      description: "Hints if provided"
                    }
                  },
                  required: ["question"]
                },
                description: "Exercises in this section"
              }
            },
            required: ["type", "title", "content"]
          }
        },
        vocabulary: {
          type: "array",
          items: {
            type: "object",
            properties: {
              term: {
                type: "string",
                description: "Vocabulary term or key concept"
              },
              definition: {
                type: "string",
                description: "Definition of the term"
              },
              examples: {
                type: "array",
                items: { type: "string" },
                description: "Usage examples"
              }
            },
            required: ["term", "definition"]
          },
          description: "Important vocabulary and key terms from the lesson"
        },
        summary: {
          type: "string",
          description: "Brief summary of the entire lesson (2-3 sentences)"
        }
      },
      required: ["title", "chapter", "pages", "sections", "vocabulary", "summary"]
    }
  },
  required: ["lesson"]
}

/**
 * Prompt template for Gemini
 */
export const EXTRACTION_PROMPT = `Bạn là chuyên gia phân tích sách giáo khoa Tiếng Việt tiểu học Việt Nam.

NHIỆM VỤ: Đọc kỹ các trang sách được cung cấp và trích xuất TOÀN BỘ nội dung thành JSON có cấu trúc.

⚠️ QUAN TRỌNG VỀ FORMAT OUTPUT:
- Trả về ĐÚNG FORMAT JSON như ví dụ bên dưới
- KHÔNG wrap trong markdown code blocks
- KHÔNG thêm text giải thích
- Chỉ JSON thuần túy

FORMAT JSON BẮT BUỘC:
{
  "lesson": {
    "title": "Tiếng Việt 5 - Tập 1 - Bài [số]: [Tên bài]",
    "chapter": "Chủ điểm [số]: [Tên chủ điểm]",
    "pages": "7-10",
    "sections": [
      {
        "type": "theory",
        "title": "Tiêu đề phần lý thuyết",
        "content": "Nội dung đầy đủ 100%...",
        "examples": ["ví dụ 1", "ví dụ 2"]
      },
      {
        "type": "image",
        "title": "Hình minh họa",
        "content": "",
        "imageDescription": "Mô tả chi tiết: Hình vẽ 3 con voi màu xám..."
      },
      {
        "type": "exercise",
        "title": "Bài tập",
        "content": "Phần giới thiệu bài tập (nếu có)",
        "exercises": [
          {
            "question": "Câu hỏi đầy đủ",
            "answer": "Đáp án (nếu có trong sách)",
            "explanation": "Giải thích (nếu có)"
          }
        ]
      }
    ],
    "vocabulary": [
      {"term": "Danh từ", "definition": "Từ chỉ tên người, sự vật..."}
    ],
    "summary": "Tóm tắt ngắn gọn bài học"
  }
}

YÊU CẦU NỘI DUNG:
1. ✅ Đọc và ghi lại 100% văn bản - KHÔNG TÓM TẮT
2. ✅ Với MỌI HÌNH ẢNH, BIỂU ĐỒ, SƠ ĐỒ: Mô tả chi tiết bằng text
   - Hình minh họa: "Hình vẽ 3 con voi màu xám đứng cạnh cây dừa cao. Voi mẹ ở giữa, hai voi con ở hai bên..."
   - Bảng biểu: "Bảng 3 cột 4 hàng. Cột 1: Danh từ (bàn, ghế, cửa). Cột 2: Động từ (chạy, nhảy, bay)..."
   - Bài tập hình ảnh: "Ảnh 1 (bên trái): Bé gái 7 tuổi mặc áo đỏ đang đọc sách dày. Ảnh 2 (bên phải): Hai bé trai chơi bóng đá..."
3. ✅ Phân loại nội dung chính xác:
   - "theory": Lý thuyết, định nghĩa, quy tắc, khái niệm
   - "example": Ví dụ minh họa có đầy đủ đề bài và lời giải
   - "exercise": Bài tập (ghi CẢ đề bài VÀ đáp án nếu sách có)
   - "image": Hình ảnh minh họa độc lập (không đi kèm với exercise)
   - "story": Văn bản/truyện/đoạn văn để đọc
   - "poem": Thơ, bài ca
4. ✅ Với bài tập: Luôn ghi đầy đủ question + answer (nếu có) + explanation (nếu có)
5. ✅ Vocabulary: Chỉ lấy các thuật ngữ QUAN TRỌNG (danh từ, động từ, tính từ, chủ ngữ...)

QUAN TRỌNG - XỬ LÝ HÌNH ẢNH:
- Hình ảnh là nguồn CỰC KỲ QUAN TRỌNG để tạo câu hỏi sau này
- KHÔNG BAO GIỜ bỏ qua hình ảnh
- Mô tả đủ chi tiết để người không nhìn thấy hình vẫn hiểu được nội dung
- Với bài tập dạng "Quan sát tranh và trả lời": Mô tả hình rồi ghi câu hỏi

ĐẦU RA:
- Trả về theo ĐÚNG JSON schema đã định nghĩa
- Giữ nguyên cách diễn đạt, dấu câu, ngữ pháp như trong sách gốc
- Nếu có chữ không rõ: ghi [không rõ] thay vì bỏ qua`

/**
 * Database insertion types
 */
export interface DocumentInsert {
  subject_id: number
  title: string
  file_name: string
  file_type: string
  content: string
  total_pages: number
  metadata: {
    chapter?: string
    lessonNumber?: number
    pages?: string
    vocabulary?: VocabularyTerm[]
    sections?: ContentSection[]
  }
  teacher_id: string | null  // NULL for system imports, UUID for teacher uploads
  status: 'confirmed'
}

export interface DocumentChunkInsert {
  document_id: string  // UUID from documents table
  chunk_index: number
  content: string
  metadata: {
    type: string
    title?: string
    imageDescription?: string
  }
  status: 'pending'  // Database column is 'status', not 'embedding_status'
}
