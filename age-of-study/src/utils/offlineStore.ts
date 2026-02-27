export const OFFLINE_STORAGE_KEYS = {
  ATTENDANCE: "offline_attendance",
  STUDENT_NOTES: "offline_student_notes",
  LOW_DATA_MODE: "low_data_mode_enabled",
};

/**
 * Interface cho dữ liệu cần đồng bộ
 */
export interface SyncItem<T> {
  id: string; // Unique ID cho item đồng bộ
  type: "CREATE" | "UPDATE" | "DELETE";
  data: T;
  timestamp: string; // ISO string
  synced: boolean;
}

/**
 * Lưu một mảng các item cần đồng bộ vào Local Storage
 */
export const saveOfflineData = <T>(
  key: string,
  items: SyncItem<T>[]
): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error("Lỗi khi lưu dữ liệu offline:", error);
  }
};

/**
 * Thêm một item mới vào hàng đợi đồng bộ
 */
export const addOfflineItem = <T>(key: string, item: SyncItem<T>): void => {
  if (typeof window === "undefined") return;
  try {
    const existing = getOfflineData<T>(key);
    // Nếu đã tồn tại item cùng id chưa sync, có thể ghi đè (tùy logic: update mới nhất)
    const filtered = existing.filter((i) => i.id !== item.id);
    filtered.push(item);
    saveOfflineData(key, filtered);
  } catch (error) {
    console.error("Lỗi thêm offline item:", error);
  }
};

/**
 * Lấy dữ liệu offline chưa đồng bộ
 */
export const getOfflineData = <T>(key: string): SyncItem<T>[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Lỗi lấy dữ liệu offline:", error);
    return [];
  }
};

/**
 * Đánh dấu một mảng các item là đã đồng bộ xong, hoặc xóa chúng khỏi queue
 */
export const markItemsSynced = <T>(key: string, syncedIds: string[]): void => {
  if (typeof window === "undefined") return;
  try {
    const existing = getOfflineData<T>(key);
    const remaining = existing.filter((i) => !syncedIds.includes(i.id));
    saveOfflineData(key, remaining);
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái sync:", error);
  }
};

/**
 * Xóa toàn bộ dữ liệu của một key
 */
export const clearOfflineData = (key: string): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
};

// --- Low Data Mode Utils ---
export const isLowDataModeEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(OFFLINE_STORAGE_KEYS.LOW_DATA_MODE) === "true";
};

export const setLowDataMode = (enabled: boolean): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    OFFLINE_STORAGE_KEYS.LOW_DATA_MODE,
    enabled ? "true" : "false"
  );
};
