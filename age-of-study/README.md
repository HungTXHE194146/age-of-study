# ageOfStudy Vietnam

Nền tảng học tập gamified dành cho học sinh tiểu học Việt Nam, lấy cảm hứng từ Duolingo.

## 🎯 Tính Năng Chính

### 🌳 Cây Kỹ Năng (Skill Tree)
- **3 nhánh môn học**: Toán, Tiếng Anh, Tiếng Việt
- **Hệ thống mở khóa**: Học sinh cần đạt đủ điểm để mở khóa các node tiếp theo
- **Tiến độ trực quan**: Hiển thị rõ ràng mức độ hoàn thành và yêu cầu

### ⚔️ Trận Chiến Kiến Thức (Battle Mode)
- **Đối kháng trực tiếp**: Hai học sinh thi đấu trả lời câu hỏi
- **Cơ chế máu**: Câu trả lời đúng giảm máu đối thủ, sai bị giảm máu
- **Thời gian giới hạn**: Tạo cảm giác hồi hộp, thúc đẩy phản xạ nhanh

### 🏆 Bảng Xếp Hạng
- **Toàn quốc**: So sánh điểm số với các học sinh khác
- **Theo môn**: Xếp hạng riêng cho từng môn học
- **Thống kê chi tiết**: Điểm trung bình, người dẫn đầu, v.v.

### 👥 Phân Quyền Người Dùng
- **Học sinh**: Truy cập đọc, học tập, tham gia trận chiến
- **Giáo viên**: Quản lý cây kỹ năng, tạo bài kiểm tra (chuẩn bị triển khai)

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **Next.js 14+** (App Router)
- **TypeScript** cho type safety
- **Tailwind CSS** + **Framer Motion** cho giao diện đẹp mắt, hiệu ứng mượt mà
- **Zustand** cho quản lý state thời gian thực

### Backend & Database
- **Supabase** (PostgreSQL) cho database và authentication
- **Role-Based Access Control** (RBAC) cho phân quyền

### Thư Viện Khác
- **Lucide-react** cho icons
- **React Hook Form** cho form validation
- **React Query** cho data fetching

## 🚀 Cài Đặt

### Yêu Cầu Hệ Thống
- Node.js 18+
- npm hoặc yarn

### Cài Đặt

```bash
# Clone repository
git clone <repository-url>
cd age-of-study

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Mở trình duyệt tại http://localhost:3000
```

### Cấu Hình Môi Trường

Tạo file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📁 Cấu Trúc Dự Án

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Trang dashboard học sinh
│   ├── battle/            # Trang trận chiến
│   └── page.tsx           # Trang chủ
├── components/            # Các component UI
│   ├── SkillNode.tsx      # Node trong cây kỹ năng
│   ├── BattleArena.tsx    # Sân đấu trận chiến
│   ├── ProgressBar.tsx    # Thanh tiến độ
│   └── Leaderboard.tsx    # Bảng xếp hạng
├── lib/                   # Thư viện và utilities
│   └── supabase.ts        # Cấu hình Supabase
├── store/                 # Zustand stores
│   └── useAuthStore.ts    # Quản lý authentication
├── constants/             # Dữ liệu mock và hằng số
│   └── mockData.ts        # Dữ liệu mẫu cây kỹ năng
└── types/                 # TypeScript interfaces
```

## 🎮 Cách Sử Dụng

### Đối Với Học Sinh
1. **Đăng nhập** vào hệ thống
2. **Chọn môn học** muốn học (Toán, Tiếng Anh, Tiếng Việt)
3. **Hoàn thành các node** trong cây kỹ năng để kiếm điểm
4. **Thách đấu bạn bè** trong chế độ Battle
5. **Theo dõi tiến độ** trên bảng xếp hạng

### Đối Với Giáo Viên (Chuẩn Bị Triển Khai)
1. **Quản lý cây kỹ năng** cho từng lớp
2. **Tạo và chỉnh sửa bài kiểm tra**
3. **Theo dõi tiến độ học tập** của học sinh
4. **Phân tích dữ liệu** để điều chỉnh phương pháp dạy

## 🎨 Thiết Kế Giao Diện

### Màu Sắc Chủ Đạo
- **Primary**: Xanh dương (#3b82f6)
- **Math**: Đỏ (#ef4444)
- **English**: Xanh lá (#22c55e)
- **Vietnamese**: Vàng (#eab308)

### Hiệu Ứng
- **Framer Motion** cho các animation mượt mà
- **Hover effects** trên các node kỹ năng
- **Transition smooth** khi chuyển đổi trạng thái

## 🔮 Kế Hoạch Phát Triển

### Giai Đoạn 1 (Đã Hoàn Thành)
- [x] Khởi tạo dự án Next.js với TypeScript
- [x] Thiết kế hệ thống cây kỹ năng 3 nhánh
- [x] Triển khai chế độ trận chiến cơ bản
- [x] Tích hợp hệ thống điểm và bảng xếp hạng

### Giai Đoạn 2 (Sắp Triển Khai)
- [ ] **Authentication thực tế** với Supabase
- [ ] **Database schema** hoàn chỉnh
- [ ] **CRUD cho giáo viên** (quản lý cây kỹ năng, bài kiểm tra)
- [ ] **Multiplayer real-time** trận chiến

### Giai Đoạn 3 (Tương Lai)
- [ ] **Mobile app** (React Native)
- [ ] **AI-powered recommendations** học tập
- [ ] **Parent dashboard** cho phụ huynh
- [ ] **Integration với trường học**

## 🤝 Đóng Góp

Chúng tôi rất hoan nghênh sự đóng góp từ cộng đồng! Hãy fork repository và gửi pull request.

## 📄 Giấy Phép

Dự án này được cấp phép theo giấy phép MIT - xem chi tiết trong file [LICENSE](LICENSE).

## 🙏 Cảm Ơn

Cảm ơn bạn đã quan tâm đến dự án ageOfStudy Vietnam! Cùng nhau chúng ta sẽ tạo nên một nền tảng học tập tuyệt vời cho thế hệ trẻ Việt Nam.

---

**Liên hệ**: [email@example.com] | **Website**: [ageofstudy.vn]