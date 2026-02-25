/**
 * Crawler for loigiaihay.com - SGK Tiếng Việt 5 Kết nối tri thức
 * 
 * ⚠️ COPYRIGHT NOTICE:
 * This script crawls publicly available educational content for INTERNAL EDUCATIONAL USE ONLY.
 * Content belongs to original publishers. Do not redistribute or use commercially.
 * This falls under Fair Use for educational purposes only.
 * 
 * Usage:
 *   npx tsx scripts/crawl-loigiaihay.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { CURRICULUM } from './curriculum-urls.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const BASE_URL = 'https://loigiaihay.com'
const OUTPUT_DIR = path.join(__dirname, '../data/crawled')
const DELAY_MS = 3000 // Respectful crawling: 3 seconds between requests

// Types
interface ImageData {
  url: string
  alt: string
  context: string
}

interface QAPair {
  question: string
  answer: string
}

interface Section {
  content_label: string
  title: string
  url: string
  content: string
  qa_pairs: QAPair[]
  remember?: string
  images: ImageData[]
}

interface Lesson {
  lesson_number: number
  title: string
  sections: Section[]
}

interface Week {
  week_number: number
  theme: string
  lessons: Lesson[]
}

interface CrawledData {
  textbook: string
  source: string
  source_url: string
  crawled_at: string
  weeks: Week[]
}

// Utility: Delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Utility: Clean text (remove extra whitespace, normalize)
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()
}

// Step 1: Load curriculum structure from manual config
function loadCurriculumStructure(): { weeks: Array<{ theme: string, lessons: Array<{ title: string, url: string }> }> } {
  console.log('📋 Loading curriculum structure from config file...')
  
  // Filter only Tập 1 lessons (URLs contain "tap-1")
  const tap1Weeks = CURRICULUM.filter(week => 
    week.lessons.some(lesson => lesson.url.includes('tap-1'))
  ).map(week => ({
    theme: week.theme,
    lessons: week.lessons.filter(lesson => lesson.url.includes('tap-1'))
  }))
  
  console.log(`   ✅ Found ${tap1Weeks.length} weeks (Tập 1 only)`)
  console.log(`   ✅ Total lessons: ${tap1Weeks.reduce((sum, w) => sum + w.lessons.length, 0)}`)
  
  // Debug: show first few weeks
  tap1Weeks.slice(0, 3).forEach((week, idx) => {
    console.log(`   🔍 Week ${idx + 1} has ${week.lessons.length} lessons`)
  })
  
  return { weeks: tap1Weeks }
}

// Step 2: Crawl individual page
async function crawlPage(url: string, retries = 3): Promise<Partial<Section>> {
  console.log(`   📄 Crawling: ${url}`)
  
  // Retry logic for network errors
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Educational Research Bot)',
        },
        timeout: 30000, // 30 second timeout
      })
      
      const $ = cheerio.load(response.data)
      
      // Extract content
      const content: string[] = []
      const qaPairs: QAPair[] = []
      const images: ImageData[] = []
      let remember = ''
    
    // Strategy: Each div.box-question is a section. Identify them by headers.
    $('div.box-question, div.box-content').each((i, element) => {
      const $elem = $(element)
      
      // Find section header
      const header = $elem.find('h2, h3, p > strong').first().text().trim()
      
      // Extract "Ghi nhớ" from tables - check BOTH section header and table text
      $elem.find('table').each((j, table) => {
        const tableText = cleanText($(table).text())
        if (tableText && tableText.length > 30) {
          // Check if either the section header or table text contains remember keywords
          const isRememberSection = header && (
            header.includes('Ghi nhớ') || 
            header.includes('Nội dung bài đọc')
          )
          const isRememberTable = 
            tableText.includes('Ghi nhớ') || 
            tableText.includes('Nội dung bài đọc')
          
          if (isRememberSection || isRememberTable) {
            remember += (remember ? '\n\n' : '') + tableText
          }
        }
      })
      
      // Extract main content ONLY from "Bài đọc" section (not questions)
      if (header && (header.includes('Bài đọc') || header.includes('THANH ÂM') || !header.match(/^Câu \d+$/))) {
        // Skip headers like "Câu 1", "Câu 2" - those are questions
        if (!header.match(/^(Câu|Trả lời câu hỏi|Khởi động)/i)) {
          $elem.find('p').each((j, p) => {
            const text = cleanText($(p).text())
            // Skip meta text like "Trả lời câu hỏi X trang Y"
            if (text && text.length > 20 && !text.includes('Trả lời câu hỏi') && !text.includes('trang')) {
              content.push(text)
            }
          })
        }
      }
      
      // Extract Q&A pairs from question sections (Câu 1, Câu 2, etc.)
      if (header && header.match(/^Câu \d+$/)) {
        let questionText = ''
        let answerText = ''
        let inAnswer = false
        
        $elem.find('p').each((j, p) => {
          const text = cleanText($(p).text())
          
          // Skip the header "Trả lời câu hỏi..."
          if (text.includes('Trả lời câu hỏi') && text.includes('trang')) {
            return
          }
          
          // Check if we're entering answer section
          if (text.includes('Phương pháp giải:') || text.includes('Lời giải chi tiết:')) {
            inAnswer = true
            return
          }
          
          if (text.length > 15) {
            if (!inAnswer) {
              questionText += (questionText ? '\n' : '') + text
            } else {
              answerText += (answerText ? '\n' : '') + text
            }
          }
        })
        
        // Create Q&A pair if both exist
        if (questionText && answerText) {
          qaPairs.push({
            question: questionText,
            answer: answerText
          })
        }
      }
      
      // Extract images from content sections only (not from questions)
      if (header && !header.match(/^Câu \d+$/)) {
        $elem.find('img').each((j, img) => {
          const imgUrl = $(img).attr('src')
          const alt = $(img).attr('alt') || ''
          
          if (imgUrl) {
            images.push({
              url: imgUrl.startsWith('http') ? imgUrl : BASE_URL + imgUrl,
              alt,
              context: header || '',
            })
          }
        })
      }
    })
    
      return {
        url,
        content: content.join('\n\n'),
        qa_pairs: qaPairs,
        remember,
        images,
      }
      
    } catch (error: any) {
      // On network errors, retry with exponential backoff
      if (attempt < retries && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED')) {
        const backoffMs = 1000 * Math.pow(2, attempt) // 2s, 4s, 8s
        console.log(`   ⚠️  Retry ${attempt}/${retries} after ${backoffMs}ms...`)
        await delay(backoffMs)
        continue
      }
      
      // If all retries failed or non-retryable error
      console.error(`   ❌ Error crawling ${url}:`, error.message || error)
      return { url, content: '', qa_pairs: [], images: [] }
    }
  }
  
  // If we exhausted all retries
  return { url, content: '', qa_pairs: [], images: [] }
}

// Step 3: Parse structure and crawl all pages
async function crawlAll(): Promise<CrawledData> {
  console.log('🚀 Starting crawl of loigiaihay.com (Tập 1)')
  console.log('='.repeat(60))
  
  const structure = loadCurriculumStructure()
  
  const crawledData: CrawledData = {
    textbook: 'Tiếng Việt 5 - Tập 1 - Kết nối tri thức',
    source: 'loigiaihay.com',
    source_url: 'https://loigiaihay.com/tieng-viet-5-ket-noi-tri-thuc-c1786.html',
    crawled_at: new Date().toISOString(),
    weeks: [],
  }
  
  // Process each week
  for (let weekIdx = 0; weekIdx < structure.weeks.length; weekIdx++) {
    const weekData = structure.weeks[weekIdx]
    console.log(`\n📚 Week ${weekIdx + 1}: ${weekData.theme}`)
    console.log(`   📝 Lessons in this week: ${weekData.lessons.length}`)
    
    const week: Week = {
      week_number: weekIdx + 1,
      theme: weekData.theme,
      lessons: [],
    }
    
    // Group items by lesson (items with same "Bài X:" prefix belong to same lesson)
    const lessonMap = new Map<number, Section[]>()
    
    for (const item of weekData.lessons) {  // Fixed: use 'lessons' not 'items'
      console.log(`   🔍 Processing: "${item.title}"`)
      
      // Normalize the title to remove invisible Unicode characters
      const normalizedTitle = item.title
        .normalize('NFC')  // Normalize Unicode
        .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Remove zero-width spaces
        .replace(/[：:]/g, ':')  // Normalize colons (both ASCII and fullwidth)
        .trim()
      
      // Extract lesson/section number from title
      // Pattern 1: "Bài 3: Tuổi ngựa" → lesson 3
      // Pattern 2: "Phần 1 - Ôn tập: Tiết 1 - 2" → section 1 (for review weeks)
      let match = normalizedTitle.match(/Bài\s*(\d+)\s*[:：]\s*(.+)/)
      let isReviewSection = false
      
      if (!match) {
        // Try matching "Phần X -" pattern for review/assessment sections
        match = normalizedTitle.match(/Phần\s*(\d+)\s*[-–—]\s*(.+)/)
        isReviewSection = true
      }
      
      if (match) {
        const lessonNum = parseInt(match[1])
        const sectionTitle = match[2]
        
        // Crawl this page
        const sectionData = await crawlPage(item.url)
        
        const section: Section = {
          content_label: determineSectionType(sectionTitle),
          title: sectionTitle,
          url: item.url,
          content: sectionData.content || '',
          qa_pairs: sectionData.qa_pairs || [],
          remember: sectionData.remember,
          images: sectionData.images || [],
        }
        
        if (!lessonMap.has(lessonNum)) {
          lessonMap.set(lessonNum, [])
        }
        lessonMap.get(lessonNum)!.push(section)
        
        console.log(`      ✅ ${item.title}`)
        
        // Respectful delay
        await delay(DELAY_MS)
      } else {
        // Show hex codes to debug Unicode issues
        const hexCodes = Array.from(item.title.substring(0, 20))
          .map(c => `${c}(${c.charCodeAt(0).toString(16)})`)
          .join(' ')
        console.log(`      ⚠️  SKIPPED (regex no match)`)
        console.log(`         Title: "${item.title}"`)
        console.log(`         Hex: ${hexCodes}`)
      }
    }
    
    // Convert map to lessons array
    for (const [lessonNum, sections] of lessonMap.entries()) {
      week.lessons.push({
        lesson_number: lessonNum,
        title: sections[0]?.title || `Bài ${lessonNum}`,
        sections,
      })
    }
    
    crawledData.weeks.push(week)
  }
  
  return crawledData
}

// Helper: Determine section type from title
function determineSectionType(title: string): string {
  const lowerTitle = title.toLowerCase()
  
  if (lowerTitle.includes('đọc') || lowerTitle.includes('thơ') || lowerTitle.includes('truyện')) {
    return 'Tập đọc'
  }
  if (lowerTitle.includes('luyện từ') || lowerTitle.includes('câu') || lowerTitle.includes('đại từ') || lowerTitle.includes('ngữ pháp')) {
    return 'Luyện từ và câu'
  }
  if (lowerTitle.includes('viết') || lowerTitle.includes('văn') || lowerTitle.includes('dàn ý')) {
    return 'Tập làm văn'
  }
  if (lowerTitle.includes('chính tả') || lowerTitle.includes('tập viết')) {
    return 'Chính tả'
  }
  
  return 'Khác'
}

// Main
async function main() {
  try {
    // Ensure output directory exists
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    
    // Crawl all data
    const data = await crawlAll()
    
    // Save to JSON
    const outputPath = path.join(OUTPUT_DIR, 'tiengviet5-tap1.json')
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ CRAWL COMPLETED!')
    console.log(`📁 Output saved to: ${outputPath}`)
    console.log(`📊 Total weeks: ${data.weeks.length}`)
    console.log(`📚 Total lessons: ${data.weeks.reduce((sum, w) => sum + w.lessons.length, 0)}`)
    console.log(`📄 Total sections: ${data.weeks.reduce((sum, w) => sum + w.lessons.reduce((s, l) => s + l.sections.length, 0), 0)}`)
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

main()
