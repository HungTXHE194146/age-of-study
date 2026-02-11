SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

Trường Tiểu Học Ninh Lai
Age Of Study
Dự án: Nền tảng Học tập Gamification Hỗ trợ bởi AI (AI-Powered Gamified Learning Platform)
Phiên bản: 1.0 - Bản dành cho Cuộc thi Sáng tạo AI 2025-2026.

1. TỔNG QUAN HỆ THỐNG
   1.1. Mục tiêu sản phẩm
   Giải quyết vấn đề: Giáo viên mất quá nhiều thời gian soạn đề trắc nghiệm thủ công; Học sinh tiểu học thiếu hứng thú với các bài tập về nhà khô khan.
   Giải pháp: Sử dụng AI (model Gemini 2.5 Flash ) để tự động hóa quy trình soạn đề từ tài liệu dạy học, kết hợp với cơ chế Gamification (Trò chơi hóa) để kích thích học tập.
   Tuân thủ quy chế: Đảm bảo quy trình "Human-in-the-loop" (AI gợi ý -> Con người duyệt -> Hệ thống thực thi).
   1.2. Công nghệ sử dụng
   Backend: NextJS 16
   Frontend: NextJS + Tailwind CSS (Student UI).
   Database: Supabase (Lưu trữ cấu trúc câu hỏi, người dùng, lịch sử).   AI Model: Google Gemini 2.5 Flash (Xử lý Context Window lớn, chi phí thấp, tốc độ cao).

2. PHÂN TÍCH ĐỐI TƯỢNG SỬ DỤNG (USER ROLES)
   Role
   Quyền hạn & Trách nhiệm
   Giao diện
   Admin (Giáo viên)

- Upload tài liệu nguồn.

Ra lệnh cho AI tạo câu hỏi.
Duyệt/Sửa/Xóa câu hỏi trước khi xuất bản.
Xem báo cáo thống kê lớp học. | Dashboard quản trị (PC/Laptop). | | User (Học sinh) | - Chơi game trắc nghiệm.
Xem bảng xếp hạng, profile.
Chat với "Gia sư AI" (trong phạm vi bài học).
Không có quyền truy cập cấu hình hệ thống. | Mobile-first Web App (Tablet/Phone). |

3. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)
   MODUN 1: QUẢN TRỊ NỘI DUNG & AI (Admin - Teacher)
   FR-1.1: Quản lý Tài liệu Nguồn (Knowledge Base)
   Input: Hỗ trợ file .pdf, .docx, .txt và ảnh chụp tài liệu (Scanned Image/Handwritten).
   Xử lý (Processing):
   Sử dụng khả năng Multimodal (Đa phương thức) của Gemini để đọc hiểu cả văn bản và hình ảnh (biểu đồ, công thức toán học) trong file PDF.
   Trích xuất nội dung sạch (Clean Text Extraction) để làm Context cho vector database.
   FR-1.2: AI Content Generation (Sinh nội dung tự động)
   Input: Văn bản trích xuất + Prompt của giáo viên (VD: "Tạo 10 câu khó về phân số").
   Process: Gọi Gemini API với System Prompt quy định định dạng JSON.
   Output: Trả về danh sách câu hỏi dạng thẻ (Card) bao gồm: Câu hỏi, 4 đáp án, Đáp án đúng, Giải thích chi tiết.
   Trạng thái mặc định: PENDING_REVIEW (Chờ duyệt) - Đáp ứng tiêu chí kiểm soát của con người .
   FR-1.3: Quy trình Duyệt & Chỉnh sửa (The "Human-in-the-loop" Interface)
   Giao diện: Màn hình chia đôi (Split Screen). Bên trái là khung Chat với AI, bên phải là danh sách câu hỏi PENDING.
   Chức năng:
   Edit: Giáo viên sửa lại nội dung nếu AI sinh chưa chuẩn.
   Regenerate: Yêu cầu AI sinh lại câu cụ thể.
   Approve (Duyệt): Chuyển trạng thái sang PUBLISHED (Đã xuất bản). Chỉ câu hỏi này mới hiện cho học sinh.
   FR-1.4: Quản lý Lớp học & Kết nối (Classroom Management)
   Tạo lớp (Teacher): Giáo viên tạo lớp học mới (VD: "Toán Lớp 5A"). Hệ thống sinh ra Mã tham gia (Class Code) gồm 8 ký tự (minimum) ngẫu nhiên, case-sensitive, sử dụng bộ ký tự [0-9A-Za-z] (62 ký tự, ~48 bits entropy cho 8 ký tự). Ví dụ: X7z9A2mK.
   Security Requirements cho Class Code:
   - Character Set: 0-9, A-Z, a-z (case-sensitive, 62 possible characters)
   - Minimum Length: 8 characters (configurable to 10-12 for higher security)
   - Rate Limiting: Maximum 5 join attempts per IP address per 10 minutes
   - Automatic Expiration: Unused codes expire after 90 days, stale codes (no active students in 180 days) can be revoked by teacher
   - Expected Scale: Support 100-500 concurrent active classes per school deployment
   Tham gia (Student): Học sinh nhập Class Code để tham gia lớp.
   Phê duyệt: Giáo viên có quyền duyệt (Approve) hoặc chặn (Block) học sinh ra khỏi lớp.
   MODUN 2: HỌC TẬP & GAMIFICATION (User - Student)
   Đây là "trái tim" của hệ thống, tạo ra tác động thực tiễn.
   FR-2.1: Game Trắc nghiệm (Quiz Arena)
   Logic: Random lấy câu hỏi PUBLISHED từ Database.
   Game Mechanics (Cơ chế Game)
   Hệ thống điểm (Scoring Rules):
   Câu Dễ (Easy): +10 XP.
   Câu Trung bình (Medium): +20 XP.
   Câu Khó (Hard): +30 XP.
   Combo Bonus: Trả lời đúng liên tiếp 5 câu -> x1.2 hệ số điểm.
   Hình phạt (Penalty): Trả lời sai không bị trừ XP, nhưng sẽ mất chuỗi Combo.
   UI/UX:
   Hiển thị 1 câu hỏi/màn hình với 4 nút bấm lớn.
   Feedback: Chọn đúng -> Hiệu ứng pháo hoa + Âm thanh vui. Chọn sai -> Rung màn hình → Sai quá số lần quy định thì sẽ hiện "Giải thích" từ giáo viên/AI.
   Timer: Đếm ngược (ví dụ 15s/câu).
   FR-2.2: Hệ thống Động lực (Motivation System)
   Streak (Chuỗi ngày): Tính bằng việc hoàn thành ít nhất 1 bài học (Session > 5 phút) mỗi ngày.
   Streak Freeze (Đóng băng):
   Học sinh có thể dùng 500 XP tích lũy để mua 1 vật phẩm "Streak Freeze" trong cửa hàng ảo.
   Tự động kích hoạt để bảo vệ chuỗi nếu học sinh quên học 1 ngày.
   Leaderboard: Reset vào 00:00 Thứ Hai hàng tuần. Top 3 học sinh nhận Badge "Thần đồng tuần" (+100 XP thưởng).
   Badges (Huy hiệu): Tự động cấp huy hiệu khi đạt mốc (VD: "Ong chăm chỉ" - 7 ngày streak).
   FR-2.3: Trợ lý "Gia sư Cú Mèo" (AI Tutor Chatbot)
   Nguyên tắc: Chỉ hoạt động dựa trên RAG (Retrieval-Augmented Generation).
   Logic an toàn:
   Nếu học sinh hỏi trong bài -> AI trả lời bằng phương pháp gợi mở (Scaffolding).
   Nếu học sinh hỏi ngoài bài/nhạy cảm -> AI từ chối trả lời (Fallback response).
   MODUN 3: AN TOÀN & KIỂM SOÁT (Safety & Wellbeing)
   Đáp ứng tiêu chí an toàn thông tin và đạo đức AI.
   
   FR-3.1: Giới hạn thời gian (Parental Control)
   Authentication & Authorization Flow:
   - User Roles: Teacher, Parent, System Admin accounts are verified via email/SMS 2FA during account creation
   - School-admin managed role assignments: System Admin assigns Teacher and Parent roles; Teachers cannot self-assign heightened privileges
   - Parent accounts must be linked to student accounts through school-verified email or phone number confirmation
   
   Time Limit Configuration:
   - Who Can Configure: Teachers, Parents (of linked students), and System Admins can set "daily_limit_minutes" parameter
   - Configuration UI: Accessible only after 2FA re-authentication for sensitive changes
   - Configurable Parameters: daily_limit_minutes (default: 30), weekly_limit_minutes, session_timeout_minutes
   
   Enforcement & Anti-Bypass:
   - Session Binding: Each student session is cryptographically bound to unique device/account identifiers (device fingerprint + auth token)
   - Secure Session Tokens: JWT tokens signed with server-side secret, include student_id, device_id, issued_at, expires_at; tokens expire after daily limit reached
   - Server-Side Time Tracking: All study time logged server-side via authenticated API calls; client cannot forge timestamps
   - Device/Account Lock: Once limit exceeded, student account is temporarily locked on that device until next day (00:00 local time)
   
   Audit & Recovery:
   - Audit Logging: All time limit changes, bypass attempts, and session expirations logged with timestamp, user_id, IP, and action
   - Change Confirmation: Any modification to time limits requires parent/teacher 2FA confirmation via email/SMS code
   - Recovery/Override: System Admin can grant temporary overrides (e.g., for makeup sessions) with logged justification
   - Lockout Procedure: After 3 failed bypass attempts, student account flagged for manual review by teacher/admin
   
   Hệ thống tự động đếm thời gian session của học sinh.
   Nếu > configured daily_limit_minutes -> Khóa chức năng chơi game, hiện thông báo nhắc nhở nghỉ ngơi.
   
   FR-3.2: Bộ lọc nội dung (Content Filtering)
   System Prompt của AI được cấu hình để chặn các từ khóa bạo lực, người lớn, hoặc gian lận thi cử.
   
   FR-3.3: Student Privacy (PII Handling)
   - Personal Identifiable Information (PII): full_name, date_of_birth stored with AES-256 encryption at rest
   - Data Minimization: Only collect essential data (username, full_name, grade level); avoid collecting sensitive data (religion, ethnicity) unless legally required
   - Encryption in Transit: All API communications use TLS 1.3+
   - Role-Based Access Control (RBAC): Students can only view own data; Teachers view students in their classes; Parents view linked children; Admins have full access with audit logging
   - Acceptance Criteria: Penetration test confirms no PII exposure via API without proper auth; audit log records all PII access
   
  
   
   FR-3.5: Data Retention & Deletion
   - Retention Periods: Active student data retained during enrollment + 1 year after graduation/withdrawal; audit logs retained 3 years
   - Right to be Forgotten: Users/parents can request full account deletion via authenticated form; system executes deletion within 30 days
   - Automated Deletion: Inactive accounts (no login >5 years) automatically anonymized (PII removed, study data aggregated for analytics)
   - Archival Procedures: Before deletion, system generates exportable archive for user; after export, data hard-deleted from production DB and backups rotated
   - Acceptance Criteria: Deletion request tracked in audit log; post-deletion verification confirms no PII in DB or backups
   
   FR-3.6: Legal Compliance & Data Export
   - GDPR/Local Law Compliance: System designed for Vietnam Education Data regulations + GDPR readiness (if applicable)
   - Data Subject Access Requests (DSAR): Users can request full data export via authenticated portal
   - Exportable Format: JSON or CSV format containing all user data (profile, progress, quiz attempts, chat logs) delivered within 30 days
   - Legal Documentation: Privacy Policy and Terms of Service clearly state data collection, usage, retention, third-party sharing (if any)
   - Acceptance Criteria: DSAR feature tested; export contains all user data; legal docs reviewed by counsel
   
   FR-3.7: Security & Audit
   - Comprehensive Logging: All authentication attempts, role changes, data access, PII modifications logged with user_id, IP, timestamp, action
   - Breach Notification: In case of data breach, system can generate affected user list within 24 hours; notifications sent within 72 hours per legal requirements
   - Regular Security Reviews: Quarterly security audits and penetration testing; annual privacy impact assessment
   - Incident Response Plan: Documented procedures for breach detection, containment, user notification, and post-incident review
   - Acceptance Criteria: Security audit checklist completed; breach simulation drill passed; audit logs queryable and exportable

