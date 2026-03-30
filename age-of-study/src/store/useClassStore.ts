import { create } from 'zustand';
import { getClassDetail } from '@/lib/classService';

interface ClassState {
  classData: any | null;
  loading: boolean;
  error: string | null;
  lastFetchedId: number | null;
  fetchClassData: (classId: number, force?: boolean) => Promise<void>;
  setClassData: (data: any) => void;
  clearCache: () => void;
}

export const useClassStore = create<ClassState>((set, get) => ({
  classData: null,
  loading: false,
  error: null,
  lastFetchedId: null,
  fetchClassData: async (classId: number, force = false) => {
    // Return early if data is already cached for this classId
    if (!force && get().classData && get().lastFetchedId === classId) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const result = await getClassDetail(classId);
      if (result.error) {
        set({ error: result.error, loading: false });
      } else {
        set({ classData: result.data, lastFetchedId: classId, loading: false });
      }
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Lỗi tải dữ liệu lớp học', 
        loading: false 
      });
    }
  },
  setClassData: (data: any) => set({ classData: data, lastFetchedId: data?.id || null }),
  clearCache: () => set({ classData: null, lastFetchedId: null, error: null }),
}));
