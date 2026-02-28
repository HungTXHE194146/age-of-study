"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getClassDetailServer } from "@/actions/classActions";
import { TestService } from "@/lib/testService";
import type { ClassDetail } from "@/types/class";
import type { Test } from "@/types/test";
import { motion } from "framer-motion";
import { Users, BookOpen, Star, Clock, ArrowRight, Trophy, Activity, Award, User, Medal } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import Loading, { LoadingSpinner } from "@/components/ui/loading";

const testService = new TestService();

export default function StudentClassDashboard() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
    const classCode = params.classCode as string;

    const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
    const [assignedTests, setAssignedTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (user && classCode) {
            loadClassData();
        }
    }, [user, classCode]);

    const loadClassData = async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = getSupabaseBrowserClient();

            // 1. Get class ID from code
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('id')
                .eq('class_code', classCode)
                .eq('status', 'active')
                .single();

            if (classError || !classData) {
                setError("Không tìm thấy lớp học này!");
                setLoading(false);
                return;
            }

            // 2. Load class detail from Server Action (bypassing RLS so students can see leaders/teachers)
            const detailResult = await getClassDetailServer(classData.id);
            if (detailResult.error || !detailResult.data) {
                setError(detailResult.error || "Không thể tải thông tin lớp học.");
                setLoading(false);
                return;
            }

            // Check if student belongs to this class
            const isMember = detailResult.data.students.some((s: any) => s.student_id === user?.id);
            if (!isMember) {
                setError("Bạn không phải là thành viên của lớp học này!");
                setLoading(false);
                return;
            }

            setClassDetail(detailResult.data);

            // 3. Load tests assigned to this class
            try {
                const tests = await testService.getTestsByClass(classData.id);
                // Only show published tests
                setAssignedTests(tests.filter(t => t.is_published !== false));
            } catch (err) {
                console.error("Error loading tests:", err);
            }

        } catch (err) {
            console.error("Failed to load class dashboard:", err);
            setError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const handleTakeTest = (testId: string) => {
        router.push(`/student/learn/tests/${testId}`);
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-amber-50/30">
                <Loading message="Đang tải thông tin lớp học..." size="lg" />
            </div>
        );
    }

    if (error || !classDetail) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-amber-50/30">
                <div className="bg-white p-8 rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 text-center max-w-md w-full">
                    <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase">Lỗi Truy Cập</h2>
                    <p className="text-slate-600 mb-6 font-medium">{error || "Không thể tải lớp học"}</p>
                    <button
                        onClick={() => router.push("/student")}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all hover:translate-y-1 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] border-2 border-slate-800 w-full"
                    >
                        Quay lại bàng điều khiển
                    </button>
                </div>
            </div>
        );
    }

    // Generate Leaderboard
    const leaderboard = [...classDetail.students]
        .map((s: any) => ({
            id: s.profile.id,
            name: s.profile.full_name || s.profile.username || "Học sinh ẩn danh",
            xp: s.profile.total_xp || 0,
            avatar: s.profile.avatar_url,
            isCurrentUser: s.profile.id === user?.id
        }))
        .sort((a, b) => b.xp - a.xp);

    // Collect all recent activities from all students
    const allActivities = classDetail.students.flatMap((s: any) => {
        if (!s.profile.activity_logs) return [];
        return s.profile.activity_logs.map((log: any) => ({
            ...log,
            studentName: s.profile.full_name || s.profile.username || "Học sinh"
        }));
    }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10); // Take top 10 most recent

    return (
        <div className="container mx-auto px-4 py-8 bg-amber-50/30 min-h-screen relative overflow-hidden notebook-paper-bg">
            <div className="notebook-lines opacity-20 z-0"></div>

            <div className="relative z-10">
                {/* Header Section */}
                <div className="mb-10 bg-white rounded-[2rem] p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 transform -rotate-1 relative overflow-hidden group">
                    <div className="absolute top-2 right-4 w-12 h-4 bg-red-200/80 border border-red-300 rounded-sm italic transform rotate-3"></div>
                    <div className="absolute -top-4 -left-4 w-16 h-16 bg-blue-100 rounded-full border-4 border-slate-800 opacity-50 block mix-blend-multiply"></div>

                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-24 h-24 bg-yellow-300 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform rotate-6 group-hover:rotate-12 transition-transform">
                            <SchoolIcon className="w-12 h-12 text-slate-800" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                                <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tight" style={{ textShadow: "2px 2px 0 #fff" }}>
                                    {classDetail.name}
                                </h1>
                                <span className="px-4 py-1.5 bg-green-400 text-slate-900 text-sm font-black rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] border-2 border-slate-800 transform -rotate-3">
                                    Khối {classDetail.grade}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-600 font-semibold mt-4">
                                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border-2 border-slate-300">
                                    <Users className="w-4 h-4 text-slate-500" />
                                    <span>{classDetail.students.length} Học sinh</span>
                                </div>
                                {classDetail.homeroom_teacher && (
                                    <div className="flex items-center gap-2 bg-amber-100 px-3 py-1.5 rounded-lg border-2 border-amber-300 transform rotate-1">
                                        <User className="w-4 h-4 text-amber-600" />
                                        <span>GVCN: {classDetail.homeroom_teacher.full_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Column: Tests and Activities */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Assigned Tests */}
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[6px_6px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 relative">
                            <div className="flex items-center gap-3 mb-6 border-b-4 border-slate-800 pb-4">
                                <div className="p-3 bg-indigo-100 rounded-xl border-2 border-slate-800 transform -rotate-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                                    <Trophy className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Bài Kiểm Tra Được Giao</h2>
                            </div>

                            {assignedTests.length > 0 ? (
                                <div className="space-y-4">
                                    {assignedTests.map((test, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            key={test.id}
                                            className="group p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-2xl border-2 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all flex flex-col sm:flex-row items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center border-2 border-slate-800 shrink-0 transform group-hover:rotate-12 transition-transform">
                                                    <BookOpen className="w-6 h-6 text-indigo-700" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800">{test.title}</h3>
                                                    <div className="flex items-center gap-3 mt-1 text-sm font-semibold text-slate-500">
                                                        {test.settings?.time_limit ? (
                                                            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-300">
                                                                <Clock className="w-3 h-3" /> {test.settings.time_limit} phút
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleTakeTest(test.id)}
                                                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl border-2 border-slate-800 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                            >
                                                Bắt đầu <ArrowRight className="w-4 h-4 ml-1" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 mt-4">
                                    <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">Chưa có bài kiểm tra nào được giao.</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[6px_6px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 transform rotate-1">
                            <div className="flex items-center gap-3 mb-6 border-b-4 border-slate-800 pb-4">
                                <div className="p-3 bg-fuchsia-100 rounded-xl border-2 border-slate-800 transform rotate-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                                    <Activity className="w-6 h-6 text-fuchsia-600" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Hoạt Động Gần Đây</h2>
                            </div>

                            {allActivities.length > 0 ? (
                                <div className="space-y-4">
                                    {allActivities.map((activity, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border-2 border-transparent hover:border-slate-200">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-800 flex items-center justify-center shrink-0 mt-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                                                <Star className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="text-slate-800 font-semibold text-sm sm:text-base">
                                                    <span className="font-bold text-indigo-600">{activity.studentName}</span> {activity.description?.toLowerCase()}
                                                </p>
                                                <p className="text-xs text-slate-400 font-medium mt-1">
                                                    {new Date(activity.created_at).toLocaleDateString("vi-VN", {
                                                        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                                                    })}
                                                    {activity.xp_earned > 0 && ` • +${activity.xp_earned} XP`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-slate-500 font-medium">Chưa có hoạt động nào trong lớp.</p>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Column: Leaderboard & Teachers */}
                    <div className="space-y-8">

                        {/* Leaderboard */}
                        <div className="bg-gradient-to-b from-amber-100 to-yellow-50 rounded-3xl p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 relative">
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 rounded-full border-2 border-slate-800 shadow-[2px_2px_0_0_rgba(0,0,0,1)] z-10"></div>

                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-1">Bảng Xếp Hạng</h2>
                                <p className="text-amber-700 font-bold text-sm">Top XP của lớp</p>
                            </div>

                            <div className="space-y-3">
                                {leaderboard.slice(0, 10).map((student, idx) => (
                                    <div
                                        key={student.id}
                                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 ${student.isCurrentUser
                                            ? "bg-white border-blue-500 shadow-[2px_2px_0_0_rgba(59,130,246,1)]"
                                            : "bg-white/60 border-slate-800"
                                            }`}
                                    >
                                        <div className="flex-shrink-0 w-8 text-center font-black">
                                            {idx === 0 ? <Medal className="w-7 h-7 text-yellow-500 mx-auto" />
                                                : idx === 1 ? <Medal className="w-6 h-6 text-slate-400 mx-auto" />
                                                    : idx === 2 ? <Medal className="w-6 h-6 text-amber-700 mx-auto" />
                                                        : <span className="text-slate-500 mx-auto">#{idx + 1}</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-bold truncate text-sm ${student.isCurrentUser ? "text-blue-700" : "text-slate-800"}`}>
                                                {student.name} {student.isCurrentUser && "(Bạn)"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 font-black shrink-0">
                                            <span className="text-amber-500">{student.xp}</span>
                                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                        </div>
                                    </div>
                                ))}

                                {leaderboard.length > 10 && (
                                    <div className="text-center font-bold text-amber-700/60 pt-2 text-sm">
                                        ... và {leaderboard.length - 10} học sinh khác
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Teachers */}
                        <div className="bg-white rounded-3xl p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 transform -rotate-1">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <User className="w-5 h-5" /> Giáo Viên
                            </h2>

                            <div className="space-y-4">
                                {classDetail.homeroom_teacher && (
                                    <div className="bg-amber-50 p-3 rounded-xl border-2 border-amber-200">
                                        <p className="text-xs text-amber-600 font-black uppercase mb-1">Giáo Viên Chủ Nhiệm</p>
                                        <p className="font-bold text-slate-800">{classDetail.homeroom_teacher.full_name}</p>
                                    </div>
                                )}
                                {classDetail.subject_teachers?.length > 0 && (
                                    <div className="bg-slate-50 p-3 rounded-xl border-2 border-slate-200">
                                        <p className="text-xs text-slate-500 font-black uppercase mb-2">Giáo Viên Bộ Môn</p>
                                        <div className="space-y-2">
                                            {classDetail.subject_teachers.map((st: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span className="font-bold text-slate-700">{st.teacher.full_name}</span>
                                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-semibold text-xs">{st.subject.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

function SchoolIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14 22v-4a2 2 0 1 0-4 0v4" />
            <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" />
            <path d="M18 5v17" />
            <path d="m4 6 8-4 8 4" />
            <path d="M6 5v17" />
            <circle cx="12" cy="9" r="2" />
        </svg>
    );
}
