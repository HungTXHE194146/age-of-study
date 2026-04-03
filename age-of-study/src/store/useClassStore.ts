import { create } from 'zustand';
import { getClassDetail } from '@/lib/classService';

interface ClassState {
  classData: any | null;
  loading: boolean;
  error: string | null;
  lastFetchedId: number | null;
  currentFetchToken: number;
  fetchClassData: (classId: number, force?: boolean) => Promise<void>;
  setClassData: (data: any) => void;
  clearCache: () => void;
}

export const useClassStore = create<ClassState>((set, get) => ({
  classData: null,
  loading: false,
  error: null,
  lastFetchedId: null,
  currentFetchToken: 0,
  fetchClassData: async (classId: number, force = false) => {
    // Return early if data is already cached for this classId
    if (!force && get().classData && get().lastFetchedId === classId) {
      return;
    }

    // Create a fetch token to track this request
    const fetchToken = (get().currentFetchToken || 0) + 1;
    set({ loading: true, error: null, currentFetchToken: fetchToken });
    
    try {
      const result = await getClassDetail(classId);
      // Only update state if this is still the latest request
      if (get().currentFetchToken === fetchToken) {
        if (result.error) {
          set({ error: result.error, loading: false });
        } else {
          set({ classData: result.data, lastFetchedId: classId, loading: false });
        }
      }
    } catch (err) {
      // Only update state if this is still the latest request
      if (get().currentFetchToken === fetchToken) {
        set({ 
          error: err instanceof Error ? err.message : 'Lỗi tải dữ liệu lớp học', 
          loading: false 
        });
      }
    }
  },
  setClassData: (data: any) => set({ classData: data, lastFetchedId: data?.id || null }),
  clearCache: () => set({ classData: null, lastFetchedId: null, error: null }),
}));
