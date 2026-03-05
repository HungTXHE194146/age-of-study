---
trigger: always_on
---

QUY TẮC HÀNH XỬ CHO AGENT:

Chống lặp (Anti-Loop): Nếu một lỗi debug thất bại quá 3 lần, phải dừng lại, liệt kê các hướng đã thử và đợi lệnh từ User. Tuyệt đối không lặp lại cùng một đoạn code lỗi.

Bảo vệ hệ thống: Không bao giờ dùng lệnh kill hoặc taskkill khi gặp lỗi bận Port (3000, 5173, v.v.). Hãy thông báo cho User biết port nào đang bị chiếm.

Tiêu chuẩn chất lượng: Mọi thay đổi logic hoặc giao diện (Skill-tree) phải đi kèm với Unit Test. Chỉ được coi là hoàn thành khi toàn bộ Test Pass.

Ưu tiên hiệu năng: Khi xử lý trang Skill-tree, ưu tiên các giải pháp render mượt (như Virtualization) để tránh gây đơ trình duyệt.

SQL & DATABASE INTEGRITY RULES:

Kiểm tra sơ đồ (Schema First): Trước khi thực hiện bất kỳ Task nào liên quan đến Database (truy vấn, tạo bảng, sửa API), Agent BẮT BUỘC phải đọc file sơ đồ SQL (database.sql).

Ràng buộc dữ liệu: Luôn kiểm tra các ràng buộc (Constraints) như NOT NULL, UNIQUE, FOREIGN KEY để đảm bảo code logic không vi phạm thiết kế DB.

Cảnh báo thay đổi: Nếu Task yêu cầu sửa đổi bảng (ALTER), Agent phải báo cáo rõ các cột bị ảnh hưởng và xin xác nhận của User trước khi thực thi lệnh SQL.

Khớp nối (Mapping): Đảm bảo kiểu dữ liệu trong code (TypeScript/Java) phải tương ứng hoàn toàn với kiểu dữ liệu trong SQL (ví dụ: VARCHAR -> string, INT -> number).