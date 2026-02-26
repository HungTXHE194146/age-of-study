-- Migration: Add lesson_sections table for Tiếng Việt 5 content
-- This table stores main content, Q&A pairs, remember sections, and images
-- from the crawled SGK Tiếng Việt 5 (KNTT 2018) data

-- Create enum for section types
DO $$ BEGIN
    CREATE TYPE section_type_enum AS ENUM (
        'reading',        -- Tập đọc (main reading sections)
        'grammar',        -- Luyện từ và câu (grammar/language practice)
        'writing',        -- Tập làm văn (writing practice)
        'comprehension',  -- Câu hỏi hiểu bài (comprehension questions)
        'other'          -- Khác (other sections)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create lesson_sections table
CREATE TABLE IF NOT EXISTS lesson_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id bigint NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    section_type section_type_enum NOT NULL DEFAULT 'other',
    title text NOT NULL,
    content text NOT NULL DEFAULT '',
    qa_pairs jsonb DEFAULT '[]'::jsonb,  -- Array of {question: string, answer: string}
    remember text,                        -- Remember/summary sections (filtered)
    images jsonb DEFAULT '[]'::jsonb,     -- Array of {url: string, alt: string, context: string}
    source_url text,                      -- URL from loigiaihay.com
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for fast queries

-- FTS index for content search (Vietnamese text)
CREATE INDEX IF NOT EXISTS idx_lesson_sections_content_fts 
    ON lesson_sections USING gin(to_tsvector('simple', content));

-- GIN index for Q&A pairs JSONB search
CREATE INDEX IF NOT EXISTS idx_lesson_sections_qa_pairs 
    ON lesson_sections USING gin(qa_pairs);

-- Index for section_type (filtering by type)
CREATE INDEX IF NOT EXISTS idx_lesson_sections_type 
    ON lesson_sections(section_type);

-- Composite index for node_id + type (common query pattern)
-- This index covers leftmost-prefix lookups on node_id, so no separate node_id index is needed
CREATE INDEX IF NOT EXISTS idx_lesson_sections_node_type 
    ON lesson_sections(node_id, section_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lesson_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_lesson_sections_updated_at ON lesson_sections;
CREATE TRIGGER trigger_lesson_sections_updated_at
    BEFORE UPDATE ON lesson_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_sections_updated_at();

-- Add comments for documentation
COMMENT ON TABLE lesson_sections IS 'Stores SGK Tiếng Việt 5 lesson content with Q&A pairs and remember sections';
COMMENT ON COLUMN lesson_sections.qa_pairs IS 'JSONB array of {question: string, answer: string} objects';
COMMENT ON COLUMN lesson_sections.remember IS 'Remember/summary sections from yellow tables (filtered for "Ghi nhớ" or "Nội dung bài đọc")';
COMMENT ON COLUMN lesson_sections.images IS 'JSONB array of {url: string, alt: string, context: string} objects';
COMMENT ON COLUMN lesson_sections.content IS 'Main reading content from "Bài đọc" sections';

-- Grant permissions (adjust based on your RLS policies)
-- For now, allow read access to authenticated users
ALTER TABLE lesson_sections ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read sections (students and teachers)
CREATE POLICY lesson_sections_read_policy ON lesson_sections
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Service role (for import scripts) can do anything
-- This allows our import script to insert data
-- Note: This policy applies when using service_role key
