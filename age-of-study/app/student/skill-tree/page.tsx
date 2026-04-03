"use client";

import { useState, useEffect, useRef } from "react";
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
  NotebookBadge,
} from "@/components/ui/notebook-card";
import { getRecommendedVolumeAction } from "@/actions/skillTreeProgressActions";
import { getSubjectTheme } from "@/constants/subjectThemes";

// Module-level singleton – avoids re-instantiation on every render
const testService = new TestService();

export default function StudentSkillTreePage() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isSubjectSelectorOpen, setIsSubjectSelectorOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [nodeStats, setNodeStats] = useState<StudentNodeStats | null>(null);
  const [nodeStatsLoading, setNodeStatsLoading] = useState(false);
  const [selectedVolume, setSelectedVolume] = useState<number>(1);
  const autoSelectedSubjectIdRef = useRef<number | null>(null);
  const [subjectNodes, setSubjectNodes] = useState<
    | {
        id: number;
        title: string;
        description?: string;
        node_type: string;
        parent_node_id?: number | null;
        position_x?: number;
        position_y?: number;
        order_index: number;
        week_number?: number | null;
      }[]
    | null
  >(null);
  const [completedNodeIds, setCompletedNodeIds] = useState<number[]>([]);

  const router = useRouter();
  const { user } = useAuthStore();

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsSubjectSelectorOpen(false);
    setSelectedNodeId(null);
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const allSubjects = await subjectService.getSubjects();
        // Keep ONLY Vietnamese subjects
        const filteredSubjects = allSubjects.filter(
          (s) => s.name.includes("Tiếng Việt") || s.code.startsWith("TV"),
        );
        setSubjects(filteredSubjects);

        if (filteredSubjects.length > 0) {
          setSelectedSubject(filteredSubjects[0]);
        }
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      }
    };

    fetchSubjects();
  }, []);

  // Separate effect for auto-selecting volume (SM-4) - RESTORED for TV
  useEffect(() => {
    const handleAutoSelectVolume = async () => {
      if (
        selectedSubject &&
        user?.id &&
        selectedSubject.code === "TV5" &&
        autoSelectedSubjectIdRef.current !== selectedSubject.id
      ) {
        const recommendedVolume = await getRecommendedVolumeAction(
          selectedSubject.id,
          user.id,
        );
        autoSelectedSubjectIdRef.current = selectedSubject.id;
        if (recommendedVolume && recommendedVolume !== selectedVolume) {
          setSelectedVolume(recommendedVolume);
        }
      }
    };

    handleAutoSelectVolume();
  }, [selectedSubject, user?.id]);

  // Fetch subject nodes and completion status
  useEffect(() => {
    const fetchData = async () => {
      if (selectedSubject && user?.id) {
        setSubjectNodes(null);
        setSelectedNodeId(null);
        try {
          // Pass volume for subjects with volume support (e.g., TV5)
          const volumeParam =
            selectedSubject.code === "TV5" ? selectedVolume : undefined;

          // Fetch nodes and completion status in parallel
          const [{ nodes }, completedIds] = await Promise.all([
            fetchSubjectSkillTree(selectedSubject.id, user.id, volumeParam),
            testService.getCompletedNodeIds(user.id, selectedSubject.id),
          ]);
          setSubjectNodes(nodes || []);
          setCompletedNodeIds(completedIds);
        } catch (error) {
          console.error("Failed to fetch subject data:", error);
          setSubjectNodes([]);
        }
      }
    };

    fetchData();
  }, [selectedSubject, user?.id, selectedVolume]);

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

  const selectedNodeData = subjectNodes?.find((n) => n.id === selectedNodeId);

  return (
    <RouteProtectedWrapper>
      <div className="flex flex-col h-screen bg-[#fdfbf7] font-sans text-slate-900 overflow-hidden notebook-paper-bg">
        {/* --- TOPBAR: NOTEBOOK STYLE --- */}
        <div className="relative z-20 w-full h-20 bg-white/80 backdrop-blur-md border-b-4 border-black flex items-center justify-between px-2 sm:px-6 shrink-0 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <Compass className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <h1 className="text-sm sm:text-xl font-black text-black tracking-tight font-handwritten whitespace-nowrap">
                SỔ TAY CỦA EM
              </h1>
              <p className="text-[8px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {selectedSubject?.name || "Đang tải..."}
              </p>
            </div>
          </div>

          {/* --- STATIC SUBJECT INFO (No Picker) --- */}
          <div className="flex-1 flex items-center justify-center px-1 sm:px-4">
            <div className="bg-white border-2 border-black rounded-xl px-2 sm:px-6 py-1 sm:py-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-1 sm:gap-3">
              <Book className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              <span className="font-black text-xs sm:text-lg uppercase tracking-tight whitespace-nowrap">
                {selectedSubject?.name || "Tiếng Việt"}
              </span>
            </div>
          </div>

          <div className="w-px h-10 bg-black/10 mx-2 hidden md:block" />

          {/* Volume selector - Restore for TV5 */}
          {selectedSubject?.code === "TV5" && (
            <div className="flex items-center gap-1 bg-white border-2 border-black rounded-xl overflow-hidden shadow-[2px_2px_0_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <button
                onClick={() => setSelectedVolume(1)}
                className={`px-2 sm:px-4 py-2 text-[10px] sm:text-sm font-bold transition-all border-r-2 border-black ${
                  selectedVolume === 1
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Tập 1
              </button>
              <button
                onClick={() => setSelectedVolume(2)}
                className={`px-2 sm:px-4 py-2 text-[10px] sm:text-sm font-bold transition-all ${
                  selectedVolume === 2
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Tập 2
              </button>
            </div>
          )}
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 relative z-10 flex w-full h-full overflow-hidden">
          {/* Tree View Section */}
          <div className="flex-1 relative h-full">
            {/* Always render VisualSkillTree — its internal loader handles subjectNodes=null.
                This eliminates the double-loader flash when subjects load then nodes load. */}
            <div className="h-full w-full">
              <VisualSkillTree
                gradeCode={selectedSubject?.grade_level ?? ""}
                isTeacherMode={false}
                subjectNodes={selectedSubject ? subjectNodes : null}
                completedNodeIds={completedNodeIds}
                onNodeSelected={(id: string | number) =>
                  setSelectedNodeId(Number(id))
                }
              />
            </div>

            {/* Lesson Card Popup (Notebook Style) */}
            {selectedNodeId && (
              <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                <div
                  className="absolute inset-0"
                  onClick={() => setSelectedNodeId(null)}
                />

                <NotebookCard className="relative w-full max-w-md shadow-[12px_12px_0_0_rgba(0,0,0,1)] rotate-1 animate-in zoom-in-95 duration-300">
                  <NotebookCardHeader className="border-b-4 border-black pb-4">
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-black flex items-center justify-center hover:bg-gray-100 transition-colors z-20"
                    >
                      ✕
                    </button>

                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                        style={{
                          backgroundColor: completedNodeIds.includes(
                            selectedNodeId,
                          )
                            ? "#22c55e"
                            : "#fbbf24",
                        }}
                      >
                        <Sparkles className="text-white w-8 h-8" />
                      </div>
                      <div>
                        <NotebookCardTitle className="text-2xl font-black uppercase tracking-tight">
                          {selectedNodeData?.title || "Bài học"}
                        </NotebookCardTitle>
                        <div className="flex gap-2 mt-1">
                          <NotebookBadge
                            variant="default"
                            className="text-[10px] border-black border-2 bg-white text-black"
                          >
                            Tuần {selectedNodeData?.week_number || "???"}
                          </NotebookBadge>
                          {completedNodeIds.includes(selectedNodeId) && (
                            <NotebookBadge
                              variant="success"
                              className="text-[10px] border-black border-2"
                            >
                              ĐÃ HOÀN THÀNH!
                            </NotebookBadge>
                          )}
                        </div>
                      </div>
                    </div>
                  </NotebookCardHeader>

                  <NotebookCardContent className="py-6 space-y-6">
                    {/* Lesson Objective */}
                    <div className="relative p-4 bg-blue-50 border-2 border-black rounded-xl">
                      <div className="absolute -top-3 left-4 px-2 bg-blue-600 text-white text-[10px] font-black border-2 border-black uppercase">
                        Mục tiêu bài học
                      </div>
                      <p className="text-sm font-bold text-blue-900 leading-relaxed italic">
                        "
                        {selectedNodeData?.description ||
                          "Cùng khám phá kiến thức thú vị trong bài học này nhé!"}
                        "
                      </p>
                    </div>

                    {/* Progress Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]">
                        <div className="text-[10px] font-black text-gray-500 uppercase mb-1">
                          XP Đạt được
                        </div>
                        <div className="text-2xl font-black text-black">
                          {nodeStats?.stats?.bestXp || 0}
                          <span className="text-sm text-gray-400 font-bold ml-1">
                            / {nodeStats?.stats?.requiredXp || 100}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]">
                        <div className="text-[10px] font-black text-gray-500 uppercase mb-1">
                          Tiến độ
                        </div>
                        <div className="text-2xl font-black text-green-600">
                          {nodeStats?.stats?.bestScore || 0}%
                        </div>
                      </div>
                    </div>

                    {/* Encouragement Sticker */}
                    <div className="flex justify-center">
                      <div className="bg-pink-100 border-2 border-black px-4 py-2 rounded-lg transform -rotate-2 flex items-center gap-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                        <PlusCircle className="w-5 h-5 text-pink-500" />
                        <span className="text-xs font-black text-pink-700 uppercase">
                          {completedNodeIds.includes(selectedNodeId)
                            ? "EM THẬT TUYỆT VỜI!"
                            : "CỐ GẮNG LÊN NÀO!"}
                        </span>
                      </div>
                    </div>
                  </NotebookCardContent>

                  <div className="p-4 pt-0">
                    <NotebookButton
                      onClick={handleStartLesson}
                      className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 !text-white text-3xl font-black border-4 border-black rounded-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3"
                    >
                      BẮT ĐẦU NGAY
                      <Sparkles className="w-8 h-8 animate-pulse" />
                    </NotebookButton>
                    <p className="text-center mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
                      Luyện tập để nhận thêm thật nhiều XP nhé!
                    </p>
                  </div>
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
                    user.avatar_url.includes("/") ? (
                      <img
                        src={user.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.avatar_url
                    )
                  ) : (
                    "👦"
                  )}
                </div>
                <h2 className="text-2xl font-black font-handwritten">
                  {user?.full_name || "Học sinh"}
                </h2>
                <NotebookBadge className="mt-2">
                  {user?.total_xp || 0} XP
                </NotebookBadge>
              </div>

              <div className="space-y-4">
                <h3 className="font-black text-gray-500 uppercase tracking-widest text-xs">
                  Thành tích gần đây
                </h3>
                <div className="space-y-3">
                  <div className="p-3 border-2 border-black rounded-xl bg-yellow-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-400 border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                      <Award className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-black">Khám phá</div>
                      <div className="text-[10px] font-bold text-yellow-700">
                        Mở khóa 5 bài học
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-2 border-black rounded-xl bg-orange-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-400 border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                      <PlusCircle className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-black">Chuyên cần</div>
                      <div className="text-[10px] font-bold text-orange-700">
                        Học 3 ngày liên tiếp
                      </div>
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
