import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTeacherClasses } from '../classService';

// Mock supabase client
vi.mock('@/lib/supabase', () => {
  const mockSingle = vi.fn();
  const mockIn = vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ data: [], error: null })
  }));
  const mockEqClasses = vi.fn(() => ({
    order: vi.fn(() => ({
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    }))
  }));
  const mockEqAssignments = vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ data: [], error: null })
  }));

  const mockFrom = vi.fn((table) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      };
    }
    if (table === 'class_teachers') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: mockEqAssignments
          }))
        }))
      };
    }
    if (table === 'class_students') {
      return {
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: mockIn
          }))
        }))
      };
    }
    return {
      select: vi.fn(() => ({
        eq: mockEqClasses
      }))
    };
  });

  return {
    getSupabaseBrowserClient: vi.fn(() => ({
      from: mockFrom
    })),
    _mockSingle: mockSingle,
    _mockEqAssignments: mockEqAssignments,
    _mockFrom: mockFrom
  };
});

describe('ClassService Caching (getTeacherClasses)', () => {
  let supabaseMock: any;
  const teacherId = 'teacher-123';

  beforeEach(async () => {
    vi.clearAllMocks();
    supabaseMock = await import('@/lib/supabase');
    
    // Default success mock for profile
    supabaseMock._mockSingle.mockResolvedValue({
      data: { id: teacherId, full_name: 'Teacher Name' },
      error: null
    });
  });

  it('should fetch from database on first call', async () => {
    supabaseMock._mockEqAssignments.mockResolvedValueOnce({
      data: [
        { 
          class_id: 1, 
          is_homeroom: true, 
          class: { id: 1, name: '10A' }, 
          subject: { id: 1, name: 'Math' } 
        }
      ],
      error: null
    });

    const result = await getTeacherClasses(teacherId);

    expect(supabaseMock._mockFrom).toHaveBeenCalledWith('class_teachers');
    expect(result.data?.homeroom_classes).toHaveLength(1);
    expect(supabaseMock._mockFrom).toHaveBeenCalledTimes(3); // profiles, class_teachers, class_students
  });

  it('should return from cache on second call for same teacher within 5 mins', async () => {
    // Already called in previous test? No, beforeEach clears mocks, but the let cache is outside.
    // However, we can just call it twice here.
    
    supabaseMock._mockEqAssignments.mockResolvedValue({
      data: [{ class_id: 1, is_homeroom: true, class: { id: 1 }, subject: { id: 1 } }],
      error: null
    });

    // First call
    await getTeacherClasses(teacherId);
    const callCountAfterFirst = supabaseMock._mockFrom.mock.calls.length;

    // Second call
    const result = await getTeacherClasses(teacherId);

    expect(supabaseMock._mockFrom.mock.calls.length).toBe(callCountAfterFirst);
    expect(result.error).toBeNull();
  });

  it('should fetch again for a different teacher', async () => {
    const teacher2 = 'teacher-456';
    supabaseMock._mockEqAssignments.mockResolvedValue({ data: [], error: null });

    // Try another profile mock for teacher 2
    supabaseMock._mockSingle.mockResolvedValue({
      data: { id: teacher2, full_name: 'Teacher 2' },
      error: null
    });

    await getTeacherClasses(teacher2);
    
    // Should have called DB for teacher2
    expect(supabaseMock._mockFrom).toHaveBeenCalledWith('profiles');
  });
});
