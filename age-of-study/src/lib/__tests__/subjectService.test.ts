import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubjectService } from '../subjectService';

// Defining mocks directly in vi.mock to avoid hoisting issues
vi.mock('@/lib/supabase', () => {
  const mockOrder = vi.fn();
  const mockSelect = vi.fn(() => ({
    order: mockOrder
  }));
  const mockFrom = vi.fn(() => ({
    select: mockSelect
  }));

  return {
    getSupabaseBrowserClient: vi.fn(() => ({
      from: mockFrom
    })),
    // Exporting for test access
    _mockFrom: mockFrom,
    _mockOrder: mockOrder
  };
});

describe('SubjectService Caching', () => {
  let service: SubjectService;
  let supabaseMock: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    service = new SubjectService();
    // Access the mocked module to get handle on internal mocks
    supabaseMock = await import('@/lib/supabase');
  });

  it('should fetch from database on first call and store in cache', async () => {
    const mockData = [{ id: 1, name: 'Math', code: 'M1' }];
    supabaseMock._mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

    const subjects = await service.getSubjects();

    expect(supabaseMock._mockFrom).toHaveBeenCalledWith('subjects');
    expect(subjects).toEqual(mockData);
    expect(supabaseMock._mockFrom).toHaveBeenCalledTimes(1);
  });

  it('should return data from cache on second call', async () => {
    const mockData = [{ id: 1, name: 'Math', code: 'M1' }];
    supabaseMock._mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

    // First call
    await service.getSubjects();
    
    // Second call
    const subjects = await service.getSubjects();

    // Verify it only called the database once
    expect(supabaseMock._mockFrom).toHaveBeenCalledTimes(1);
    expect(subjects).toEqual(mockData);
  });

  it('should handle errors gracefully and not cache bad results', async () => {
    supabaseMock._mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

    const subjects = await service.getSubjects();

    expect(subjects).toEqual([]);
    expect(supabaseMock._mockFrom).toHaveBeenCalledTimes(1);
    
    // Try again, should attempt another DB fetch since first failed
    supabaseMock._mockOrder.mockResolvedValueOnce({ data: [{ id: 2, name: 'History' }], error: null });
    const retrySubjects = await service.getSubjects();
    
    expect(retrySubjects).toHaveLength(1);
    expect(supabaseMock._mockFrom).toHaveBeenCalledTimes(2);
  });
});
