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
import { fetchGradeSkillTree } from "@/lib/gradeSkillTreeService";
import Loading from "@/components/ui/loading";

interface GradeLevel {
  id: number;
  name: string;
  code: string;
  description: string;
}

export default function TeacherSkillTreePage() {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | null>(null);
  const [isGradeSelectorOpen, setIsGradeSelectorOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [subjectNodes, setSubjectNodes] = useState<
    {
      id: number;
      title: string;
      node_type: string;
      parent_node_id?: number | null;
      position_x?: number;
      position_y?: number;
      order_index: number;
    }[]
  >([]);
  const router = useRouter();

  const handleGradeSelect = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    setIsGradeSelectorOpen(false);
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const allSubjects = await subjectService.getSubjects();
        setSubjects(allSubjects);

        const uniqueGrades = Array.from(
          new Set(allSubjects.map((subject) => subject.grade_level)),
        ).map((gradeLevel, index) => ({
          id: index + 1,
          name: `Lớp ${gradeLevel}`,
          code: gradeLevel,
          description: `Bản đồ kỹ năng Cấp ${gradeLevel}`,
        }));

        setGradeLevels(uniqueGrades);
        if (uniqueGrades.length > 0) {
          setSelectedGrade(uniqueGrades[0]);
        }
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // Fetch subject nodes when grade is selected
  useEffect(() => {
    const fetchNodes = async () => {
      if (selectedGrade) {
        try {
          const gradeData = await fetchGradeSkillTree(selectedGrade.code);
          // Flatten all nodes from subjects
          const allNodes = gradeData.nodes || [];
          setSubjectNodes(allNodes);
        } catch (error) {
          console.error("Failed to fetch subject nodes:", error);
          setSubjectNodes([]);
        }
      }
    };

    fetchNodes();
  }, [selectedGrade]);

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

          {/* Chọn Khối (Dropdown ở giữa) */}
          <div className="relative flex-1 max-w-sm mx-4">
            <div
              onClick={() => setIsGradeSelectorOpen(!isGradeSelectorOpen)}
              className="bg-slate-800/80 border border-indigo-500/40 rounded-xl px-4 py-2 cursor-pointer hover:border-indigo-400/60 transition-all shadow-inner flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-300 font-bold">
                  {selectedGrade ? selectedGrade.code : "?"}
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">
                    {selectedGrade ? selectedGrade.name : "Chọn Khối Học"}
                  </h4>
                </div>
              </div>
              {isGradeSelectorOpen ? (
                <ChevronUp className="w-4 h-4 text-indigo-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-indigo-400" />
              )}
            </div>

            {/* Menu Dropdown */}
            {isGradeSelectorOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-indigo-500/30 rounded-xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                {gradeLevels.map((grade) => (
                  <div
                    key={grade.id}
                    onClick={() => handleGradeSelect(grade)}
                    className={`p-2 mb-1 last:mb-0 rounded-lg transition-all cursor-pointer flex items-center justify-between
                      ${selectedGrade?.id === grade.id ? "bg-indigo-600/30 border border-indigo-400/50" : "hover:bg-slate-700/50 border border-transparent"}
                    `}
                  >
                    <span
                      className={`font-semibold text-sm ${selectedGrade?.id === grade.id ? "text-indigo-200" : "text-slate-300"}`}
                    >
                      {grade.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Thống kê nhanh & Nút thao tác của Giáo viên */}
          <div className="flex items-center gap-4">
            {/* Stats (Ẩn trên mobile) */}
            {selectedGrade && (
              <div className="hidden lg:flex items-center gap-4 mr-4 border-r border-slate-700 pr-4">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-400 uppercase">
                    Môn học
                  </span>
                  <span className="font-bold text-blue-400 text-sm">
                    {
                      subjects.filter(
                        (s) => s.grade_level === selectedGrade.code,
                      ).length
                    }
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-400 uppercase">
                    Bài học
                  </span>
                  <span className="font-bold text-purple-400 text-sm">--</span>
                </div>
              </div>
            )}

            {/* Nút Quản Lý */}
            <Button
              onClick={() => router.push("/teacher/nodes/create")}
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

        {/* --- MAIN CONTENT: BẢN ĐỒ KỸ NĂNG --- */}
        <div className="flex-1 relative z-10">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loading message="Đang tải bản đồ kỹ năng..." size="lg" />
            </div>
          ) : selectedGrade ? (
            // Truyền gradeCode xuống. Thuộc tính isTeacherMode={true} để bật các nút Sửa/Xóa
            <VisualSkillTree
              gradeCode={selectedGrade.code}
              isTeacherMode={true}
              subjectNodes={subjectNodes}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-slate-400">
                Vui lòng chọn khối học ở thanh điều khiển phía trên.
              </p>
            </div>
          )}
        </div>
      </div>
    </RouteProtectedWrapper>
  );
}
