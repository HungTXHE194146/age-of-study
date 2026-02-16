"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { RouteProtectedWrapper } from "@/lib/routeMiddleware";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Target,
  Award,
  Users,
  Book,
  Star,
  Sparkles,
} from "lucide-react";
import { subjectService } from "@/lib/subjectService";
import { Subject } from "@/types/teacher";
import VisualSkillTree from "@/components/VisualSkillTree";

interface GradeLevel {
  id: number;
  name: string;
  code: string;
  description: string;
}

export default function SkillTreePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | null>(null);
  const [isGradeSelectorOpen, setIsGradeSelectorOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGradeSelect = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    setIsGradeSelectorOpen(false);
  };

  const getSubjectsForGrade = (grade: GradeLevel) => {
    return subjects.filter((subject) => subject.grade_level === grade.code);
  };

  // Fetch subjects when component mounts
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const allSubjects = await subjectService.getSubjects();
        setSubjects(allSubjects);

        // Extract unique grade levels from subjects
        const uniqueGrades = Array.from(
          new Set(allSubjects.map((subject) => subject.grade_level)),
        ).map((gradeLevel, index) => ({
          id: index + 1,
          name: `Lớp ${gradeLevel}`,
          code: gradeLevel,
          description: `Học sinh lớp ${gradeLevel}`,
        }));

        setGradeLevels(uniqueGrades);

        // Select first grade by default
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

  const router = useRouter();

  return (
    <RouteProtectedWrapper>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Header */}
        <div className="relative">
          {/* Space-themed background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent pointer-events-none"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

          {/* Grade Selector Sidebar */}
          <div className="fixed left-0 top-0 h-full w-80 bg-black/50 backdrop-blur-md border-r border-white/10 z-50">
            <div className="p-6">
              {/* Logo/Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Bản Đồ Kỹ Năng
                  </h1>
                  <p className="text-xs text-gray-400">
                    Galactic Learning System
                  </p>
                </div>
              </div>

              {/* Grade Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Khối Học
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsGradeSelectorOpen(!isGradeSelectorOpen)}
                    className="text-gray-400 hover:text-white hover:bg-white/10 border-white/20 hover:border-blue-400/50"
                  >
                    {isGradeSelectorOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {selectedGrade && (
                  <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">
                          {selectedGrade.name}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {selectedGrade.description}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-blue-500/20 text-blue-300 border-none"
                      >
                        {getSubjectsForGrade(selectedGrade).length} môn
                      </Badge>
                    </div>
                  </div>
                )}

                {isGradeSelectorOpen && (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {gradeLevels.map((grade) => (
                      <div
                        key={grade.id}
                        onClick={() => handleGradeSelect(grade)}
                        className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer group hover:bg-white/10 ${
                          selectedGrade?.id === grade.id
                            ? "border-blue-400 bg-blue-500/20"
                            : "border-white/20 hover:border-blue-400/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                selectedGrade?.id === grade.id
                                  ? "bg-blue-500/30"
                                  : "bg-white/10"
                              }`}
                            >
                              <GraduationCap className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h5 className="font-medium text-white group-hover:text-blue-300">
                                {grade.name}
                              </h5>
                              <p className="text-xs text-gray-400">
                                {grade.description}
                              </p>
                            </div>
                          </div>
                          {selectedGrade?.id === grade.id && (
                            <CheckCircle className="w-4 h-4 text-blue-300" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              {selectedGrade && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Thống Kê
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Book className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-gray-400">Môn học</span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {getSubjectsForGrade(selectedGrade).length}
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-gray-400">Bài học</span>
                      </div>
                      <p className="text-lg font-bold text-white">-</p>
                    </div>
                    <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-gray-400">Tổng XP</span>
                      </div>
                      <p className="text-lg font-bold text-white">-</p>
                    </div>
                    <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-gray-400">Tiến độ</span>
                      </div>
                      <p className="text-lg font-bold text-white">-</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="absolute bottom-6 left-6 right-6 text-center">
                <p className="text-xs text-gray-500">
                  Hệ thống học tập tương lai
                </p>
                <div className="flex justify-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div
                    className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                    style={{ animationDelay: "1s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="ml-80 min-h-screen">
            <div className="p-8">
              {/* Title */}
              <div className="mb-8">
                <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Bản Đồ Kỹ Năng Vũ Trụ
                </h1>
                <p className="text-lg text-gray-300">
                  Khám phá hành trình học tập của bạn trong không gian tri thức
                  vô tận
                </p>
              </div>

              {/* Visual Skill Tree */}
              {selectedGrade ? (
                <div className="relative">
                  <VisualSkillTree gradeCode={selectedGrade.code} />

                  {/* Overlay effects */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
                    <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent"></div>
                    <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-purple-400 to-transparent"></div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50">
                    <Star className="w-16 h-16 text-white animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Chọn Khối Học
                  </h2>
                  <p className="text-gray-400 text-lg mb-8">
                    Hãy chọn một khối học để khám phá bản đồ kỹ năng vũ trụ
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {[1, 2, 3, 4, 5].map((gradeNum) => (
                      <div
                        key={gradeNum}
                        className="bg-white/5 border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                        onClick={() => {
                          const grade = gradeLevels.find(
                            (g) => g.code === gradeNum.toString(),
                          );
                          if (grade) handleGradeSelect(grade);
                        }}
                      >
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <span className="text-2xl font-bold text-white">
                            {gradeNum}
                          </span>
                        </div>
                        <h3 className="text-white font-semibold mb-2">
                          Lớp {gradeNum}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Khám phá tri thức
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RouteProtectedWrapper>
  );
}
