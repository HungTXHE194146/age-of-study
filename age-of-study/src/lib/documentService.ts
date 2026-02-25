/**
 * Document Service - Client-side service for document management
 * 
 * Handles:
 * - Uploading documents with AI smart chunking
 * - Reviewing and confirming chunk mappings
 * - Listing documents by subject
 */

import { getSupabaseBrowserClient } from '@/lib/supabase'

export interface DocumentChunk {
  chunk_index: number
  content: string
  suggested_node_id: number | null
  suggested_node_title: string | null
  confidence: number
}

export interface DocumentUploadResponse {
  documentId: string
  title: string
  totalChunks: number
  chunks: DocumentChunk[]
  message: string
}

export interface DocumentInfo {
  id: string
  title: string
  subject_id: number
  teacher_id: string
  created_at: string
  file_url: string | null
  chunks: {
    total: number
    confirmed: number
    pending: number
  }
}

export interface ChunkDetail {
  id: string
  document_id: string
  node_id: number | null
  chunk_index: number
  content: string
  metadata: Record<string, unknown>
  status: 'pending' | 'confirmed' | 'rejected'
  created_at: string
  nodes: {
    id: number
    title: string
    node_type: string
    lesson_number: number | null
    week_number: number | null
    content_label: string | null
  } | null
}

class DocumentService {
  private supabase = getSupabaseBrowserClient()

  /**
   * Upload a document and get AI-chunked preview.
   * The text content should be pre-extracted on the client (using pdf.js or mammoth).
   */
  async uploadDocument(
    title: string,
    subjectId: number,
    content: string,
    fileUrl?: string
  ): Promise<DocumentUploadResponse> {
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Bạn cần đăng nhập để tải tài liệu')
    }

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ title, subjectId, content, fileUrl }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Lỗi tải tài liệu')
    }

    return response.json()
  }

  /**
   * Confirm or reject chunk mappings after admin review.
   */
  async confirmChunks(
    documentId: string,
    chunks: Array<{
      chunk_id: string
      node_id: number | null
      status: 'confirmed' | 'rejected'
    }>
  ): Promise<{ confirmedCount: number; rejectedCount: number }> {
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Bạn cần đăng nhập')
    }

    const response = await fetch('/api/documents/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ documentId, chunks }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Lỗi xác nhận tài liệu')
    }

    return response.json()
  }

  /**
   * Get chunks for a specific document (for review UI).
   */
  async getDocumentChunks(documentId: string): Promise<ChunkDetail[]> {
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Bạn cần đăng nhập')
    }

    const response = await fetch(`/api/documents/confirm?documentId=${documentId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Lỗi tải dữ liệu')
    }

    const data = await response.json()
    return data.chunks || []
  }

  /**
   * Get all documents for a subject with chunk counts.
   */
  async getDocumentsBySubject(subjectId: number): Promise<DocumentInfo[]> {
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Bạn cần đăng nhập')
    }

    const response = await fetch(`/api/documents/confirm?subjectId=${subjectId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Lỗi tải dữ liệu')
    }

    const data = await response.json()
    return data.documents || []
  }

  /**
   * Delete a document and its chunks.
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // Delete chunks first (cascading should handle this, but be safe)
      await this.supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', documentId)

      const { error } = await this.supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      return !error
    } catch (error) {
      console.error('Error deleting document:', error)
      return false
    }
  }
}

export const documentService = new DocumentService()