4. LUỒNG DỮ LIỆU & AI (DATA & AI FLOW)
   Phần này dùng để vẽ sơ đồ Data Flow trong hồ sơ dự thi.
   Bước 1 (Input): Giáo viên Upload PDF -> Server (Next) lưu file -> Trích xuất Text.
   Bước 2 (Processing): Server ghép Text + System Prompt -> Gửi request tới Gemini API.
   Bước 3 (Drafting): Gemini trả về JSON Array -> Server lưu vào DB với trạng thái PENDING.
   Bước 4 (Verification): Giáo viên truy cập Admin Dashboard -> Đọc, Sửa, Duyệt -> Server update trạng thái thành PUBLISHED.
   
   Node Definition:
   - "Node" refers to a learning unit or skill point in the curriculum skill tree (e.g., "Phân số cơ bản", "Chia có dư"). Each node represents a discrete content block containing related questions/documents.
   - "Fixed Node" = A system-provided, read-only node template created at initial platform release. Fixed nodes are immutable: they cannot be edited or deleted via Admin Dashboard. They serve as the core curriculum structure.
   - Node Types: "fixed" (immutable system templates) vs "custom" (teacher-created, editable)
   
   Release Roadmap:
   - Initial Release (v1.0): All nodes are "fixed nodes" pre-populated by system. Teachers can only assign questions to existing fixed nodes and approve/publish content.
   - Future Releases (v1.1+): Teachers will gain capabilities to:
     * Create new custom nodes under existing subject branches
     * Edit properties of custom nodes (title, description, required_xp, position)
     * Choose from a predefined library of node templates (e.g., "Quiz", "Reading", "Practice")
     * Duplicate existing nodes as starting templates
     * Custom nodes remain editable/deletable; fixed nodes remain immutable
   
   Admin Dashboard Publish/Unpublish Operations:
   - Affected Node Types: Publish/Unpublish operations apply to questions within both fixed and custom nodes
   - Node-level Operations: For custom nodes only, Admin can archive (soft delete) or restore nodes; fixed nodes cannot be archived
   - (Các node ở release đầu tiên sẽ là fixed node, release sau giáo viên có thể thêm được custom node)
   Bước 5 (Delivery): Học sinh mở App -> Client (Next) gọi API lấy câu hỏi PUBLISHED -> Hiển thị Game.
   Bước 6 (Feedback): Học sinh trả lời xong -> Server tính điểm -> Cập nhật Leaderboard/Streak.

5. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)
   Hiệu năng: API sinh câu hỏi phản hồi < 10s. API chơi game phản hồi < 200ms.
   Độ tin cậy: Xử lý ngoại lệ (Exception Handling) khi AI trả về JSON lỗi (tự động retry hoặc thông báo giáo viên).
   Bảo mật: Mật khẩu mã hóa BCrypt. API được bảo vệ bằng JWT Token. Phân quyền Admin/User chặt chẽ.

6. SYSTEM PROMPTS (CẤU HÌNH AI)
   Đây là phần bắt buộc phải công khai trong hồ sơ.
   6.1. Prompt Sinh Câu Hỏi (Dành cho Admin)
   "Bạn là một chuyên gia sư phạm tiểu học và chuyên gia JSON. Nhiệm vụ: Dựa vào nội dung văn bản hoặc hình ảnh được cung cấp: {INPUT_CONTEXT}. Hãy tạo ra {NUMBER} câu hỏi trắc nghiệm.
   
   Định dạng Output BẮT BUỘC (JSON Raw):
   
   ```json
   [
     {
       "content": {
         "question": "Nội dung câu hỏi ngắn gọn, dễ hiểu?",
         "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
         "explanation": "Giải thích chi tiết tại sao đáp án đúng là đúng."
       },
       "correct_option_index": 0,
       "difficulty": "medium"
     }
   ]
   ```
   
   Field Constraints (documented outside JSON for clarity):
   - correct_option_index: Must be an integer from 0-3, corresponding to the index in the options array
   - difficulty: Must be one of the string values: "easy", "medium", or "hard"
   - question: String, max 200 characters recommended
   - options: Array of exactly 4 strings
   - explanation: String, detailed reasoning for the correct answer
   
   Quy tắc nghiêm ngặt:
   - Chỉ trả về JSON thuần túy. Không markdown (```json), không lời dẫn, không inline comments.
   - correct_option_index bắt buộc phải là số nguyên (Integer), không phải string.
   - Không được có trailing commas trong JSON.
   - Nội dung phù hợp lứa tuổi 6-10, giọng văn thân thiện."
   6.2. Prompt Gia sư Cú Mèo (Dành cho Học sinh)
   "Bạn là Cú Mèo - trợ giảng vui tính.
   Context bài học: {RETRIEVED_CONTEXT}.
   Quy tắc:
   Chỉ trả lời dựa trên Context. Nếu không có thông tin, hãy từ chối khéo.
   KHÔNG bao giờ giải bài tập hộ. Hãy dùng phương pháp Socratic (đặt câu hỏi gợi mở) để học sinh tự nghĩ.
   Giọng điệu: Vui vẻ, dùng icon 🌟, ngắn gọn."
