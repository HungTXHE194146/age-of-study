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
import { getTeacherNodeStats, TeacherNodeStats } from "@/lib/nodeStatsService";
import NodeEditorForm from "@/components/teacher/NodeEditorForm";
import { deleteNode } from "@/lib/nodeManagement";
import { Node } from "@/lib/gradeSkillTreeService";

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
      <div className="flex flex-col h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-purple-900 to-slate-950 font-sans text-slate-200 overflow-hidden">
        {/* Lớp phủ bụi sao */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>

        {/* --- TOPBAR: THANH ĐIỀU KHIỂN NGANG --- */}
        <div className="relative z-20 w-full h-20 bg-slate-900/60 backdrop-blur-xl border-b border-indigo-500/30 shadow-[0_4px_24px_-5px_rgba(99,102,241,0.2)] flex items-center justify-between px-6 shrink-0">
          {/* Logo & Tên */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform transition-transform hover:rotate-12 cursor-pointer">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-wider">
                WORKSPACE
              </h1>
              <p className="text-[10px] text-indigo-300/70 tracking-widest uppercase">
                Teacher Mode
              </p>
            </div>
          </div>

          {/* Chọn Môn Học (Dropdown ở giữa) */}
          <div className="relative flex-1 max-w-sm mx-4">
            <div
              onClick={() => setIsSubjectSelectorOpen(!isSubjectSelectorOpen)}
              className="bg-slate-800/80 border border-indigo-500/40 rounded-xl px-4 py-2 cursor-pointer hover:border-indigo-400/60 transition-all shadow-inner flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-300 font-bold">
                  <Book className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">
                    {selectedSubject ? selectedSubject.name : "Chọn Môn Học"}
                  </h4>
                </div>
              </div>
              {isSubjectSelectorOpen ? (
                <ChevronUp className="w-4 h-4 text-indigo-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-indigo-400" />
              )}
            </div>

            {/* Menu Dropdown */}
            {isSubjectSelectorOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-indigo-500/30 rounded-xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 max-h-64 overflow-y-auto">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    onClick={() => handleSubjectSelect(subject)}
                    className={`p-2 mb-1 last:mb-0 rounded-lg transition-all cursor-pointer flex items-center justify-between
                      ${selectedSubject?.id === subject.id ? "bg-indigo-600/30 border border-indigo-400/50" : "hover:bg-slate-700/50 border border-transparent"}
                    `}
                  >
                    <span
                      className={`font-semibold text-sm ${selectedSubject?.id === subject.id ? "text-indigo-200" : "text-slate-300"}`}
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
            {/* Stats (Removed) */}

            {/* Nút Quản Lý */}
            <Button
              onClick={handleAddNode}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 rounded-xl gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm Node</span>
            </Button>

            <Button
              variant="outline"
              size="md"
              className="rounded-xl border-slate-600 bg-slate-800/50 hover:bg-slate-700 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* --- MAIN CONTENT: BẢN ĐỒ KỸ NĂNG VÀ SIDEBAR --- */}
        <div className="flex-1 relative z-10 flex w-full">
          {/* Main Tree View (Mobile-sized bounded by max-width) */}
          <div className="flex-1 max-w-md mx-auto h-full border-x border-slate-800 bg-slate-900/40 relative">
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
          <div className="hidden lg:flex w-80 xl:w-96 flex-col bg-slate-900/80 border-l border-indigo-500/30 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-2 flex flex-row items-center gap-2">
                <Target className="w-6 h-6 text-indigo-400" />
                Tổng quan Bài học
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Xem thống kê và danh sách bài test.
              </p>
              
              {selectedNodeId ? (
                nodeStatsLoading ? (
                  <div className="flex justify-center p-6"><Loading size="md" /></div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                      <h3 className="text-indigo-300 font-semibold mb-3">Tình hình hoàn thành</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 text-center">
                          <div className="text-2xl font-bold text-green-400">{nodeStats?.stats?.completedSubmissions || 0}</div>
                          <div className="text-xs text-slate-400">Đã xong</div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 text-center">
                          <div className="text-2xl font-bold text-blue-400">{nodeStats?.stats?.inProgressSubmissions || 0}</div>
                          <div className="text-xs text-slate-400">Đang học</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-indigo-300 font-semibold">Bài Test</h3>
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">{nodeStats?.tests?.length || 0} bài</span>
                      </div>
                      <div className="space-y-2">
                        {nodeStats?.tests && nodeStats.tests.length > 0 ? (
                          nodeStats.tests.map((t) => (
                            <div key={t.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700 hover:border-indigo-500/50 cursor-pointer transition-all">
                              <div className="font-medium text-slate-200 text-sm truncate">{t.title || 'Bài test'}</div>
                              <div className="text-xs text-slate-400 mt-1 flex justify-between">
                                <span>{t.type === 'practice' ? 'Luyện tập' : 'Kiểm tra'}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-500 italic text-center py-2">Chưa có bài kiểm tra nào được tạo cho bài học này.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 text-center">
                  <Book className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
                  <p className="text-slate-400 text-sm">
                    Bấm vào một Node bất kỳ trên cây kỹ năng để xem thống kê số liệu và danh sách bài Test của bài học đó.
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
