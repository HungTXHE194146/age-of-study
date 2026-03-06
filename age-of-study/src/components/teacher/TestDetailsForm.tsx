import { useState, useEffect } from "react";
import { Subject } from "@/types/teacher";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface TestDetails {
    title: string;
    description: string;
    subject: string;
    node: string;
    timeLimit: number;
    classId: string;
}

export interface TestDetailsFormProps {
    testDetails: TestDetails;
    setTestDetails: React.Dispatch<React.SetStateAction<TestDetails>>;
    subjects: Subject[];
    isLoadingSubjects: boolean;
    teacherClasses: any[];
    isLoadingClasses: boolean;
    nodes: { id: number; title: string }[];
    isLoadingNodes: boolean;
    setNodes: React.Dispatch<React.SetStateAction<{ id: number; title: string }[]>>;
    setIsLoadingNodes: React.Dispatch<React.SetStateAction<boolean>>;
}

export function TestDetailsForm({
    testDetails,
    setTestDetails,
    subjects,
    isLoadingSubjects,
    teacherClasses,
    isLoadingClasses,
    nodes,
    isLoadingNodes,
    setNodes,
    setIsLoadingNodes,
}: TestDetailsFormProps) {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                    Tiêu đề bài kiểm tra <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={testDetails.title}
                    onChange={(e) =>
                        setTestDetails((prev) => ({
                            ...prev,
                            title: e.target.value,
                        }))
                    }
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5"
                    placeholder="Nhập tiêu đề bài kiểm tra..."
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                    Mô tả
                </label>
                <textarea
                    value={testDetails.description}
                    onChange={(e) =>
                        setTestDetails((prev) => ({
                            ...prev,
                            description: e.target.value,
                        }))
                    }
                    rows={3}
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 border-dashed"
                    placeholder="Mô tả ngắn về bài kiểm tra..."
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                    Môn học <span className="text-red-500">*</span>
                </label>
                <select
                    value={testDetails.subject}
                    onChange={async (e) => {
                        const selectedSubjectId = e.target.value;
                        setTestDetails((prev) => ({
                            ...prev,
                            subject: selectedSubjectId,
                            node: "", // Reset node when subject changes
                        }));

                        // Fetch nodes for the selected subject
                        if (selectedSubjectId) {
                            try {
                                setIsLoadingNodes(true);
                                const supabase = await getSupabaseBrowserClient();
                                const { data, error } = await supabase
                                    .from("nodes")
                                    .select("id, title")
                                    .eq("subject_id", parseInt(selectedSubjectId))
                                    .order("title", { ascending: true });

                                if (error) throw error;
                                setNodes(data || []);
                            } catch (error) {
                                console.error("Error fetching nodes:", error);
                                setNodes([]);
                            } finally {
                                setIsLoadingNodes(false);
                            }
                        } else {
                            setNodes([]);
                        }
                    }}
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 appearance-none cursor-pointer"
                    required
                >
                    <option value="">Chọn môn học</option>
                    {isLoadingSubjects ? (
                        <option disabled>Đang tải môn học...</option>
                    ) : (
                        subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                                {subject.name}
                            </option>
                        ))
                    )}
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                    Gán cho lớp học
                </label>
                <select
                    value={testDetails.classId}
                    onChange={(e) =>
                        setTestDetails((prev) => ({
                            ...prev,
                            classId: e.target.value,
                        }))
                    }
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 appearance-none cursor-pointer"
                >
                    <option value="">Không gán cho lớp (Chung)</option>
                    {isLoadingClasses ? (
                        <option disabled>Đang tải danh sách lớp...</option>
                    ) : (
                        teacherClasses.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                                Lớp {cls.name} ({cls.school_year})
                            </option>
                        ))
                    )}
                </select>
                <p className="mt-2 text-sm text-gray-600 italic">
                    Lưu ý: Nếu gán cho lớp, chỉ học sinh lớp đó mới thấy bài kiểm tra này.
                </p>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                    Chủ đề / Bài học
                </label>
                <select
                    value={testDetails.node}
                    onChange={(e) =>
                        setTestDetails((prev) => ({
                            ...prev,
                            node: e.target.value,
                        }))
                    }
                    disabled={!testDetails.subject || isLoadingNodes}
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none cursor-pointer"
                >
                    <option value="">Kiểm tra tổng hợp / Luyện tập chung</option>
                    {isLoadingNodes ? (
                        <option disabled>Đang tải bài học...</option>
                    ) : (
                        nodes.map((node) => (
                            <option key={node.id} value={node.id}>
                                {node.title}
                            </option>
                        ))
                    )}
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                    Thời gian làm bài (phút)
                </label>
                <input
                    type="number"
                    value={testDetails.timeLimit}
                    onChange={(e) =>
                        setTestDetails((prev) => ({
                            ...prev,
                            timeLimit: parseInt(e.target.value),
                        }))
                    }
                    min="5"
                    max="180"
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded-md focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900"
                />
            </div>
        </div>
    );
}
