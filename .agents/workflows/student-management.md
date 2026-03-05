---
description: Quản lý lớp học và học sinh cho giáo viên
---

MISSION: STUDENT MANAGEMENT FOR RURAL TEACHERS

Ngữ cảnh: Hiện tại đã có chức năng quản lý lớp nhưng chưa được ưng ý

Mục tiêu: 
Xây dựng module quản lý lớp học cực kỳ đơn giản, tối ưu cho thiết bị cấu hình thấp.

Chỉ tập trung vào module quản lý học sinh. Tuyệt đối không tự ý sửa các file trong thư mục /skill-tree vì đang có một Agent khác phụ trách phần đó. Nếu cần tương tác chung vào DB, hãy báo cho tôi.
Cấu trúc Database: Cần liên kết bảng Users (Học sinh) với Lessons_Log (Nhật ký) và Grades (Điểm số).

Tính năng bắt buộc:

Dashboard hiển thị tổng thời gian học trong ngày của cả lớp.

Chi tiết từng học sinh: Xem lịch sử đăng nhập (Timestamp), danh sách Node đã hoàn thành, và kết quả bài Test gần nhất.

Chức năng "Hôm nay học gì?": Tóm tắt nhanh những Node mà đa số học sinh trong lớp đang bị kẹt lại.

Kỹ thuật: Sử dụng kỹ thuật Lazy Loading cho danh sách học sinh để máy yếu không bị đứng hình khi load lớp đông.