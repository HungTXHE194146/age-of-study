/**
 * Document Management Service - Client-side service for curriculum documents
 * 
 * Handles:
 * - Uploading documents (PDF/DOCX) with curriculum node mapping
 * - Listing documents by subject/node
 * - Deleting documents
 * - Fetching document details with chunks
 */

import { getSupabaseBrowserClient } from '@/lib/supabase'

export interface DocumentUploadParams {
  file: File
  subjectId: number
  nodeId?: number
  metadata?: {
    title?: string
    author?: string
    description?: string
  }
}

export interface TextUploadParams {
  textContent: string
  subjectId: number
  nodeId?: number
  metadata?: {
    title: string
    chapter?: string
    author?: string
    description?: string
  }
}

export interface Document {
  id: string
  title: string
  file_name: string
  file_type: string
  total_pages: number
  metadata: Record<string, unknown>
  created_at: string
  uploaded_by: string
  subjects?: {
    name: string
    code: string
    grade_level: string | null
  }
  document_chunks?: Array<{ count: number }>
}

export interface DocumentChunk {
  id: string
  chunk_index: number
  content: string
  node_id: number | null
  status: 'pending' | 'confirmed' | 'rejected'
  metadata: Record<string, unknown>
  nodes?: {
    title: string
    node_type: string
    content_label: string | null
  }
}

export interface DocumentDetail extends Document {
  content: string
  chunks: DocumentChunk[]
  totalChunks: number
}

export interface UploadResult {
  success: boolean
  document: {
    id: string
    title: string
    fileName: string
    totalPages: number
    contentLength: number
    chunksCreated: number
  }
  message: string
}

export interface ListResult {
  success: boolean
  documents: Document[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

class DocumentManagementService {
  private supabase = getSupabaseBrowserClient()

  /**
   * Upload a document file (PDF or DOCX) with automatic parsing and chunking
   */
  async uploadDocument(params: DocumentUploadParams): Promise<UploadResult> {
    const { file, subjectId, nodeId, metadata } = params

    // Get auth token
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Phiên đăng nhập hết hạn')
    }

    // Convert file to base64
    const fileContent = await this.fileToBase64(file)

    // Call upload API
    const response = await fetch('/api/curriculum/documents/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileContent,
        subjectId,
        nodeId,
        metadata,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Lỗi upload tài liệu')
    }

    return await response.json()
  }

  /**
   * Upload text content directly (no file parsing needed)
   * For content already extracted from NotebookLM or other sources
   */
  async uploadTextContent(params: TextUploadParams): Promise<UploadResult> {
    const { textContent, subjectId, nodeId, metadata } = params

    // Get auth token
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Phiên đăng nhập hết hạn')
    }

    // Call text upload API
    const response = await fetch('/api/curriculum/documents/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        textContent,
        subjectId,
        nodeId,
        metadata,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Lỗi lưu nội dung văn bản')
    }

    return await response.json()
  }

  /**
   * List documents with filtering and pagination
   */
  async listDocuments(params: {
    subjectId: number
    nodeId?: number
    limit?: number
    offset?: number
  }): Promise<ListResult> {
    const { subjectId, nodeId, limit = 20, offset = 0 } = params

    // Get auth token
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Phiên đăng nhập hết hạn')
    }

    // Build query params
    const queryParams = new URLSearchParams({
      subjectId: subjectId.toString(),
      limit: limit.toString(),
      offset: offset.toString(),
    })
    if (nodeId) {
      queryParams.set('nodeId', nodeId.toString())
    }

    // Call list API
    const response = await fetch(`/api/curriculum/documents?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Lỗi lấy danh sách tài liệu')
    }

    return await response.json()
  }

  /**
   * Get detailed document information with all chunks
   */
  async getDocument(documentId: string): Promise<DocumentDetail> {
    // Get auth token
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Phiên đăng nhập hết hạn')
    }

    // Call get API
    const response = await fetch(`/api/curriculum/documents/${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Lỗi lấy chi tiết tài liệu')
    }

    const result = await response.json()
    return {
      ...result.document,
      chunks: result.chunks,
      totalChunks: result.totalChunks,
    }
  }

  /**
   * Delete a document and all its chunks
   */
  async deleteDocument(documentId: string): Promise<void> {
    // Get auth token
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Phiên đăng nhập hết hạn')
    }

    // Call delete API
    const response = await fetch(`/api/curriculum/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Lỗi xóa tài liệu')
    }
  }

  /**
   * Get documents count by subject
   */
  async getDocumentCount(subjectId: number): Promise<number> {
    const { count } = await this.supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', subjectId)

    return count || 0
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}

// Export singleton instance
export const documentManagementService = new DocumentManagementService()
