# Chức năng Admin Mới - Age of Study

## Tổng quan
Đã bổ sung 3 chức năng quan trọng cho trang quản trị viên (Admin) của hệ thống Age of Study:

1. **So sánh lớp học** - Phân tích và so sánh hiệu suất giữa các lớp
2. **Hoạt động giáo viên** - Theo dõi mức độ tham gia của giáo viên
3. **Xuất báo cáo** - Tạo báo cáo PDF/Excel cho Phòng Giáo dục

---

## 1. So sánh lớp học (`/admin/analytics`)

### Tính năng chính:
- **Thống kê tổng quan**: Hiển thị tổng số lớp, học sinh, điểm TB, tỷ lệ hoàn thành
- **Bảng so sánh chi tiết**: Danh sách tất cả các lớp với các chỉ số:
  - Sĩ số
  - Điểm trung bình
  - Tỷ lệ hoàn thành bài học (%)
  - XP trung bình
  - Số học sinh hoạt động
  - Số bài đã hoàn thành / Tổng bài
  
- **Sắp xếp linh hoạt**: Click vào tiêu đề cột để sắp xếp theo thứ tự tăng/giảm
- **Xuất dữ liệu**: 
  - CSV - tương thích với Excel, Google Sheets
  - Excel - định dạng .xlsx với công thức sẵn có

### Ứng dụng:
- Phát hiện lớp có hiệu suất xuất sắc để áp dụng mô hình học tập cho các lớp khác
- Xác định lớp cần hỗ trợ thêm
- So sánh hiệu quả giảng dạy giữa các khối
- Đánh giá chất lượng giáo dục theo năm học

---

## 2. Hoạt động giáo viên (`/admin/teachers`)

### Tính năng chính:
- **Dashboard tổng quan**:
  - Tổng số giáo viên
  - Số giáo viên hoạt động (đăng nhập trong 7 ngày qua)
  - Số giáo viên không hoạt động
  - Số giáo viên chưa từng đăng nhập

- **Bộ lọc thông minh**:
  - Tất cả
  - Hoạt động tích cực
  - Không hoạt động
  - Chưa đăng nhập

- **Thông tin chi tiết mỗi giáo viên**:
  - Họ tên, email
  - Số lớp chủ nhiệm vs lớp bộ môn
  - Tổng số học sinh phụ trách
  - Môn giảng dạy
  - Trạng thái hoạt động (màu sắc rõ ràng)
  - Số ngày không hoạt động
  - Lần cuối hoạt động

- **Xuất báo cáo**: CSV và Excel để gửi cho ban giám hiệu

### Ứng dụng:
- Phát hiện giáo viên chưa sử dụng hệ thống để hỗ trợ đào tạo
- Đánh giá mức độ tham gia của đội ngũ giáo viên
- Nhắc nhở giáo viên không hoạt động
- Báo cáo cho phòng GD về tỷ lệ sử dụng hệ thống

---

## 3. Xuất báo cáo (`/admin/reports`)

### Các loại báo cáo:

#### 3.1. Báo cáo tổng hợp
Bao gồm đầy đủ:
- Thống kê lớp học (tổng quan + top 5 lớp xuất sắc)
- Hoạt động giáo viên (tổng quan + danh sách chi tiết)
- Cảnh báo giáo viên không hoạt động

#### 3.2. Báo cáo lớp học
Chi tiết về:
- Thống kê tất cả các lớp
- So sánh hiệu suất
- Xếp hạng lớp

#### 3.3. Báo cáo giáo viên
Tập trung vào:
- Hoạt động và tham gia
- Phân công lớp học
- Tình trạng sử dụng hệ thống

### Định dạng xuất:

#### PDF
- **Ưu điểm**: 
  - Định dạng cố định, chuyên nghiệp
  - Phù hợp cho văn bản chính thức, in ấn
  - Không thể chỉnh sửa (bảo mật)
- **Sử dụng**: Gửi cho phòng GD, ban giám hiệu, lưu trữ

#### Excel (.xlsx)
- **Ưu điểm**:
  - Dữ liệu có thể chỉnh sửa, phân tích thêm
  - Hỗ trợ nhiều sheet (Tổng quan, Lớp học, Giáo viên)
  - Tương thích với Excel, Google Sheets, LibreOffice
