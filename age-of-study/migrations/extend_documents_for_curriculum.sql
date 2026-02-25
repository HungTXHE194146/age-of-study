    -- ============================================================================
    -- EXTEND DOCUMENTS TABLE FOR CURRICULUM IMPORT
    -- Migration: extend_documents_for_curriculum.sql
    -- Purpose: Add fields needed for automated textbook import via Gemini API
    -- ============================================================================

    -- Add new columns for curriculum documents
    ALTER TABLE public.documents 
    ADD COLUMN IF NOT EXISTS file_name text,
    ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'pdf',
    ADD COLUMN IF NOT EXISTS total_pages integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'processing', 'error'));

    -- Make teacher_id nullable for system-generated imports (Gemini automated extraction)
    -- Original schema had teacher_id NOT NULL because documents were uploaded by teachers.
    -- Now we also have system imports (no teacher), so make it optional.
    ALTER TABLE public.documents 
    ALTER COLUMN teacher_id DROP NOT NULL;

    -- Add index for filtering by file_type and status
    CREATE INDEX IF NOT EXISTS idx_documents_file_type ON public.documents(file_type);
    CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

    -- Add GIN index for metadata JSONB queries (to search by chapter, lesson, etc.)
    CREATE INDEX IF NOT EXISTS idx_documents_metadata ON public.documents USING gin(metadata);

    -- Update RLS policies to allow system inserts (for automated imports)
    -- Original policies only allowed teachers to insert if teacher_id = auth.uid()
    -- Now we need to allow system role (service_role) to insert curriculum documents

    -- Drop old restrictive INSERT policy
    DROP POLICY IF EXISTS "Teachers can insert own documents" ON public.documents;

    -- Replace with new policy that allows teachers to insert their own documents
    -- Service role bypasses RLS so no need to check for it here
    CREATE POLICY "Teachers and system can insert documents" ON public.documents
    FOR INSERT TO authenticated
    WITH CHECK (
        teacher_id = auth.uid()           -- Teachers can only insert with their own ID
    );

    -- Update SELECT policy to allow viewing system documents (teacher_id = NULL)
    DROP POLICY IF EXISTS "Teachers can view own documents" ON public.documents;
    DROP POLICY IF EXISTS "Students can view documents" ON public.documents;

    -- New unified SELECT policy
    -- Teachers can view their own, everyone can view system/curriculum documents
    -- TODO: Add proper student-teacher relationship check when student assignments are available
    CREATE POLICY "Users can view documents" ON public.documents
    FOR SELECT TO authenticated
    USING (
        teacher_id = auth.uid()           -- Teachers can view their own
        OR teacher_id IS NULL             -- Anyone can view system/curriculum documents
    );

    -- Update other policies to handle NULL teacher_id
    DROP POLICY IF EXISTS "Teachers can update own documents" ON public.documents;
    CREATE POLICY "Teachers and system can update documents" ON public.documents
    FOR UPDATE TO authenticated
    USING (
        teacher_id = auth.uid()           -- Can only update own documents
    )
    WITH CHECK (
        teacher_id = auth.uid()           -- Cannot change to NULL or another teacher
    );

    DROP POLICY IF EXISTS "Teachers can delete own documents" ON public.documents;
    CREATE POLICY "Teachers and system can delete documents" ON public.documents
    FOR DELETE TO authenticated
    USING (
        teacher_id = auth.uid()           -- Can only delete own documents
    );

    -- Add comment to explain the schema evolution
    COMMENT ON TABLE public.documents IS 
    'Stores both teacher-uploaded documents (teacher_id NOT NULL) and system-imported curriculum materials (teacher_id NULL). Used for RAG knowledge base in AI chatbot.';

    COMMENT ON COLUMN public.documents.file_name IS 
    'Original filename or generated name for curriculum imports (e.g., "lesson-1-thanh-am-cua-gio.json")';

    COMMENT ON COLUMN public.documents.file_type IS 
    'File type: pdf, docx, json, etc. Used for filtering and display in admin UI.';

    COMMENT ON COLUMN public.documents.total_pages IS 
    'Number of pages in original document. For curriculum imports, this is the chunk size (typically 10 pages).';

    COMMENT ON COLUMN public.documents.metadata IS 
    'JSONB storage for structured data extracted from curriculum materials: {chapter, sections, vocabulary, imageDescriptions, etc.}';

    COMMENT ON COLUMN public.documents.status IS 
    'Processing status: confirmed (ready to use), pending (uploaded but not processed), processing (extraction in progress), error (failed)';
