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
    type: string;
    showHints?: boolean;
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
    const [showAdvanced, setShowAdvanced] = useState(false);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
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
                        placeholder="Ví dụ: Bài tập Tiếng Việt Tuần 12"
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
                                node: "",
                            }));

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
                        Giao cho lớp
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
                                    Lớp {cls.name}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                        Loại bài <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={testDetails.type}
                        onChange={(e) =>
                            setTestDetails((prev) => ({
                                ...prev,
                                type: e.target.value,
                            }))
                        }
                        className="w-full px-4 py-3 bg-blue-50 border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900 transition-all hover:-translate-y-0.5 appearance-none cursor-pointer"
                        required
                    >
                        <option value="homework">🏠 Bài tập về nhà</option>
                        <option value="review">📚 Ôn tập kiến thức</option>
                        <option value="exam">🏆 Kiểm tra định kỳ</option>
                        <option value="practice">🎯 Luyện tập tự do</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                        Thời gian (phút)
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
                        className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:border-blue-600 shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-gray-900"
                    />
                </div>
            </div>

            {/* Toggle Advanced Settings */}
            <div className="pt-2">
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-blue-600 font-bold flex items-center gap-1 hover:underline text-sm"
                >
                    {showAdvanced ? "▼ Thu gọn cài đặt" : "▶ Thiết lập nâng cao (Mô tả, Bài học cụ thể...)"}
                </button>
            </div>

            {showAdvanced && (
                <div className="space-y-6 pt-4 border-t-2 border-dashed border-gray-200">
                    <div>
                        <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                            Mô tả chi tiết
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
                            placeholder="Nhập ghi chú cho học sinh (nếu có)..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-800 uppercase mb-2">
                            Gắn với Bài học cụ thể
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
                            <option value="">Kiểm tra tổng hợp / Không chọn bài cụ thể</option>
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
                        <p className="mt-2 text-xs text-gray-500 font-bold italic">
                            Chỉ chọn nếu bài kiểm tra này dành riêng cho một bài học/chủ đề nhất định.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl shadow-sm">
                        <div className="flex items-center h-6">
                            <input
                                id="show-hints-toggle"
                                type="checkbox"
                                checked={testDetails.showHints || false}
                                onChange={(e) =>
                                    setTestDetails((prev) => ({
                                        ...prev,
                                        showHints: e.target.checked,
                                    }))
                                }
                                className="w-5 h-5 text-indigo-600 bg-white border-2 border-black rounded focus:ring-indigo-500"
                            />
                        </div>
                        <div className="text-sm">
                            <label htmlFor="show-hints-toggle" className="font-bold text-indigo-900 cursor-pointer">
                                Hiển thị gợi ý cho học sinh 🦉
                            </label>
                            <p className="text-indigo-600 text-xs font-semibold">
                                Khi bật, học sinh sẽ thấy gợi ý nếu trả lời sai thay vì chỉ nhận lời động viên.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