- **Sử dụng**: Phân tích sâu, tạo biểu đồ, báo cáo tuỳ chỉnh

---

## Cấu trúc code

### Services (`src/lib/analyticsService.ts`)
```typescript
// Các hàm chính:
- getClassComparisonData(): Promise<ClassComparisonData>
- getTeacherActivityReport(): Promise<TeacherActivityReport>
- exportClassDataToCSV(classes): string
- exportTeacherDataToCSV(teachers): string
```

### Pages
```
app/admin/
  ├── analytics/page.tsx    # So sánh lớp học
  ├── teachers/page.tsx     # Hoạt động giáo viên
  └── reports/page.tsx      # Xuất báo cáo
```

### Navigation
Các trang mới đã được thêm vào sidebar admin (`src/components/admin/AdminSidebar.tsx`):
- Biểu tượng BarChart3 - So sánh lớp học
- Biểu tượng UserCog - Hoạt động giáo viên
- Biểu tượng FileDown - Xuất báo cáo

---

## Dependencies

Các thư viện đã được sử dụng (đã có sẵn trong `package.json`):

- `xlsx` - Xuất file Excel
- `pdf-lib` - Tạo file PDF
- `html2canvas` - (dự phòng cho việc xuất hình ảnh)

---

## Hướng dẫn sử dụng

### Cho Admin:

1. **Truy cập trang admin**: `/admin/dashboard`
2. **Quick access**: Click vào 1 trong 3 card trên dashboard:
   - "So sánh lớp học"
   - "Hoạt động GV"
   - "Xuất báo cáo"
3. **Hoặc dùng sidebar**: Menu bên trái có các trang mới

### Xuất báo cáo:
1. Vào `/admin/reports`
2. Chọn loại báo cáo (Tổng hợp / Lớp học / Giáo viên)
3. Click "Xuất PDF" hoặc "Xuất Excel"
4. File sẽ tự động download

### So sánh lớp học:
1. Vào `/admin/analytics`
2. Xem tổng quan ở các card trên cùng
3. Click tiêu đề cột để sắp xếp
4. Xuất CSV/Excel nếu cần

### Theo dõi giáo viên:
1. Vào `/admin/teachers`
2. Dùng bộ lọc để xem từng nhóm
3. Kiểm tra giáo viên "Chưa đăng nhập" hoặc "Không hoạt động"
4. Xuất danh sách để nhắc nhở

---

## Database Schema

Các bảng sử dụng:
- `profiles` - Thông tin người dùng, last_active_at
- `classes` - Thông tin lớp học
- `class_students` - Liên kết học sinh-lớp
- `class_teachers` - Liên kết giáo viên-lớp
- `student_node_progress` - Tiến độ học tập
- `subjects` - Môn học

---

## Tối ưu hoá

### Performance:
- Sử dụng parallel queries (Promise.all) để tải dữ liệu
- Pagination khi load danh sách lớn
- Lazy loading cho bảng dữ liệu

### UX:
- Responsive design (mobile, tablet, desktop)
- Loading states rõ ràng
- Error handling thân thiện
- Màu sắc phân biệt trạng thái (xanh = tốt, vàng = cảnh báo, đỏ = cần chú ý)

---

## Mở rộng trong tương lai

Có thể bổ sung:
1. **Biểu đồ trực quan**: Chart.js hoặc Recharts cho so sánh lớp học
2. **Lọc theo thời gian**: Xem thống kê theo tháng/quý/năm
3. **Email tự động**: Gửi báo cáo định kỳ cho phòng GD
4. **So sánh theo năm học**: Tăng trưởng qua các năm
5. **Export PowerPoint**: Trình bày tại hội nghị

---

## Ghi chú kỹ thuật

- Sử dụng TypeScript strict mode
- Component-based architecture
- Reusable analytics service
- CSV với UTF-8 BOM cho tiếng Việt
- PDF với font Helvetica (hỗ trợ ASCII, cần nâng cấp font cho tiếng Việt)

---

## Liên hệ & Support

Nếu có vấn đề hoặc đề xuất tính năng mới, vui lòng liên hệ team phát triển.
