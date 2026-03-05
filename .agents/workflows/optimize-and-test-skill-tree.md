---
description: Manager kiểm soát Coder
---

Bước 1: Phân tích & Lập kế hoạch (Manager)
Prompt: "Hãy quét các file liên quan đến Skill-tree. Tìm nguyên nhân gây lag (ví dụ: quá nhiều DOM nodes, render lại không cần thiết). Lập danh sách các file cần chỉnh sửa và các hàm Create/Edit cần viết Unit Test."

Mục tiêu: Xác định đúng "bệnh" trước khi sửa.

Bước 2: Viết Test Case (Manager ra lệnh cho Coder)
Prompt: "Dựa trên logic hiện tại của chức năng Create và Edit Node, hãy viết các file test tương ứng (sử dụng Jest hoặc Vitest tùy dự án). Đảm bảo bao phủ các trường hợp: tạo thành công, chỉnh sửa thành công và báo lỗi khi dữ liệu trống.Trong quá trình chạy Workflow, nếu phát hiện code cũ có kiến trúc quá rối rắm không thể tối ưu ngay, hãy ghi chú lại và tạm dừng ở bước đó thay vì cố gắng đập đi xây lại toàn bộ."

Mục tiêu: Có thước đo chính xác để biết code chạy đúng hay sai.

Kịch bản Test cho chức năng Create/Edit Node

Test Create (Tạo mới):

Input hợp lệ: Điền đầy đủ Title, Description, Parent Node -> Hệ thống phải trả về ID mới và hiển thị trên cây.

Input trống: Để trống Title -> Hệ thống phải báo lỗi "Title is required" thay vì crash.

Node trùng lặp: Tạo 2 node cùng tên ở cùng một cấp -> Hệ thống cần cảnh báo.

Test Edit (Chỉnh sửa):

Update dữ liệu: Thay đổi Title của node hiện tại -> Kiểm tra xem DB và UI có cập nhật đồng bộ không.

Thay đổi cấp độ (Parent change): Chuyển một node con sang một node cha khác -> Cấu trúc cây (Tree structure) phải cập nhật đúng.

Test Hiệu năng (Sau khi tối ưu):

Khối lượng lớn: Render thử 100-500 nodes cùng lúc -> Thời gian phản hồi (Frame rate) phải ổn định, không được gây đơ trình duyệt quá 500ms.

Bước 3: Tối ưu UI & Triển khai logic (Coder thực hiện)
Prompt: "Thực hiện tối ưu hóa render cho Skill-tree (ưu tiên dùng Virtual Scrolling hoặc React.memo nếu là React). Sau đó, điều chỉnh code Create/Edit sao cho vượt qua toàn bộ các Unit Test đã viết ở Bước 2."

Mục tiêu: Code vừa chạy nhanh, vừa chạy đúng.

Bước 4: Kiểm chứng & Tổng hợp (Manager)
Prompt: "Chạy toàn bộ Unit Test. Kiểm tra thời gian render của component Skill-tree sau khi tối ưu. Nếu có lỗi, thực hiện vòng lặp sửa lỗi (tối đa 3 lần). Cuối cùng, tóm tắt kết quả: những gì đã sửa, kết quả test, và những gì User cần lưu ý."