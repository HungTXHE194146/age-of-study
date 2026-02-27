"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getClassDetail } from "@/lib/classService";
import { Button } from "@/components/ui/button";
import {
  NotebookCard,
  NotebookCardHeader,
  NotebookCardTitle,
  NotebookCardContent,
  NotebookButton,
  NotebookBadge,
} from "@/components/ui/notebook-card";
import { Switch } from "@/components/ui/switch";
import Loading from "@/components/ui/loading";
import {
  Users,
  AlertCircle,
  ArrowLeft,
  WifiOff,
  CloudUpload,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Virtuoso } from "react-virtuoso";
import {
  saveOfflineData,
  getOfflineData,
  SyncItem,
} from "@/utils/offlineStore";

import type { ClassDetail } from "@/types/class";

export default function AttendancePage() {
  const { classId } = useParams();
  const { user } = useAuthStore();
  const [classData, setClassData] = useState<ClassDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for attendance
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>(
    {},
  );
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Setup offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!classId || !user?.id) return;

      try {
        setLoading(true);

        // Fetch class detail
        const classResult = await getClassDetail(Number(classId));
        if (classResult.error || !classResult.data) {
          setError(classResult.error || "Không thể tải dữ liệu lớp");
          return;
        }

        setClassData(classResult.data);

        // Khởi tạo tất cả là Có mặt (true) nếu chưa có data lưu
        const initialMap: Record<string, boolean> = {};
        const today = new Date().toISOString().split("T")[0];

        // Lấy dữ liệu offline nếu có
        const offlineData = getOfflineData<any>("offline_attendance");
        const todayOffline = offlineData.filter((i) =>
          i.timestamp.startsWith(today),
        );

        setPendingSync(todayOffline.length);

        classResult.data.students.forEach((s) => {
          // Xem trong offline sync queue có học sinh này không
          const inQueue = todayOffline.find((q) => q.data.id === s.student_id);
          if (inQueue) {
            initialMap[s.student_id] = inQueue.data.present;
          } else {
            // Mặc định đi học
            initialMap[s.student_id] = true;
          }
        });

        setAttendanceMap(initialMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [classId, user?.id]);

  const handleToggleAttendance = (studentId: string, present: boolean) => {
    const newMap = { ...attendanceMap, [studentId]: present };
    setAttendanceMap(newMap);

    // Save to sync queue
    const todayStr = new Date().toISOString();
    const item: SyncItem<any> = {
      id: `${classId}_${studentId}_${todayStr.split("T")[0]}`,
      type: "UPDATE",
      data: { classId, id: studentId, present, date: todayStr },
      timestamp: todayStr,
      synced: false,
    };

    const currentOfflines = getOfflineData<any>("offline_attendance");
    // Lọc bỏ record cũ của hs này trong ngày hôm nay
    const filtered = currentOfflines.filter(
      (i) => i.id !== item.id && !i.synced,
    );
    filtered.push(item);
    saveOfflineData("offline_attendance", filtered);
    setPendingSync(filtered.length);
  };

  const handleSync = async () => {
    if (isOffline) {
      alert("Bạn đang ngoại tuyến. Vui lòng kết nối mạng để đồng bộ.");
      return;
    }

    try {
      // Mock sync process
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Mark all as synced
      saveOfflineData("offline_attendance", []);
      setPendingSync(0);
      alert("Đồng bộ thành công!");
    } catch (e) {
      alert("Lỗi đồng bộ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!classData?.students) return [];
    if (!searchTerm) return classData.students;
    const lower = searchTerm.toLowerCase();
    return classData.students.filter(
      (s) =>
        s.profile.full_name?.toLowerCase().includes(lower) ||
        s.profile.username?.toLowerCase().includes(lower),
    );
  }, [classData?.students, searchTerm]);

  // Giả lập vắng mặt quá tuần do thiếu property last_study_date ở DB profile hiện tại
  const isDangerAbsent = () => {
    return false;
  };

  if (loading && !classData) {
    return <Loading message="Đang tải danh sách..." size="lg" fullScreen />;
  }

  if (error) {
    return (
      <div className="p-8">
        <NotebookCard className="max-w-xl mx-auto border-red-900 border-4">
          <NotebookCardHeader className="bg-red-100 border-red-900">
            <AlertCircle className="w-10 h-10 text-red-600 mb-2" />
            <NotebookCardTitle className="text-red-900">
              Lỗi Tải Dữ Liệu
            </NotebookCardTitle>
          </NotebookCardHeader>
          <NotebookCardContent>
            <p className="mt-4 font-bold text-xl">{error}</p>
          </NotebookCardContent>
        </NotebookCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f9] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/teacher/classes/${classId}`}>
            <Button
              variant="outline"
              size="lg"
              className="flex items-center gap-2 border-2 border-black font-bold text-lg hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại Sổ Lớp
            </Button>
          </Link>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              {isOffline ? (
                <NotebookBadge
                  variant="danger"
                  className="flex items-center gap-1"
                >
                  <WifiOff className="w-4 h-4" /> Mất Mạng
                </NotebookBadge>
              ) : (
                <NotebookBadge
                  variant="success"
                  className="flex items-center gap-1"
                >
                  Có Mạng
                </NotebookBadge>
              )}
            </div>
            {pendingSync > 0 && (
              <span className="text-sm font-bold text-red-600">
                Chưa đồng bộ: {pendingSync} hs
              </span>
            )}
          </div>
        </div>

        <NotebookCard className="mb-6">
          <NotebookCardHeader>
            <div className="flex justify-between items-center">
              <div>
                <NotebookCardTitle>Điểm Danh Lớp: {classData?.name}</NotebookCardTitle>
                <div className="text-lg font-bold mt-2">
                  Sĩ số: {classData?.students.length} học sinh
                </div>
              </div>
              <div>
                <NotebookButton
                  onClick={handleSync}
                  disabled={isOffline || pendingSync === 0}
                  className="bg-green-300 flex items-center gap-2"
                >
                  <CloudUpload className="w-6 h-6" />
                  Đồng Bộ Lên Mạng
                </NotebookButton>
              </div>
            </div>
          </NotebookCardHeader>

          <NotebookCardContent className="pt-6">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-6 h-6" />
              <input
                className="w-full border-4 border-black rounded-lg py-4 pl-14 pr-4 font-bold text-xl focus:outline-none focus:ring-4 focus:ring-blue-300"
                placeholder="Tìm tên học sinh nhanh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="bg-white border-2 border-black rounded-lg overflow-hidden h-[600px]">
              {/* Virtualized List for performance on low-end devices */}
              <Virtuoso
                data={filteredStudents}
                totalCount={filteredStudents.length}
                itemContent={(index, student) => {
                  const isPresent = attendanceMap[student.student_id] ?? true;
                  const danger = isDangerAbsent();

                  return (
                    <div
                      key={student.student_id}
                      className="border-b-2 border-dashed border-gray-300 p-4 flex items-center justify-between hover:bg-yellow-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-2xl">
                            {index + 1}. {student.profile.full_name || student.profile.username}
                          </span>
                          {danger && (
                            <NotebookBadge variant="danger" className="text-xs py-0">
                              Lâu không học
                            </NotebookBadge>
                          )}
                        </div>
                        <div className="text-gray-600 font-medium mt-1">
                          Đăng nhập lần cuối:{" "}
                          Chưa có tích hợp DB
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`font-bold text-xl ${
                            isPresent ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isPresent ? "CÓ MẶT" : "VẮNG MẶT"}
                        </span>
                          <Switch
                          checked={isPresent}
                          onCheckedChange={(val: boolean) =>
                            handleToggleAttendance(student.student_id, val)
                          }
                          className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600 scale-125 mr-2"
                        />
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          </NotebookCardContent>
        </NotebookCard>
      </div>
    </div>
  );
}
