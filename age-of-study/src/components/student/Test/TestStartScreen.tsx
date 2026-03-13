"use client";

import { TestWithQuestions } from "@/types/test";
import { Button } from "@/components/ui/button";

interface TestStartScreenProps {
    test: TestWithQuestions;
    onStart: () => void;
}

export default function TestStartScreen({ test, onStart }: TestStartScreenProps) {
    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-slate-800 max-w-4xl mx-auto transform -rotate-1 text-center">
            <h2 className="text-3xl font-black mb-8 uppercase tracking-widest text-slate-800">Sẵn sàng bắt đầu?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
                <div className="bg-blue-50 p-6 rounded-2xl border-2 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform rotate-1">
                    <h4 className="font-bold text-lg mb-3 uppercase text-slate-800">Hướng dẫn</h4>
                    <ul className="text-slate-600 font-medium space-y-2">
                        <li>• Đọc kỹ từng câu hỏi</li>
                        <li>• Chọn đáp án đúng nhất</li>
                        <li>• Có thể chuyển đổi các câu</li>
                        <li>• Nộp bài khi hoàn thành</li>
                    </ul>
                </div>
                <div className="bg-green-50 p-6 rounded-2xl border-2 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-2">
                    <h4 className="font-bold text-lg mb-3 uppercase text-slate-800">Thời gian</h4>
                    <p className="text-slate-600 font-medium leading-relaxed">
                        Bạn có <strong>{test.settings.time_limit} phút</strong> để hoàn thành. Thời gian bắt đầu đếm ngược khi nhấn Bắt
                        đầu.
                    </p>
                </div>
                <div className="bg-purple-50 p-6 rounded-2xl border-2 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform rotate-2">
                    <h4 className="font-bold text-lg mb-3 uppercase text-slate-800">Điểm số</h4>
                    <p className="text-slate-600 font-medium leading-relaxed">
                        Điểm được tính dựa trên số câu đúng. Bạn cần ≥ 50% để hoàn thành bài.
                    </p>
                </div>
            </div>
            <Button
                onClick={onStart}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-2xl border-4 border-slate-800 shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1.5 transition-all px-12 py-4 text-xl"
            >
                BẮT ĐẦU LÀM BÀI
            </Button>
        </div>
    );
}
