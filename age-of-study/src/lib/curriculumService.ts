/**
 * Curriculum Service - Client-side service for curriculum tree operations
 * 
 * Handles:
 * - Fetching hierarchical curriculum tree for subjects
 * - Node navigation and selection
 * - Filtering nodes by type, week, etc.
 */

import { getSupabaseBrowserClient } from '@/lib/supabase'

export interface CurriculumNode {
  id: number
  title: string
  node_type: 'subject' | 'chapter' | 'week' | 'lesson' | 'content'
  parent_node_id: number | null
  subject_id: number
  week_number: number | null
  lesson_number: number | null
  content_label: string | null
  order_index: number
  page_start: number | null
  page_end: number | null
  description: string | null
  volume_number: number | null
  children?: CurriculumNode[]
}

export interface CurriculumTree {
  subjectId: number
  subjectName: string
  nodes: CurriculumNode[]
}

class CurriculumService {
  private supabase = getSupabaseBrowserClient()
  private cache = new Map<number, CurriculumNode[]>()

  /**
   * Fetch the full curriculum tree for a subject.
   * Returns a flat list that can be assembled into a tree on the client.
   */
  async getCurriculumTree(subjectId: number, volumeNumber?: number): Promise<CurriculumNode[]> {
    // Check cache first
    const cacheKey = volumeNumber ? subjectId * 10 + volumeNumber : subjectId
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    try {
      let query = this.supabase
        .from('nodes')
        .select('id, title, node_type, parent_node_id, subject_id, week_number, lesson_number, content_label, order_index, page_start, page_end, description, volume_number')
        .eq('subject_id', subjectId)

      if (volumeNumber) {
        query = query.eq('node_type', 'lesson').eq('volume_number', volumeNumber)
      }

      const { data, error } = await query.order('order_index', { ascending: true })

      if (error) {
        console.error('Error fetching curriculum tree:', error)
        throw error
      }

      const nodes = (data || []) as CurriculumNode[]
      this.cache.set(cacheKey, nodes)
      return nodes
    } catch (error) {
      console.error('Failed to fetch curriculum tree:', error)
      return []
    }
  }

  /**
   * Build a hierarchical tree from a flat list of nodes.
   * Returns only root nodes (parent_node_id = null) with children nested.
   */
  buildTree(flatNodes: CurriculumNode[]): CurriculumNode[] {
    const nodeMap = new Map<number, CurriculumNode>()
    const roots: CurriculumNode[] = []

    // First pass: create map with empty children
    for (const node of flatNodes) {
      nodeMap.set(node.id, { ...node, children: [] })
    }

    // Second pass: link children to parents
    for (const node of flatNodes) {
      const mappedNode = nodeMap.get(node.id)!
      if (node.parent_node_id && nodeMap.has(node.parent_node_id)) {
        nodeMap.get(node.parent_node_id)!.children!.push(mappedNode)
      } else {
        roots.push(mappedNode)
      }
    }

    // Sort children by order_index
    const sortChildren = (nodes: CurriculumNode[]) => {
      nodes.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          sortChildren(node.children)
        }
      }
    }

    sortChildren(roots)
    return roots
  }

  /**
   * Get only lesson-level nodes for a subject (for question/test assignment).
   */
  async getLessonNodes(subjectId: number): Promise<CurriculumNode[]> {
    const allNodes = await this.getCurriculumTree(subjectId)
    return allNodes.filter(n => n.node_type === 'lesson' || n.node_type === 'content')
  }

  /**
   * Get the breadcrumb path from root to a specific node.
   * Returns array like: ["Toán 5", "Chương 2: Số thập phân", "Bài 12: So sánh..."]
   */
  getBreadcrumb(flatNodes: CurriculumNode[], nodeId: number): string[] {
    const nodeMap = new Map<number, CurriculumNode>()
    for (const node of flatNodes) {
      nodeMap.set(node.id, node)
    }

    const path: string[] = []
    let current = nodeMap.get(nodeId)
    while (current) {
      path.unshift(current.title)
      current = current.parent_node_id ? nodeMap.get(current.parent_node_id) : undefined
    }
    return path
  }

  /**
   * Get all descendant leaf node IDs for a given parent node.
   * Used for scoping queries when a chapter is selected.
   */
  getDescendantLeafIds(flatNodes: CurriculumNode[], parentId: number): number[] {
    const children = flatNodes.filter(n => n.parent_node_id === parentId)
    if (children.length === 0) return [parentId]

    const leafIds: number[] = []
    for (const child of children) {
      leafIds.push(...this.getDescendantLeafIds(flatNodes, child.id))
    }
    return leafIds
  }

  /**
   * Get all descendant node IDs (including non-leaf) for a given parent.
   */
  getAllDescendantIds(flatNodes: CurriculumNode[], parentId: number): number[] {
    const ids: number[] = [parentId]
    const children = flatNodes.filter(n => n.parent_node_id === parentId)
    for (const child of children) {
      ids.push(...this.getAllDescendantIds(flatNodes, child.id))
    }
    return ids
  }

  /**
   * Clear the cache (call after curriculum updates).
   */
  clearCache() {
    this.cache.clear()
  }
}

export const curriculumService = new CurriculumService()
