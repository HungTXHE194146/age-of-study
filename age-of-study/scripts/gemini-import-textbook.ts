/**
 * Gemini-Powered Textbook Import
 * 
 * Automatically extracts and imports entire textbook using Gemini API
 * 
 * Features:
 *   - Multimodal processing (text + images)
 *   - Structured JSON output
 *   - Direct Supabase insertion
 *   - Automatic retry on errors
 *   - Rate limit handling
 *   - Progress tracking
 * 
 * Usage:
 *   npx tsx scripts/gemini-import-textbook.ts data/source-pdfs/tiengviet5-tap1.pdf --subject-id=2
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PDFDocument } from 'pdf-lib'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import {
  LESSON_EXTRACTION_SCHEMA,
  EXTRACTION_PROMPT,
  LessonContent,
  DocumentInsert,
  DocumentChunkInsert
} from './gemini-types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: '.env.local' })

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CHUNK_SIZE = 10  // Pages per chunk
const CHUNK_TEXT_SIZE = 2000  // Characters per text chunk for RAG
const DELAY_BETWEEN_REQUESTS = 4000  // 4 seconds (15 req/min = 1 req/4s)
const MAX_RETRIES = 3

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:')
  if (!GEMINI_API_KEY) console.error('   - GEMINI_API_KEY')
  if (!SUPABASE_URL) console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  if (!SUPABASE_SERVICE_KEY) console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface ImportStats {
  totalPages: number
  chunksProcessed: number
  chunksFailed: number
  documentsCreated: number
  textChunksCreated: number
  imagesDescribed: number
  exercisesExtracted: number
  vocabularyTerms: number
  errors: Array<{ chunk: number, error: string }>
}

async function splitPdfIntoChunks(pdfPath: string, chunkSize: number): Promise<string[]> {
  console.log(`📄 Loading PDF: ${pdfPath}`)
  
  const pdfBytes = fs.readFileSync(pdfPath)
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const totalPages = pdfDoc.getPageCount()
  
  console.log(`📊 Total pages: ${totalPages}`)
  console.log(`📦 Chunk size: ${chunkSize} pages`)
  
  const numChunks = Math.ceil(totalPages / chunkSize)
  console.log(`🔢 Will create ${numChunks} chunks`)
  
  const chunkPaths: string[] = []
  const tempDir = path.join(__dirname, '../data/temp-chunks')
  fs.mkdirSync(tempDir, { recursive: true })
  
  for (let i = 0; i < numChunks; i++) {
    const startPage = i * chunkSize
    const endPage = Math.min((i + 1) * chunkSize, totalPages)
    
    console.log(`  Creating chunk ${i + 1}/${numChunks} (pages ${startPage + 1}-${endPage})...`)
    
    const newPdfDoc = await PDFDocument.create()
    const pageIndices = Array.from({ length: endPage - startPage }, (_, idx) => startPage + idx)
    const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices)
    
    copiedPages.forEach(page => newPdfDoc.addPage(page))
    
    const newPdfBytes = await newPdfDoc.save()
    const chunkPath = path.join(tempDir, `chunk-${i + 1}.pdf`)
    fs.writeFileSync(chunkPath, newPdfBytes)
    
    chunkPaths.push(chunkPath)
  }
  
  console.log(`✅ Created ${chunkPaths.length} PDF chunks`)
  return chunkPaths
}

async function processChunkWithGemini(
  chunkPath: string,
  chunkIndex: number,
  totalChunks: number,
  retryCount: number = 0
): Promise<LessonContent | null> {
  
  console.log(`\n🤖 [${chunkIndex}/${totalChunks}] Processing chunk ${chunkIndex}...`)
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!)
    
    // Load file as base64 for inline data
    console.log('   📄 Loading PDF...')
    const fileBuffer = fs.readFileSync(chunkPath)
    const base64Data = fileBuffer.toString('base64')
    const fileSize = fileBuffer.length
    
    console.log(`   ✅ Loaded (${(fileSize / 1024).toFixed(2)} KB)`)
    
    // Generate content with structured output
    console.log('   🧠 Processing with Gemini...')
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    })
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data
        },
      },
      { text: EXTRACTION_PROMPT },
    ])
    
    const jsonText = result.response.text()
    
    // Strip markdown code blocks if present
    let cleanedJson = jsonText
    if (cleanedJson.includes('```')) {
      cleanedJson = cleanedJson
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()
    }
    
    const content = JSON.parse(cleanedJson) as LessonContent
    
    console.log(`   ✅ Extracted: "${content.lesson.title}"`)
    console.log(`      - Sections: ${content.lesson.sections.length}`)
    console.log(`      - Vocabulary: ${content.lesson.vocabulary.length}`)
    
    return content
    
  } catch (error) {
    console.error(`   ❌ Error processing chunk ${chunkIndex}:`, error)
    
    if (retryCount < MAX_RETRIES) {
      console.log(`   🔄 Retrying (${retryCount + 1}/${MAX_RETRIES})...`)
      await delay(DELAY_BETWEEN_REQUESTS * 2)  // Longer delay on retry
      return processChunkWithGemini(chunkPath, chunkIndex, totalChunks, retryCount + 1)
    }
    
    return null
  }
}

function chunkTextContent(text: string, maxSize: number): string[] {
  const chunks: string[] = []
  let currentChunk = ''
  
  const sentences = text.split(/[.!?]\s+/)
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length + 2 > maxSize) {
      if (currentChunk) chunks.push(currentChunk.trim())
      currentChunk = sentence + '. '
    } else {
      currentChunk += sentence + '. '
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim())
  
  return chunks
}

async function insertToSupabase(
  content: LessonContent,
  subjectId: number,
  teacherId: string | null
): Promise<{ documentId: number, chunksCreated: number } | null> {
  
  console.log('   💾 Inserting to Supabase...')
  
  try {
    const lesson = content.lesson
    
    // Prepare full content text for searchability
    const fullText = lesson.sections
      .map(s => {
        let text = `${s.title}\n${s.content}\n`
        if (s.imageDescription) text += `[Hình ảnh: ${s.imageDescription}]\n`
        if (s.examples?.length) text += `Ví dụ: ${s.examples.join(', ')}\n`
        return text
      })
      .join('\n\n')
    
    // Insert document
    const documentData: DocumentInsert = {
      subject_id: subjectId,
      title: lesson.title,
      file_name: lesson.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() + '.json',
      file_type: 'application/json',
      content: fullText,
      total_pages: parseInt(lesson.pages.split('-')[1] || '1') - parseInt(lesson.pages.split('-')[0] || '1') + 1,
      metadata: {
        chapter: lesson.chapter,
        pages: lesson.pages,
        vocabulary: lesson.vocabulary,
        sections: lesson.sections,
      },
      teacher_id: teacherId,  // NULL for system imports (automated), UUID for teacher uploads
      status: 'confirmed',
    }
    
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert(documentData)
      .select('id')
      .single()
    
    if (docError) throw docError
    if (!document) throw new Error('Document insert returned no ID')
    
    console.log(`   ✅ Document created (ID: ${document.id})`)
    
    // Create text chunks for RAG
    const textChunks = chunkTextContent(fullText, CHUNK_TEXT_SIZE)
    const chunkRecords: DocumentChunkInsert[] = textChunks.map((chunk, idx) => ({
      document_id: document.id,
      chunk_index: idx,
      content: chunk,
      metadata: {
        type: 'text',
        chapter: lesson.chapter,
      },
      status: 'pending',
    }))
    
    const { error: chunkError } = await supabase
      .from('document_chunks')
      .insert(chunkRecords)
    
    if (chunkError) throw chunkError
    
    console.log(`   ✅ Created ${textChunks.length} text chunks`)
    
    return {
      documentId: document.id,
      chunksCreated: textChunks.length,
    }
    
  } catch (error) {
    console.error('   ❌ Database error:', error)
    return null
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function cleanupTempFiles(chunkPaths: string[]): void {
  console.log('\n🗑️  Cleaning up temporary files...')
  for (const chunkPath of chunkPaths) {
    if (fs.existsSync(chunkPath)) {
      fs.unlinkSync(chunkPath)
    }
  }
  const tempDir = path.dirname(chunkPaths[0])
  if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
    fs.rmdirSync(tempDir)
  }
  console.log('✅ Cleanup complete')
}

function printStats(stats: ImportStats): void {
  console.log('\n' + '='.repeat(60))
  console.log('📊 IMPORT STATISTICS')
  console.log('='.repeat(60))
  console.log(`Total pages processed: ${stats.totalPages}`)
  console.log(`PDF chunks processed: ${stats.chunksProcessed}/${stats.chunksProcessed + stats.chunksFailed}`)
  console.log(`Documents created: ${stats.documentsCreated}`)
  console.log(`Text chunks created: ${stats.textChunksCreated}`)
  console.log(`Images described: ${stats.imagesDescribed}`)
  console.log(`Exercises extracted: ${stats.exercisesExtracted}`)
  console.log(`Vocabulary terms: ${stats.vocabularyTerms}`)
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`)
    stats.errors.forEach(e => {
      console.log(`   - Chunk ${e.chunk}: ${e.error}`)
    })
  }
  
  console.log('='.repeat(60))
}

async function main() {
  const args = process.argv.slice(2)
  
  // Parse arguments
  let pdfPath: string | undefined
  let subjectId: number | undefined
  
  for (const arg of args) {
    if (arg.startsWith('--subject-id=')) {
      subjectId = parseInt(arg.split('=')[1])
    } else if (!arg.startsWith('--')) {
      pdfPath = arg
    }
  }
  
  if (!pdfPath || !subjectId) {
    console.log('Usage: npx tsx scripts/gemini-import-textbook.ts <pdf-path> --subject-id=<id>')
    console.log('')
    console.log('Example:')
    console.log('  npx tsx scripts/gemini-import-textbook.ts data/source-pdfs/tiengviet5-tap1.pdf --subject-id=2')
    console.log('')
    console.log('Get subject ID by running in Supabase SQL editor:')
    console.log("  SELECT id, name FROM subjects WHERE name LIKE '%Tiếng Việt%'")
    process.exit(1)
  }
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ File not found: ${pdfPath}`)
    process.exit(1)
  }
  
  console.log('🚀 GEMINI TEXTBOOK IMPORT')
  console.log('='.repeat(60))
  console.log(`📁 Input PDF: ${pdfPath}`)
  console.log(`📚 Subject ID: ${subjectId}`)
  console.log(`🤖 Using Gemini 1.5 Pro`)
  console.log('='.repeat(60))
  console.log('')
  
  const stats: ImportStats = {
    totalPages: 0,
    chunksProcessed: 0,
    chunksFailed: 0,
    documentsCreated: 0,
    textChunksCreated: 0,
    imagesDescribed: 0,
    exercisesExtracted: 0,
    vocabularyTerms: 0,
    errors: [],
  }
  
  const startTime = Date.now()
  
  try {
    // Step 1: Split PDF
    const chunkPaths = await splitPdfIntoChunks(pdfPath, CHUNK_SIZE)
    
    // Step 2: Process each chunk
    for (let i = 0; i < chunkPaths.length; i++) {
      const content = await processChunkWithGemini(chunkPaths[i], i + 1, chunkPaths.length)
      
      if (!content) {
        stats.chunksFailed++
        stats.errors.push({ chunk: i + 1, error: 'Failed to extract content' })
        continue
      }
      
      stats.chunksProcessed++
      
      // Count stats
      stats.imagesDescribed += content.lesson.sections.filter(s => s.imageDescription).length
      stats.exercisesExtracted += content.lesson.sections.reduce(
        (sum, s) => sum + (s.exercises?.length || 0),
        0
      )
      stats.vocabularyTerms += content.lesson.vocabulary.length
      
      // Step 3: Insert to database
      const result = await insertToSupabase(content, subjectId, null)  // NULL = system import (no teacher)
      
      if (result) {
        stats.documentsCreated++
        stats.textChunksCreated += result.chunksCreated
      } else {
        stats.errors.push({ chunk: i + 1, error: 'Failed to insert to database' })
      }
      
      // Step 4: Respect rate limits
      if (i < chunkPaths.length - 1) {
        console.log(`   ⏳ Waiting ${DELAY_BETWEEN_REQUESTS / 1000}s before next request...`)
        await delay(DELAY_BETWEEN_REQUESTS)
      }
    }
    
    // Cleanup
    cleanupTempFiles(chunkPaths)
    
    // Print stats
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(2)
    
    printStats(stats)
    
    console.log(`\n⏱️  Total time: ${duration} minutes`)
    console.log('\n✅ IMPORT COMPLETED!')
    
    if (stats.errors.length > 0) {
      console.log('\n⚠️  Some chunks failed. Review errors above.')
      console.log('You can re-run the script to retry failed chunks.')
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

main()
