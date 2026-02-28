"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RouteProtectedWrapper } from "@/lib/routeMiddleware";
import {
  ChevronDown,
  ChevronUp,
  Target,
  Award,
  Book,
  Sparkles,
  Compass,
  PlusCircle,
  Settings,
} from "lucide-react";
import { subjectService } from "@/lib/subjectService";
import { Subject } from "@/types/teacher";
import VisualSkillTree from "@/components/VisualSkillTree";
import { fetchSubjectSkillTree } from "@/lib/gradeSkillTreeService";
import Loading from "@/components/ui/loading";
import { getStudentNodeStats, StudentNodeStats } from "@/lib/nodeStatsService";
import { useAuthStore } from "@/store/useAuthStore";
import { TestService } from "@/lib/testService";
import {
  NotebookCard,
  NotebookCardHeader,
  NotebookCardTitle,
  NotebookCardContent,
  NotebookButton,
  NotebookBadge
} from "@/components/ui/notebook-card";

export default function StudentSkillTreePage() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isSubjectSelectorOpen, setIsSubjectSelectorOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [nodeStats, setNodeStats] = useState<StudentNodeStats | null>(null);
  const [nodeStatsLoading, setNodeStatsLoading] = useState(false);
  const [subjectNodes, setSubjectNodes] = useState<{ id: number; title: string; node_type: string; parent_node_id?: number | null; position_x?: number; position_y?: number; order_index: number }[] | null>(null);
  const [completedNodeIds, setCompletedNodeIds] = useState<number[]>([]);

  const router = useRouter();
  const { user } = useAuthStore();
  const testService = new TestService();

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsSubjectSelectorOpen(false);
    setSelectedNodeId(null);
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const allSubjects = await subjectService.getSubjects();
        setSubjects(allSubjects);

        if (allSubjects.length > 0) {
          setSelectedSubject(allSubjects[0]);
        }
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // Fetch subject nodes and completion status
  useEffect(() => {
    const fetchData = async () => {
      if (selectedSubject && user?.id) {
        setSubjectNodes(null);
        try {
          // Fetch nodes
          const { nodes } = await fetchSubjectSkillTree(selectedSubject.id);
          setSubjectNodes(nodes || []);

          // Fetch completed nodes
          const completedIds = await testService.getCompletedNodeIds(user.id);
          setCompletedNodeIds(completedIds);
        } catch (error) {
          console.error("Failed to fetch subject data:", error);
          setSubjectNodes([]);
        }
      }
    };

    fetchData();
  }, [selectedSubject, user?.id]);

  // Fetch student node stats when a node is selected
  useEffect(() => {
    const fetchStats = async () => {
      if (selectedNodeId && user?.id) {
        setNodeStatsLoading(true);
        try {
          const stats = await getStudentNodeStats(selectedNodeId, user.id);
          setNodeStats(stats);
        } catch (error) {
          console.error("Failed to fetch node stats:", error);
          setNodeStats(null);
        } finally {
          setNodeStatsLoading(false);
        }
      } else {
        setNodeStats(null);
      }
    };

    fetchStats();
  }, [selectedNodeId, user?.id]);

  const handleStartLesson = () => {
    if (!nodeStats?.tests || nodeStats.tests.length === 0) {
      alert("Bài học này hiện chưa có bài luyện tập nào!");
      return;
    }

    // The service already filters for published tests
    const publishedTests = nodeStats.tests;


    if (publishedTests.length === 0) {
      alert("Bài học này hiện chưa có bài luyện tập nào được công khai!");
      return;
    }

    // Pick a random test
    const randomIndex = Math.floor(Math.random() * publishedTests.length);
    const selectedTest = publishedTests[randomIndex];

    router.push(`/student/learn/tests/${selectedTest.id}`);
  };

  const selectedNodeData = subjectNodes?.find(n => n.id === selectedNodeId);

  return (
    <RouteProtectedWrapper>
      <div className="flex flex-col h-screen bg-[#fdfbf7] font-sans text-slate-900 overflow-hidden notebook-paper-bg">
        {/* --- TOPBAR: NOTEBOOK STYLE --- */}
        <div className="relative z-20 w-full h-20 bg-white/80 backdrop-blur-md border-b-4 border-black flex items-center justify-between px-6 shrink-0 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 border-2 border-black rounded-lg flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <Compass className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-black tracking-tight font-handwritten">
                SỔ TAY CỦA EM
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {selectedSubject?.name || 'Đang tải...'}
              </p>
            </div>
          </div>

          <div className="relative flex-1 max-w-sm mx-4">
            <div
              onClick={() => setIsSubjectSelectorOpen(!isSubjectSelectorOpen)}
              className="bg-white border-2 border-black rounded-xl px-4 py-2 cursor-pointer hover:bg-gray-50 transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Book className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-sm">
                  {selectedSubject ? selectedSubject.name : "Chọn Môn Học"}
                </span>
              </div>
              {isSubjectSelectorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {isSubjectSelectorOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-4 border-black rounded-xl p-2 shadow-[8px_8px_0_0_rgba(0,0,0,1)] z-50 animate-in fade-in zoom-in-95 max-h-64 overflow-y-auto">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    onClick={() => handleSubjectSelect(subject)}
                    className={`p-3 mb-2 last:mb-0 rounded-lg transition-all cursor-pointer font-bold border-2
                      ${selectedSubject?.id === subject.id ? "bg-blue-100 border-black" : "hover:bg-gray-100 border-transparent"}
                    `}
                  >
                    {subject.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 relative z-10 flex w-full h-full overflow-hidden">
          {/* Tree View Section */}
          <div className="flex-1 relative h-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loading message="Đang chuẩn bị trang giấy..." size="lg" />
              </div>
            ) : selectedSubject ? (
              <div className="h-full w-full">
                <VisualSkillTree
                  gradeCode={selectedSubject.grade_level}
                  isTeacherMode={false}
                  subjectNodes={subjectNodes}
                  completedNodeIds={completedNodeIds}
                  onNodeSelected={(id: string | number) => setSelectedNodeId(Number(id))}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-400 font-bold italic">Bé hãy chọn môn học để bắt đầu nhé!</p>
              </div>
            )}

            {/* Floating Detail Card (Duolingo Style) */}
            {selectedNodeId && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
                <NotebookCard className="shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                  <NotebookCardHeader className="relative">
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-black"
                    >
                      ✕
                    </button>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                        style={{ backgroundColor: completedNodeIds.includes(selectedNodeId) ? '#22c55e' : '#fbbf24' }}
                      >
                        <Sparkles className="text-white w-6 h-6" />
                      </div>
                      <div>
                        <NotebookCardTitle className="text-xl">
                          {selectedNodeData?.title || 'Bài học'}
                        </NotebookCardTitle>
                        {completedNodeIds.includes(selectedNodeId) && (
                          <NotebookBadge variant="success" className="text-[10px] mt-1">Hoàn thành xuất sắc!</NotebookBadge>
                        )}
                      </div>
                    </div>
                  </NotebookCardHeader>

                  <NotebookCardContent className="py-4">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-3 rounded-lg border-2 border-black/5">
                        <p className="text-sm text-gray-600 italic">
                          "{selectedNodeData?.title} giúp em rèn luyện kỹ năng và kiến thức bổ ích. Cùng bắt đầu nào!"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-blue-50 rounded-lg border-2 border-blue-100">
                          <div className="text-lg font-black text-blue-700">{nodeStats?.stats?.completed || 0}</div>
                          <div className="text-[10px] font-bold text-blue-500 uppercase">Đã làm</div>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded-lg border-2 border-orange-100">
                          <div className="text-lg font-black text-orange-700">{nodeStats?.stats?.bestScore || 0}%</div>
                          <div className="text-[10px] font-bold text-orange-500 uppercase">Điểm cao</div>
                        </div>
                      </div>
                    </div>
                  </NotebookCardContent>

                  <NotebookButton
                    onClick={handleStartLesson}
                    className="w-full h-14 bg-green-500 hover:bg-green-600 !text-white text-2xl font-black border-none rounded-xl mb-6 mx-auto max-w-[90%] flex"
                  >
                    BẮT ĐẦU NGAY
                  </NotebookButton>
                </NotebookCard>
              </div>
            )}
          </div>

          {/* Profile/Stats Side Panel (Hidden on smaller screens, notebook styled) */}
          <div className="hidden xl:flex w-80 flex-col bg-white border-l-4 border-black overflow-y-auto p-6 shadow-[-4px_0_0_0_rgba(0,0,0,0.05)]">
            <div className="space-y-8">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-black flex items-center justify-center text-4xl shadow-[6px_6px_0_0_rgba(0,0,0,1)] mb-4 overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : '👦'}
                </div>
                <h2 className="text-2xl font-black font-handwritten">{user?.full_name || 'Học sinh'}</h2>
                <NotebookBadge className="mt-2">{user?.total_xp || 0} XP</NotebookBadge>
              </div>

              <div className="space-y-4">
                <h3 className="font-black text-gray-500 uppercase tracking-widest text-xs">Thành tích gần đây</h3>
                <div className="space-y-3">
                  <div className="p-3 border-2 border-black rounded-xl bg-yellow-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-400 border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                      <Award className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-black">Khám phá</div>
                      <div className="text-[10px] font-bold text-yellow-700">Mở khóa 5 bài học</div>
                    </div>
                  </div>
                  <div className="p-3 border-2 border-black rounded-xl bg-orange-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-400 border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                      <PlusCircle className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-black">Chuyên cần</div>
                      <div className="text-[10px] font-bold text-orange-700">Học 3 ngày liên tiếp</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteProtectedWrapper>
  );
}
