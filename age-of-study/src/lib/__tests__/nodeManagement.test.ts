import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNode, NodeData, updateNode } from '../nodeManagement';

// Mock Supabase methods
const mockSingleSelect = vi.fn();
const mockSingleUpdate = vi.fn();

const mockEqSelect = vi.fn().mockReturnValue({ single: mockSingleSelect });
const mockEqUpdate = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingleUpdate }) });

const mockSelect = vi.fn().mockReturnValue({ eq: mockEqSelect });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

const mockInsertSelect = vi.fn();
const mockInsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockInsertSelect }) });

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table) => {
      return {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
      }
    }),
  }))
}));

describe('nodeManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNode', () => {
    it('1. Create Success: should create a node successfully when valid data is provided', async () => {
      const validData: NodeData = {
        id: 0,
        title: 'New Node',
        xp: 100,
        node_type: 'lesson',
        position_x: 0,
        position_y: 0,
      };

      const mockResponse = { data: { ...validData, id: 1 }, error: null };
      mockInsertSelect.mockResolvedValue(mockResponse);

      const result = await createNode(validData);
      
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(1);
    });

    it('2. Create Error (Empty Data): should fail and return error when title is missing', async () => {
      const invalidData = {
        id: 0,
        xp: 100,
        node_type: 'lesson',
        position_x: 0,
        position_y: 0,
      } as NodeData;

      const result = await createNode(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Thiếu thông tin bắt buộc');
    });

    it('3. Duplicate Node: should handle DB error correctly', async () => {
      const validData: NodeData = {
        id: 0,
        title: 'Duplicate Node',
        xp: 100,
        node_type: 'lesson',
        position_x: 0,
        position_y: 0,
      };

      mockInsertSelect.mockResolvedValue({ data: null, error: { message: 'Duplicate constraint' } });

      const result = await createNode(validData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Không thể tạo node: Duplicate constraint');
    });
  });

  describe('updateNode', () => {
    it('4. Update Success: should update a node successfully', async () => {
      const updateData = { title: 'Updated Title' };

      // Mock checking if node exists
      mockSingleSelect.mockResolvedValue({ data: { id: 1 }, error: null });
      // Mock actual update
      mockSingleUpdate.mockResolvedValue({ data: { id: 1, ...updateData }, error: null });

      const result = await updateNode(1, updateData);
      
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Updated Title');
    });
    
    it('5. Update Error (Parent change / Missing Node): should fail if node does not exist', async () => {
      const updateData = { title: 'Updated Title' };

      // Mock node does not exist
      mockSingleSelect.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const result = await updateNode(999, updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('không tồn tại');
    });
  });
});
