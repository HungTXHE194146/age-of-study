"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
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
  Send,
  Award,
  TrendingUp,
  Download,
  BarChart2,
  Calendar,
  User
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getStudentReportData, StudentReportData } from "@/lib/analyticsService";

export default function StudentLogPage() {
  const { classId, studentId } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  // States for report data
  const [reportData, setReportData] = useState<StudentReportData | null>(null);
  const [oldData, setOldData] = useState<any>(null); // Keeping old data structure for timeline
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI States
  const [showEncourage, setShowEncourage] = useState(false);
  const [activeTab, setActiveTab] = useState<'log' | 'report'>('report');

  // Pagination States
  const [visibleActivitiesCount, setVisibleActivitiesCount] = useState(5);

  useEffect(() => {
    async function fetchData() {
      if (!studentId || !classId) return;
      try {
        setLoading(true);

        // Fetch new report data
        const reportResult = await getStudentReportData(studentId as string);
        if (reportResult.error) {
          console.error("Report data error:", reportResult.error);
        } else {
          setReportData(reportResult.data);
        }

        // Fetch old activity data (for timeline)
        const res = await fetch(`/api/teacher/students/${studentId}/progress?classId=${classId}`);
        if (res.ok) {
          const json = await res.json();
          setOldData(json);
        }

      } catch (err) {
        setError("Lỗi khi tải dữ liệu học tập.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId, classId]);

  const handleExportPDF = () => {
    alert("Tính năng in học bạ PDF đang được phát triển.");
  };

  if (loading && !reportData) {
    return <Loading message="Đang mở sổ nhật ký..." size="lg" fullScreen />;
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
            <Link href={`/teacher/classes/${classId}`} className="mt-4 inline-block">
              <NotebookButton>Quay Lại</NotebookButton>
            </Link>
          </NotebookCardContent>
        </NotebookCard>
      </div>
    );
  }

  const studentProfile = reportData || (oldData?.profile ? {
    fullName: oldData.profile.full_name,
    username: oldData.profile.username,
    totalXP: oldData.profile.total_xp,
    level: 1,
    avatarUrl: null
  } : null);

  if (!studentProfile) return <div className="p-8">Không tìm thấy dữ liệu học sinh.</div>;

  return (
    <div className="min-h-screen bg-[#f4f4f9] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/teacher/classes/${classId}`}>
            <NotebookButton
              className="flex items-center gap-2 border-2 border-black font-bold hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại DS Lớp
            </NotebookButton>
          </Link>

          <div className="flex gap-2">
            <NotebookButton
              onClick={() => handleExportPDF()}
              className="bg-orange-100 text-orange-900 border-orange-900 hover:bg-orange-200 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              In Học Bạ
            </NotebookButton>
            <NotebookButton
              onClick={() => setShowEncourage(true)}
              className="bg-yellow-100 text-yellow-900 border-yellow-900 hover:bg-yellow-200 flex items-center gap-2"
            >
              <Star className="w-5 h-5" />
              Gửi Lời Khen
            </NotebookButton>
          </div>
        </div>

        {/* Profile Card */}
        <NotebookCard className="mb-8 border-b-4">
          <NotebookCardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-black bg-yellow-100 flex items-center justify-center overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  {studentProfile.avatarUrl ? (
                    <img src={studentProfile.avatarUrl} alt={studentProfile.fullName || ''} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white border-2 border-black rounded-full px-2 py-0.5 font-black text-xs shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                  LV.{reportData?.level || 1}
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-black text-gray-900 mb-1 font-handwritten">
                  {studentProfile.fullName || studentProfile.username}
                </h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-1 text-orange-600 font-black text-sm">
                    <Star className="w-4 h-4 fill-current" />
                    {studentProfile.totalXP?.toLocaleString()} XP
                  </div>
                  {oldData?.profile?.current_streak > 0 && (
                    <div className="flex items-center gap-1 text-red-600 font-black text-sm">
                      <Flame className="w-4 h-4 fill-current" />
                      Streak: {oldData.profile.current_streak}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-lg border-2 border-black">
                <button
                  onClick={() => setActiveTab('report')}
                  className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'report' ? 'bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] border-2 border-black text-blue-900' : 'text-gray-500'}`}
                >
                  Học bạ
                </button>
                <button
                  onClick={() => setActiveTab('log')}
                  className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'log' ? 'bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] border-2 border-black text-blue-900' : 'text-gray-500'}`}
                >
                  Nhật ký
                </button>
              </div>
            </div>
          </NotebookCardContent>
        </NotebookCard>

        {activeTab === 'report' ? (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <NotebookCard className="bg-green-50 border-green-900 border-2">
                <NotebookCardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-600 font-bold uppercase text-xs">Điểm trung bình</p>
                    <Award className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-4xl font-black text-gray-900">{(reportData?.averageTestScore || 0).toFixed(1)}</p>
                  <div className="mt-2 text-xs font-bold text-gray-500">Dựa trên {reportData?.testHistory.length || 0} bài thi</div>
                </NotebookCardContent>
              </NotebookCard>

              <NotebookCard className="bg-blue-50 border-blue-900 border-2">
                <NotebookCardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-600 font-bold uppercase text-xs">Node hoàn thành</p>
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-4xl font-black text-gray-900">{reportData?.completedNodes || 0}/{reportData?.totalNodes || 0}</p>
                  <div className="mt-2 text-xs font-bold text-gray-500">
                    Tiến độ: {reportData?.totalNodes ? ((reportData.completedNodes / reportData.totalNodes) * 100).toFixed(0) : 0}%
                  </div>
                </NotebookCardContent>
              </NotebookCard>

              <NotebookCard className="bg-purple-50 border-purple-900 border-2">
                <NotebookCardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-600 font-bold uppercase text-xs">Cấp độ</p>
                    <BarChart2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-4xl font-black text-gray-900">{reportData?.level || 1}</p>
                  <div className="mt-2 text-xs font-bold text-gray-500">Học sinh {reportData && reportData.averageTestScore >= 8 ? 'Xuất sắc' : 'Tiềm năng'}</div>
                </NotebookCardContent>
              </NotebookCard>
            </div>

            {/* Test History */}
            <NotebookCard className="border-2 border-black">
              <NotebookCardHeader className="bg-gray-100 border-b-2 border-black">
                <NotebookCardTitle className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5" /> Kết quả kiểm tra
                </NotebookCardTitle>
              </NotebookCardHeader>
              <NotebookCardContent>
                <div className="divide-y-2 divide-dashed divide-gray-200">
                  {reportData?.testHistory && reportData.testHistory.length > 0 ? (
                    reportData.testHistory.map((test) => (
                      <div key={test.testId} className="py-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-gray-900">{test.testTitle}</h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500 font-bold">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(test.submittedAt).toLocaleDateString('vi-VN')}</span>
                            <NotebookBadge className="scale-75 origin-left">
                              {test.type === 'homework' ? 'Bài tập' : test.type === 'exam' ? 'Kiểm tra' : 'Luyện tập'}
                            </NotebookBadge>
                          </div>
                        </div>
                        <div className={`text-2xl font-black px-4 py-1 border-2 border-black rounded-lg shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${test.score >= 8 ? 'bg-green-100' : test.score >= 5 ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                          {test.score}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-gray-400 font-bold italic">Chưa có dữ liệu bài thi.</p>
                  )}
                </div>
              </NotebookCardContent>
            </NotebookCard>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline View (Existing) */}
            <div className="lg:col-span-2">
              <NotebookCard className="h-full border-2 border-black">
                <NotebookCardHeader className="bg-green-100 border-b-2 border-black">
                  <NotebookCardTitle className="flex items-center gap-2">
                    <Clock className="w-6 h-6" />
                    Dòng Thời Gian Hoạt Động
                  </NotebookCardTitle>
                </NotebookCardHeader>
                <NotebookCardContent className="pt-6 h-[500px] overflow-y-auto custom-scrollbar">
                  <div className="mt-4 space-y-6">
                    {oldData?.activities?.slice(0, visibleActivitiesCount).map((act: any, idx: number) => (
                      <div key={act.id} className="flex gap-4 relative">
                        {idx !== Math.min(oldData.activities.length, visibleActivitiesCount) - 1 && (
                          <div className="absolute left-6 top-10 bottom-[-24px] w-1 bg-black border-l-2 border-dashed border-gray-400"></div>
                        )}
                        <div className="w-12 h-12 rounded-full border-4 border-black flex items-center justify-center shrink-0 z-10 bg-white">
                          {act.type === 'login' && <ArrowLeft className="w-5 h-5 text-blue-500 rotate-180" />}
                          {act.type === 'study' && <BookOpen className="w-5 h-5 text-purple-500" />}
                          {act.type === 'complete' && <CheckCircle2 className="w-6 h-6 text-green-600" />}
                        </div>
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

                    {oldData?.activities?.length > visibleActivitiesCount && (
                      <div className="pt-4 pb-2 text-center border-t-2 border-dashed border-gray-300">
                        <NotebookButton
                          onClick={() => setVisibleActivitiesCount(prev => prev + 5)}
                          className="bg-white hover:bg-gray-50 text-gray-700 font-bold border-2 border-black rounded-full px-6"
                        >
                          Nạp thêm hoạt động...
                        </NotebookButton>
                      </div>
                    )}
                  </div>
                </NotebookCardContent>
              </NotebookCard>
            </div>

            {/* Progress Map (Existing) */}
            <div className="lg:col-span-1">
              <NotebookCard className="h-full border-2 border-black">
                <NotebookCardHeader className="bg-purple-100 border-b-2 border-black">
                  <NotebookCardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-6 h-6" />
                    Bản Đồ Tiến Độ
                  </NotebookCardTitle>
                </NotebookCardHeader>
                <NotebookCardContent className="pt-6 h-[500px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-3">
                    {oldData?.progress?.map((p: { id: string, title: string, status: string, score: string }) => (
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
        )}

        {/* AI Encouragement Modal */}
        {showEncourage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <NotebookCard className="max-w-xl w-full bg-yellow-50 border-yellow-600 shadow-[8px_8px_0_0_#ca8a04] relative">
              <NotebookCardContent className="pt-8">
                <button
                  onClick={() => setShowEncourage(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold text-xl"
                >
                  ✕
                </button>
                <h3 className="font-bold text-2xl text-yellow-900 mb-6 flex items-center gap-2">
                  <Star className="w-6 h-6" /> Lời Khen Gợi Ý (AI)
                </h3>
                <div className="space-y-4">
                  {[
                    "Tuyệt lắm! Em đã hoàn thành bài tập rất nhanh hôm nay.",
                    "Cô thấy em rất chăm chỉ, giữ vững phong độ nhé!",
                    "Điểm số rất ấn tượng, em là học sinh gương mẫu đấy!"
                  ].map((msg, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="flex-1 bg-white p-4 border-2 border-yellow-600 rounded-lg font-bold text-gray-800 italic">
                        &quot;{msg}&quot;
                      </div>
                      <NotebookButton className="bg-blue-600 text-white border-2 border-black hover:bg-blue-700 px-4">
                        <Send className="w-5 h-5" />
                      </NotebookButton>
                    </div>
                  ))}
                </div>
              </NotebookCardContent>
            </NotebookCard>
          </div>
        )}
      </div>
    </div>
  );
}
