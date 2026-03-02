"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import Loading from "@/components/ui/loading";
import {
  NotebookCard,
  NotebookCardHeader,
  NotebookCardTitle,
  NotebookCardContent,
  NotebookBadge,
  NotebookButton,
} from "@/components/ui/notebook-card";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  BookOpen,
  CalendarDays,
  Flame,
  Star,
  CheckCircle2,
  Send
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Dữ liệu sẽ được fetch trực tiếp từ API

export default function StudentLogPage() {
  const { classId, studentId } = useParams();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI States
  const [showEncourage, setShowEncourage] = useState(false);

  // Pagination States
  const [visibleActivitiesCount, setVisibleActivitiesCount] = useState(5);
  const [visibleProgressCount, setVisibleProgressCount] = useState(6);

  useEffect(() => {
    async function fetchData() {
      if (!studentId || !classId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/teacher/students/${studentId}/progress?classId=${classId}`);
        if (!res.ok) throw new Error("API Lỗi");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError("Lỗi khi tải nhật ký học tập.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId, classId]);

  // Check absent over 3 days (ignore if they just registered and never studied, optional but good UX)
  const isDangerAbsent = data?.profile?.last_study_date
    ? Math.ceil(Math.abs(new Date().getTime() - new Date(data.profile.last_study_date).getTime()) / (1000 * 60 * 60 * 24)) >= 3
    : false; // Nếu chưa có last_study_date thì chưa từng học -> không báo đỏ nghỉ học

  if (loading && !data) {
    return <Loading message="Đang mở sổ nhật ký..." size="lg" fullScreen />;
  }

  if (error || !data) {
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
            <Link href={`/teacher/classes/${classId}`} className="mt-4 inline-block">
              <Button>Quay Lại</Button>
            </Link>
          </NotebookCardContent>
        </NotebookCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f9] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/teacher/classes/${classId}`}>
            <NotebookButton
              className="flex items-center gap-2 border-2 border-black font-bold text-lg hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại DS Lớp
            </NotebookButton>
          </Link>

          <NotebookButton
            onClick={() => setShowEncourage(true)}
            className="bg-yellow-100 text-yellow-900 border-yellow-900 hover:bg-yellow-200 flex items-center gap-2"
          >
            <Star className="w-5 h-5" />
            Gửi Lời Khen
          </NotebookButton>
        </div>

        {/* Student Highlight Banner */}
        <NotebookCard className={`mb-6 border-4 ${isDangerAbsent ? 'border-red-600' : 'border-blue-900'}`}>
          <div className={`p-6 border-b-4 border-dashed ${isDangerAbsent ? 'bg-red-50 border-red-600' : 'bg-blue-50 border-blue-900'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
            <div>
              <h1 className="text-4xl font-black uppercase text-gray-900 mb-1">
                {data.profile.full_name}
              </h1>
              <div className="flex items-center gap-3">
                <NotebookBadge variant="default" className="text-sm py-0">
                  {data.profile.username}
                </NotebookBadge>
                {isDangerAbsent && (
                  <NotebookBadge variant="danger" className="text-sm py-0 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Nghỉ quá 3 ngày
                  </NotebookBadge>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-center font-bold">
                <div className="text-gray-500 text-sm">Tổng Điểm</div>
                <div className="text-3xl text-green-600">{data.profile.total_xp}</div>
              </div>
              <div className="text-center font-bold border-l-4 border-black pl-4">
                <div className="text-gray-500 text-sm">Chăm chỉ</div>
                <div className="text-3xl text-orange-500 flex items-center justify-center gap-1">
                  <Flame className="w-6 h-6" /> {data.profile.current_streak}
                </div>
              </div>
            </div>
          </div>
        </NotebookCard>

        {/* Auto Encouragement Box */}
        {showEncourage && (
          <NotebookCard className="mb-6 bg-yellow-50 border-yellow-600 shadow-[4px_4px_0_0_#ca8a04]">
            <NotebookCardContent className="pt-6 relative">
              <button
                onClick={() => setShowEncourage(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold text-xl"
              >
                ✕
              </button>
              <h3 className="font-bold text-2xl text-yellow-900 mb-4 flex items-center gap-2">
                <Star className="w-6 h-6" /> Lời Khen Gợi Ý (AI)
              </h3>
              <div className="space-y-3">
                {[
                  "Tuyệt lắm! Em đã hoàn thành bài 'Phép cộng' rất nhanh hôm nay.",
                  "Cô thấy em rất chăm chỉ, giữ vững chuỗi 5 ngày học nhé!",
                  "Điểm 10/10 bài tập hôm nay, em làm tốt lắm!"
                ].map((msg, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="flex-1 bg-white p-3 border-2 border-yellow-600 rounded-lg font-medium text-lg text-gray-800">
                      &quot;{msg}&quot;
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 h-auto p-4 flex flex-col items-center justify-center border-2 border-black rounded-lg">
                      <Send className="w-5 h-5 text-white" />
                    </Button>
                  </div>
                ))}
              </div>
            </NotebookCardContent>
          </NotebookCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Timeline View */}
          <div className="lg:col-span-2">
            <NotebookCard className="h-full">
              <NotebookCardHeader className="bg-green-100">
                <NotebookCardTitle className="flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  Dòng Thời Gian Hoạt Động
                </NotebookCardTitle>
              </NotebookCardHeader>
              <NotebookCardContent className="pt-6 h-[500px] overflow-y-auto custom-scrollbar">
                <div className="mt-4 space-y-6">
                  {data.activities.slice(0, visibleActivitiesCount).map((act: any, idx: number) => (
                    <div key={act.id} className="flex gap-4 relative">
                      {/* Timeline line */}
                      {idx !== Math.min(data.activities.length, visibleActivitiesCount) - 1 && (
                        <div className="absolute left-6 top-10 bottom-[-24px] w-1 bg-black border-l-2 border-dashed border-gray-400"></div>
                      )}

                      {/* Icon */}
                      <div className="w-12 h-12 rounded-full border-4 border-black flex items-center justify-center shrink-0 z-10 bg-white">
                        {act.type === 'login' && <ArrowLeft className="w-5 h-5 text-blue-500 rotate-180" />}
                        {act.type === 'study' && <BookOpen className="w-5 h-5 text-purple-500" />}
                        {act.type === 'complete' && <CheckCircle2 className="w-6 h-6 text-green-600" />}
                      </div>

                      {/* Content */}
                      <div className="pt-1 pb-4">
                        <div className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-1">
                          {act.time}
                        </div>
                        <div className="font-medium text-xl text-gray-900 bg-white inline-block px-3 py-1 border-2 border-black rounded-lg">
                          {act.desc}
                        </div>
                      </div>
                    </div>
                  ))}

                  {data.activities.length > visibleActivitiesCount && (
                    <div className="pt-4 pb-2 text-center border-t-2 border-dashed border-gray-300">
                      <Button
                        variant="outline"
                        onClick={() => setVisibleActivitiesCount(prev => prev + 5)}
                        className="bg-white hover:bg-gray-50 text-gray-700 font-bold border-2 border-black rounded-full px-6"
                      >
                        Nạp thêm hoạt động...
                      </Button>
                    </div>
                  )}
                </div>
              </NotebookCardContent>
            </NotebookCard>
          </div>

          {/* Compact Skill Tree View */}
          <div className="lg:col-span-1">
            <NotebookCard className="h-full">
              <NotebookCardHeader className="bg-purple-100">
                <NotebookCardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-6 h-6" />
                  Bản Đồ Tiến Độ
                </NotebookCardTitle>
              </NotebookCardHeader>
              <NotebookCardContent className="pt-6 h-[500px] overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  {data.progress.map((p: { id: string, title: string, status: string, score: string }) => (
                    <div
                      key={p.id}
                      className={`p-3 border-2 border-black rounded-lg flex items-center justify-between ${p.status === 'completed' ? 'bg-green-50/50' :
                        p.status === 'in_progress' ? 'bg-yellow-50' : 'bg-gray-100 opacity-70'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {p.status === 'completed' ? (
                          <div className="w-6 h-6 bg-green-500 border-2 border-black text-white flex items-center justify-center rounded-sm font-bold text-xs">✓</div>
                        ) : p.status === 'in_progress' ? (
                          <div className="w-6 h-6 bg-yellow-400 border-2 border-black text-black flex items-center justify-center rounded-sm font-bold text-xs">...</div>
                        ) : (
                          <div className="w-6 h-6 bg-white border-2 border-black text-white flex items-center justify-center rounded-sm"></div>
                        )}
                        <span className={`font-bold ${p.status === 'not_started' ? 'text-gray-500' : 'text-gray-900'}`}>
                          {p.title}
                        </span>
                      </div>
                      <span className="font-black text-gray-700 text-sm">
                        {p.score}
                      </span>
                    </div>
                  ))}


                </div>
              </NotebookCardContent>
            </NotebookCard>
          </div>
        </div>
      </div>
    </div>
  );
}
