"use client";

import { useEffect, useState } from "react";
import {
  NotebookCard,
  NotebookCardHeader,
  NotebookCardTitle,
  NotebookCardContent,
} from "@/components/ui/notebook-card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import {
  User,
  Phone,
  Shield,
  Palette,
  LogOut,
  KeyRound,
  Save,
  Loader2
} from "lucide-react";
import UserAvatar from "@/components/admin/UserAvatar";
import { useRouter } from "next/navigation";
import { MFASettings } from "@/components/auth/MFASettings";

export default function TeacherSettingsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    dob: "",
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        phone_number: (user as any).phone_number || "",
        dob: (user as any).dob || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage({ type: "", text: "" });
    // Simulate API call for saving profile
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage({ type: "success", text: "Đã lưu thông tin thành công!" });
      setTimeout(() => setSaveMessage({ type: "", text: "" }), 3000);
    }, 1000);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black font-handwritten text-gray-900 mb-2 drop-shadow-sm">
          Cài đặt chung
        </h1>
        <p className="text-gray-600 font-bold font-handwritten text-lg">
          Quản lý tài khoản, giao diện và các tùy chọn hệ thống
        </p>
      </div>

      {/* Profile Card */}
      <NotebookCard className="bg-[#fffdf8]">
        <NotebookCardHeader className="border-b-2 border-dashed border-gray-300 pb-4 mb-6 bg-blue-50/50">
          <NotebookCardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 border-2 border-black rounded-full flex items-center justify-center -rotate-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <User className="w-5 h-5 text-blue-800" />
            </div>
            <span className="text-2xl font-black">Thông Tin Cá Nhân</span>
          </NotebookCardTitle>
        </NotebookCardHeader>
        
        <NotebookCardContent>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar Section - Polaroid Style */}
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-3 border-2 border-gray-300 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] rotate-2 hover:rotate-0 transition-transform duration-300">
                <UserAvatar
                  avatarUrl={user.avatar_url}
                  name={user.full_name}
                  username={user.username}
                  size="lg"
                />
                <div className="mt-3 text-center text-sm font-handwritten font-bold text-gray-500">
                  Ảnh đại diện
                </div>
              </div>
              <Button variant="outline" className="border-2 border-black font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                Đổi ảnh
              </Button>
            </div>

            {/* Form Section */}
            <div className="flex-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider font-handwritten text-lg">Họ và Tên</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-transparent border-b-2 border-dashed border-gray-400 focus:border-blue-600 focus:outline-none transition-colors font-bold text-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider font-handwritten text-lg">Mã Giáo Viên (Username)</label>
                  <input
                    type="text"
                    value={user.username || ""}
                    disabled
                    className="w-full px-4 py-2 bg-gray-50/50 border-b-2 border-dashed border-gray-300 text-gray-500 font-mono font-bold cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider font-handwritten text-lg">Vai trò</label>
                  <div className="w-full px-4 py-2 bg-transparent border-b-2 border-dashed border-gray-400 font-bold text-indigo-700">
                     Giáo Viên
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider font-handwritten text-lg">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-0 top-3 text-gray-400 w-4 h-4 hidden" />
                    <input
                      type="text"
                      name="phone_number"
                      placeholder="Thêm số điện thoại..."
                      value={formData.phone_number}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-transparent border-b-2 border-dashed border-gray-400 focus:border-blue-600 focus:outline-none transition-colors font-bold text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t-2 border-dashed border-gray-200">
                <div className="text-sm font-bold min-h-[20px]">
                   {saveMessage.text && (
                     <span className={saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}>
                       {saveMessage.text}
                     </span>
                   )}
                </div>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-[#ffde59] hover:bg-[#efce49] text-black border-2 border-black font-black px-8 py-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[0_0_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu Thay Đổi
                </Button>
              </div>
            </div>
          </div>
        </NotebookCardContent>
      </NotebookCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Appearance & Preferences */}
        <NotebookCard className="bg-[#fffdf8]">
          <NotebookCardHeader className="border-b-2 border-dashed border-gray-300 pb-4 mb-4 bg-orange-50/50">
            <NotebookCardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 border-2 border-black rounded-full flex items-center justify-center rotate-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <Palette className="w-5 h-5 text-orange-800" />
              </div>
              <span className="text-2xl font-black">Giao Diện & Hiển Thị</span>
            </NotebookCardTitle>
          </NotebookCardHeader>
          <NotebookCardContent className="space-y-6">
            
            <div className="flex items-center justify-between p-3 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-bold text-gray-900 font-handwritten text-xl">Chế độ Sổ tay (Notebook Theme)</p>
                <p className="text-sm text-gray-500 font-medium mt-1">Giao diện giấy nháp, font chữ viết tay dễ nhìn.</p>
              </div>
              {/* Mock Toggle - Always On for Notebook theme */}
              <div className="w-12 h-6 bg-green-400 rounded-full border-2 border-black relative shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]">
                <div className="absolute right-0 top-0 bottom-0 w-6 bg-white border-l-2 border-black rounded-full transform scale-110 shadow-sm border-2"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-bold text-gray-900 font-handwritten text-xl">Chế độ tối (Dark Mode)</p>
                <p className="text-sm text-gray-500 font-medium mt-1">Giảm độ sáng màn hình khi làm việc đêm.</p>
              </div>
              {/* Mock Toggle - Currently Off */}
              <div className="w-12 h-6 bg-gray-200 rounded-full border-2 border-black relative shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]">
                <div className="absolute left-0 top-0 bottom-0 w-6 bg-white border-r-2 border-black rounded-full transform scale-110 shadow-sm border-2"></div>
              </div>
            </div>

          </NotebookCardContent>
        </NotebookCard>

        {/* Security & System */}
        <NotebookCard className="bg-[#fffdf8]">
          <NotebookCardHeader className="border-b-2 border-dashed border-gray-300 pb-4 mb-4 bg-red-50/50">
            <NotebookCardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 border-2 border-black rounded-full flex items-center justify-center -rotate-6 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <Shield className="w-5 h-5 text-red-800" />
              </div>
              <span className="text-2xl font-black">Bảo Mật Hệ Thống</span>
            </NotebookCardTitle>
          </NotebookCardHeader>
          <NotebookCardContent className="space-y-6">
            
            <div className="p-4 border-2 border-black rounded-xl bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-2">
                <KeyRound className="w-5 h-5 text-gray-700" />
                <p className="font-bold text-lg">Mật khẩu tài khoản</p>
              </div>
              <p className="text-sm text-gray-600 mb-4">Thay đổi mật khẩu định kỳ để bảo vệ dữ liệu lớp học.</p>
              <Button className="w-full bg-gray-800 hover:bg-black text-white font-bold border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,0.5)]">
                Đổi Mật Khẩu Mới
              </Button>
            </div>

            <div className="p-4 border-2 border-red-300 rounded-xl bg-red-50/30">
              <div className="flex items-center gap-3 mb-2">
                <LogOut className="w-5 h-5 text-red-600" />
                <p className="font-bold text-lg text-red-700">Đăng xuất</p>
              </div>
              <p className="text-sm text-red-600/80 mb-4">Đăng xuất khỏi thiết bị này. Bạn sẽ cần nhập lại mật khẩu khi quay lại.</p>
              <Button 
                onClick={handleLogout}
                variant="danger" 
                className="w-full bg-red-100 hover:bg-red-200 text-red-800 border-2 border-red-500 font-bold shadow-[2px_2px_0_0_rgba(239,68,68,1)]"
              >
                Đăng Xuất Ngay
              </Button>
            </div>

          </NotebookCardContent>
        </NotebookCard>
      </div>

      {/* MFA Security Card */}
      <NotebookCard className="bg-[#fffdf8]">
        <NotebookCardHeader className="border-b-2 border-dashed border-gray-300 pb-4 mb-6 bg-green-50/50">
          <NotebookCardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 border-2 border-black rounded-full flex items-center justify-center rotate-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <Shield className="w-5 h-5 text-green-800" />
            </div>
            <span className="text-2xl font-black">Xác Thực 2 Yếu Tố (2FA)</span>
          </NotebookCardTitle>
        </NotebookCardHeader>
        
        <NotebookCardContent>
          <MFASettings userId={user.id} />
        </NotebookCardContent>
      </NotebookCard>

    </div>
  );
}
