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
  Edit2,
  Trash2,
} from "lucide-react";
import { subjectService } from "@/lib/subjectService";
import { Subject } from "@/types/teacher";
import VisualSkillTree from "@/components/VisualSkillTree";
import { fetchSubjectSkillTree } from "@/lib/gradeSkillTreeService";
import Loading from "@/components/ui/loading";
import { getTeacherNodeStats, TeacherNodeStats } from "@/lib/nodeStatsService";
import NodeEditorForm from "@/components/teacher/NodeEditorForm";
import { deleteNode } from "@/lib/nodeManagement";
import { Node } from "@/lib/gradeSkillTreeService";
import { NotebookCard, NotebookCardHeader, NotebookCardTitle, NotebookCardContent, NotebookButton, NotebookBadge } from "@/components/ui/notebook-card";

export default function TeacherSkillTreePage() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isSubjectSelectorOpen, setIsSubjectSelectorOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [nodeStats, setNodeStats] = useState<TeacherNodeStats | null>(null);
  const [nodeStatsLoading, setNodeStatsLoading] = useState(false);
  
  // Node mapping for Editor
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [nodeToEdit, setNodeToEdit] = useState<Node | null>(null);
  const [allNodesAsNode, setAllNodesAsNode] = useState<Node[]>([]);
  const [subjectNodes, setSubjectNodes] = useState<
    {
      id: number;
      title: string;
      node_type: string;
      parent_node_id?: number | null;
      position_x?: number;
      position_y?: number;
      order_index: number;
    }[] | null
  >(null);
  const router = useRouter();

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

  // Fetch subject nodes when subject is selected
  useEffect(() => {
    const fetchNodes = async () => {
      if (selectedSubject) {
        setSubjectNodes(null); // Mark as loading
        try {
          const { nodes } = await fetchSubjectSkillTree(selectedSubject.id);
          setSubjectNodes(nodes || []);
          setAllNodesAsNode((nodes || []) as unknown as Node[]);
        } catch (error) {
          console.error("Failed to fetch subject nodes:", error);
          setSubjectNodes([]); // Empty on error
        }
      }
    };

    fetchNodes();
  }, [selectedSubject]);

  const refreshNodes = async () => {
    if (selectedSubject) {
      try {
        const { nodes } = await fetchSubjectSkillTree(selectedSubject.id);
        setSubjectNodes(nodes || []);
        setAllNodesAsNode((nodes || []) as unknown as Node[]);
      } catch (error) {
        console.error("Failed to refresh nodes:", error);
      }
    }
  };

  const handleEditNode = (nodeId: number) => {
    const node = allNodesAsNode.find(n => n.id === nodeId);
    if (node) {
      setNodeToEdit(node);
      setIsEditorOpen(true);
    }
  };

  const handleDeleteNode = async (nodeId: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài học này?")) {
      const result = await deleteNode(nodeId);
      if (result.success) {
        refreshNodes();
        if (selectedNodeId === nodeId) setSelectedNodeId(null);
      } else {
        alert(`Lỗi: ${result.error}`);
      }
    }
  };

  const handleAddNode = () => {
    setNodeToEdit(null);
    setIsEditorOpen(true);
  };

  // Fetch node stats when a node is selected
  useEffect(() => {
    const fetchStats = async () => {
      if (selectedNodeId) {
        setNodeStatsLoading(true);
        try {
          const stats = await getTeacherNodeStats(selectedNodeId);
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
  }, [selectedNodeId]);

  return (
    <RouteProtectedWrapper>
      <div className="flex flex-col h-[calc(100dvh-56px)] lg:h-[100dvh] font-sans text-gray-900 overflow-hidden relative overscroll-none">
        {/* --- TOPBAR: THANH ĐIỀU KHIỂN NGANG --- */}
        <div className="relative z-20 w-full h-20 bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2rem] border-b-2 border-dashed border-gray-400 flex items-center justify-between px-6 shrink-0 shadow-sm">
          {/* Logo & Tên */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] transform rotate-[-3deg]">
              <Compass className="w-6 h-6 text-black" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-black text-gray-900 tracking-wider font-handwritten">
                WORKSPACE
              </h1>
              <p className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">
                Teacher Mode
              </p>
            </div>
          </div>

          {/* Chọn Môn Học (Dropdown ở giữa) */}
          <div className="relative flex-1 max-w-sm mx-4">
            <div
              onClick={() => setIsSubjectSelectorOpen(!isSubjectSelectorOpen)}
              className="bg-white border-2 border-black rounded-xl px-4 py-2 cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 border border-blue-900 rounded-lg flex items-center justify-center text-blue-900 font-bold">
                  <Book className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">
                    {selectedSubject ? selectedSubject.name : "Chọn Môn Học"}
                  </h4>
                </div>
              </div>
              {isSubjectSelectorOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </div>

            {/* Menu Dropdown */}
            {isSubjectSelectorOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-yellow-50 border-2 border-black rounded-xl p-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-50 animate-in fade-in slide-in-from-top-2 max-h-64 overflow-y-auto">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    onClick={() => handleSubjectSelect(subject)}
                    className={`p-2 mb-1 last:mb-0 rounded-lg transition-all cursor-pointer flex items-center justify-between font-bold
                      ${selectedSubject?.id === subject.id ? "bg-yellow-200 border-2 border-dashed border-gray-400" : "hover:bg-white border-2 border-transparent"}
                    `}
                  >
                    <span
                      className={`text-sm ${selectedSubject?.id === subject.id ? "text-gray-900" : "text-gray-700"}`}
                    >
                      {subject.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Thống kê nhanh & Nút thao tác của Giáo viên */}
          <div className="flex items-center gap-4">
            {/* Nút Quản Lý */}
            <NotebookButton
              onClick={handleAddNode}
              className="bg-emerald-100 text-emerald-900 border-emerald-900 py-2"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Thêm Bài Học</span>
            </NotebookButton>
          </div>
        </div>

        {/* --- MAIN CONTENT: BẢN ĐỒ KỸ NĂNG VÀ SIDEBAR --- */}
        <div className="flex-1 relative z-10 flex w-full overflow-hidden min-h-0">
          {/* Main Tree View (Mobile-sized bounded by max-width) */}
          <div className="flex-1 lg:max-w-none mx-auto h-full border-x-2 border-dashed border-gray-400 bg-transparent relative w-full touch-none">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loading message="Đang tải bản đồ kỹ năng..." size="lg" />
              </div>
            ) : selectedSubject ? (
              <VisualSkillTree
                gradeCode={selectedSubject.grade_level}
                isTeacherMode={true}
                subjectNodes={subjectNodes}
                onNodeSelected={(id: string | number) => setSelectedNodeId(Number(id))}
                onEditNode={handleEditNode}
                onDeleteNode={handleDeleteNode}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-400">
                  Vui lòng chọn môn học ở thanh điều khiển phía trên.
                </p>
              </div>
            )}
          </div>
          
          {/* Right Sidebar Desktop */}
          <div className="hidden lg:flex w-80 xl:w-96 flex-col bg-[#fffdf8] border-l-2 border-dashed border-gray-400 h-full relative z-20">
            <div className="p-6 h-full overflow-y-auto custom-scrollbar">
              <h2 className="text-2xl font-black text-gray-900 mb-2 flex flex-row items-center gap-2 font-handwritten tracking-tight">
                <Target className="w-8 h-8 text-black" />
                Tổng quan Bài học
              </h2>
              <p className="text-sm font-bold text-gray-600 mb-6">
                Xem thống kê và danh sách bài test.
              </p>
              
              {selectedNodeId ? (
                nodeStatsLoading ? (
                  <div className="flex justify-center p-6"><Loading size="md" /></div>
                ) : (
                  <div className="space-y-6">
                    <NotebookCard className="bg-orange-50/50">
                      <NotebookCardContent className="pt-6">
                        <h3 className="text-gray-800 font-bold mb-3 uppercase text-sm">Tình hình hoàn thành</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-100 p-3 rounded-lg border-2 border-green-800 text-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            <div className="text-2xl font-black text-green-900">{nodeStats?.stats?.completedSubmissions || 0}</div>
                            <div className="text-xs font-bold text-green-800">Đã xong</div>
                          </div>
                          <div className="bg-blue-100 p-3 rounded-lg border-2 border-blue-800 text-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            <div className="text-2xl font-black text-blue-900">{nodeStats?.stats?.inProgressSubmissions || 0}</div>
                            <div className="text-xs font-bold text-blue-800">Đang học</div>
                          </div>
                        </div>
                      </NotebookCardContent>
                    </NotebookCard>
                    
                    <NotebookCard className="bg-purple-50/50">
                      <NotebookCardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4 border-b-2 border-dashed border-gray-300 pb-2">
                          <h3 className="text-gray-800 font-bold uppercase text-sm">Bài Kiểm Tra</h3>
                          <NotebookBadge variant="danger" className="text-xs py-1 px-2">{nodeStats?.tests?.length || 0} bài</NotebookBadge>
                        </div>
                        <div className="space-y-3">
                          {nodeStats?.tests && nodeStats.tests.length > 0 ? (
                            nodeStats.tests.map((t) => (
                              <div key={t.id} className="bg-white p-3 rounded-lg border-2 border-black hover:bg-yellow-100 hover:-translate-y-1 transition-transform cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                                <div className="font-bold text-gray-900 text-base line-clamp-1">{t.title || 'Bài test'}</div>
                                <div className="text-xs font-bold text-gray-500 mt-1 flex justify-between uppercase">
                                  <span className={t.type === 'practice' ? 'text-blue-600' : 'text-purple-600'}>
                                    {t.type === 'practice' ? 'Luyện tập' : 'Kiểm tra'}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm font-bold text-gray-500 italic text-center py-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">Chưa có bài kiểm tra.</div>
                          )}
                        </div>
                      </NotebookCardContent>
                    </NotebookCard>
                  </div>
                )
              ) : (
                <div className="bg-white p-8 rounded-xl border-4 border-dashed border-gray-300 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <Book className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-bold text-base">
                    Bấm vào một Bài học (Note) bất kỳ trên cây kỹ năng để xem thống kê số liệu và danh sách Bài kiểm tra chi tiết.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <NodeEditorForm
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        selectedNode={nodeToEdit}
        subjects={subjects}
        allNodes={allNodesAsNode}
        onSuccess={refreshNodes}
      />
    </RouteProtectedWrapper>
  );
}
