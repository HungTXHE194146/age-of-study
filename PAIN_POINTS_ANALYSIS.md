# PHÂN TÍCH KHÓ KHĂN & ĐỊNH HƯỚNG SẢN PHẨM

**Dự án:** Age Of Study — Nền tảng Học tập Gamification Hỗ trợ bởi AI  
**Đối tượng triển khai:** Trường Tiểu Học Ninh Lai, Tuyên Quang (vùng trung du)  
**Phiên bản phân tích:** v1.0  
**Ngày:** 12/02/2026

---

## I. BỐI CẢNH THỰC ĐỊA

Sản phẩm được thiết kế cho một trường tiểu học vùng trung du với các đặc điểm:

- **90% học sinh** không có điện thoại riêng, phải mượn thiết bị của bố mẹ (thường vào buổi tối muộn).
- **Kết nối mạng** 4G không ổn định, wifi trường yếu.
- **5/30 em** mỗi lớp có thể không tiếp cận được smartphone (bố mẹ đi làm xa, ở với ông bà).
- **Giáo viên** nhiều người lớn tuổi, kỹ năng công nghệ hạn chế.
- **Ngân sách** trường công có hạn, không có đội IT bảo trì.

---

## II. TỔNG HỢP KHÓ KHĂN (PAIN POINTS)

### Nhóm 1: Hạ tầng & Tiếp cận — Mức SỐNG CÒN

| # | Khó khăn | Hệ quả | SRS hiện tại giải quyết? |
|---|----------|--------|--------------------------|
| 1.1 | **Thiết bị không chính chủ** — 1 điện thoại dùng chung 2-3 anh chị em | Không thể bắt online đúng giờ; Device fingerprint trong FR-3.1 sẽ khóa nhầm user khác trên cùng thiết bị | Không — SRS giả định 1 device = 1 user |
| 1.2 | **Mạng chập chờn** — 4G vùng cao không ổn định | Mất kết nối giữa bài thi → mất progress → học sinh bỏ cuộc | Không — Mọi tính năng đều yêu cầu online real-time |
| 1.3 | **Khoảng cách giàu nghèo (Digital Divide)** — 5/30 em không có thiết bị | App 100% online → 5 em bị 0 điểm oan → Bất công giáo dục | Không — Không có chế độ offline hay fallback giấy |

**Đánh giá:** SRS giải quyết được khoảng **10%** nhóm này. Đây là điểm mù lớn nhất — nếu không xử lý, sản phẩm sẽ bị từ chối ngay từ buổi demo tại trường.

---

### Nhóm 2: Giáo viên — Mức NGHIÊM TRỌNG

| # | Khó khăn | Hệ quả | SRS hiện tại giải quyết? |
|---|----------|--------|--------------------------|
| 2.1 | **Sợ "Thêm việc"** — Soạn giáo án giấy đã mệt, giờ thêm quản lý App | Giáo viên tẩy chay nếu App không giúp họ nhàn hơn | Một phần — AI sinh đề tốt (FR-1.2), nhưng quy trình duyệt từng câu trên Split Screen vẫn mất 30-45 phút cho 50 câu |
| 2.2 | **Mù công nghệ** — Cô giáo lớn tuổi gõ máy tính còn chậm | Giao diện rối rắm = bỏ cuộc ngay buổi đầu | Không — SRS dùng thuật ngữ "Knowledge Base", "Dashboard", "Authentication", không có onboarding hay chế độ đơn giản |
| 2.3 | **Áp lực thành tích ảo** — Học sinh copy bài, bố mẹ làm hộ | Giáo viên không tin điểm trên App, quay lại thi giấy | Không — SRS có security auth (JWT, 2FA) nhưng không có anti-cheat học tập: không randomize đề, không phát hiện pattern bất thường |
| 2.4 | **Lớp học lai (Hybrid)** — Nửa online nửa giấy | Tổng hợp điểm cực mất thời gian, dễ sai sót | Không — FR-1.4 chỉ có Class Code online, không có xuất đề giấy, nhập điểm tay, hay gradebook tổng hợp |

**Đánh giá:** SRS giải quyết được khoảng **30%** nhóm này. Điểm sáng duy nhất là AI sinh câu hỏi tự động.

---

### Nhóm 3: Học sinh — Mức TRUNG BÌNH

| # | Khó khăn | Hệ quả | SRS hiện tại giải quyết? |
|---|----------|--------|--------------------------|
| 3.1 | **Chán học** — TikTok/YouTube vui hơn bài tập trên màn hình | Dùng 2 tuần rồi bỏ nếu gamification cạn | Một phần — Có XP, Combo, Streak, Badge (gamification cấp 1) nhưng thiếu narrative, nhân vật, câu chuyện, mini-game đa dạng. Tên "Age of Study" gợi ý thế giới game nhưng SRS không hiện thực hóa |
| 3.2 | **Sợ bị "bêu rếu"** — Leaderboard Top 3 khiến 27 em còn lại tự ti | Đa số học sinh cảm thấy kém cỏi → bỏ App | Không — FR-2.2 thiết kế "Top 3 + Badge + 100XP" đang **tạo ra** vấn đề này thay vì giải quyết |
| 3.3 | **Hack/Cheat dễ** — F12, spam click, tạo nick ảo | Gian lận thay vì học thật → phá hỏng hệ thống điểm | Không — Security chỉ ở tầng auth, không có: randomize đề/đáp án, rate-limit answer, server-side-only validation, anti-DevTools |
| 3.4 | **Giao diện người lớn** — Nút nhỏ, chữ nhiều, từ ngữ chuyên ngành | Trẻ lớp 1-2 (6-7 tuổi, chưa đọc thạo) không dùng được | Một phần — "4 nút lớn" cho quiz là tốt, nhưng mọi thứ khác (route URL, menu, settings) đều bằng tiếng Anh và thiết kế cho người lớn |

**Đánh giá:** SRS giải quyết được khoảng **40%** nhóm này. Gamification tồn tại nhưng thiếu chiều sâu, và Leaderboard đang phản tác dụng.

---

### Nhóm 4: Hiệu trưởng / Quản lý — Mức NGHIÊM TRỌNG

| # | Khó khăn | Hệ quả | SRS hiện tại giải quyết? |
|---|----------|--------|--------------------------|
| 4.1 | **Sợ "Bỏ lại phía sau"** — Công nghệ phân hóa học sinh | Hiệu trưởng từ chối triển khai vì sợ mang tiếng | Không — App 100% online, không có thiết kế inclusive, không có equity safeguard |
| 4.2 | **Báo cáo & Giám sát** — Cần số liệu cho Phòng Giáo dục | Không thuyết phục được cấp trên, không biết giáo viên nào đang dùng | Không — SRS chỉ có báo cáo cấp lớp cho Teacher, không có dashboard cấp trường, không có export cho Phòng GD |
| 4.3 | **Chi phí & Bảo trì** — Ngân sách hạn chế, sợ phần mềm bỏ hoang | Lãng phí tiền của → mất niềm tin vào công nghệ giáo dục | Một phần — Stack rẻ (Supabase free tier, Gemini Flash), nhưng không có maintenance plan, training plan, hay ai-chịu-trách-nhiệm-sau-cuộc-thi |

**Đánh giá:** SRS giải quyết được khoảng **20%** nhóm này. Tech stack phù hợp nhưng hoàn toàn thiếu lớp vận hành/quản trị cấp trường.

---

## III. NHỮNG GÌ SRS ĐÃ LÀM TỐT

Cần ghi nhận những điểm mạnh hiện có để không phá vỡ khi cải tiến:

| Điểm sáng | Giá trị |
|---|---|
| AI sinh câu hỏi từ tài liệu (FR-1.2) | Giải quyết đúng pain "soạn đề mất thời gian" — đây là USP chính |
| Human-in-the-loop (FR-1.3) | Nguyên tắc sư phạm đúng — AI gợi ý, con người quyết định |
| Gemini Flash + Supabase | Stack chi phí thấp, phù hợp MVP trường công |
| Parental time control (FR-3.1) | Ý thức bảo vệ trẻ em — có nền tảng tốt |
| Skill tree / Node system | Cấu trúc chương trình linh hoạt, có roadmap fixed → custom |
| System Prompt công khai (Mục 6) | Minh bạch AI, đáp ứng tiêu chí cuộc thi |
| Content Filtering (FR-3.2) | Phù hợp đối tượng trẻ em |

---

## IV. ĐỊNH HƯỚNG — ƯU TIÊN THEO MoSCoW

### MUST HAVE — Không có = Thất bại triển khai

#### M1. Offline-Resilient Quiz (Chống chịu mất mạng)

- **Mô tả:** Khi học sinh bắt đầu bài quiz, toàn bộ câu hỏi được cache xuống local (Service Worker / IndexedDB). Bài làm được lưu offline, tự động sync lên server khi có mạng trở lại.
- **Giải quyết pain:** 1.2 (Mạng chập chờn)
- **Cách triển khai:** PWA với Service Worker, pre-fetch question batch, optimistic UI, background sync API.
- **Acceptance Criteria:**
  - Học sinh có thể hoàn thành 1 bài quiz 10 câu khi mất mạng giữa chừng
  - Progress không bị mất khi đóng/mở lại trình duyệt
  - Điểm được sync chính xác khi có mạng

#### M2. Multi-User Per Device (Nhiều tài khoản trên 1 thiết bị)

- **Mô tả:** Màn hình đăng nhập có cơ chế "Chuyển tài khoản nhanh" (Quick Switch). Time limit tính theo user, không theo device. Khi 1 user hết giờ, user khác trên cùng device vẫn dùng được.
- **Giải quyết pain:** 1.1 (Thiết bị chung)
- **Cách triển khai:** Multi-session management, time tracking per user_id (không per device_id), "Đổi người dùng" button trên header.
- **Acceptance Criteria:**
  - 2 anh em dùng chung 1 điện thoại, mỗi em có session riêng
  - Khi em A hết 30 phút/ngày, em B vẫn vào được bình thường
  - Chuyển tài khoản không cần đăng xuất/đăng nhập lại hoàn toàn (PIN 4 số hoặc chọn avatar)

#### M3. Print Quiz & Manual Score Entry (Xuất đề giấy & Nhập điểm tay)

- **Mô tả:** Giáo viên có thể xuất bài kiểm tra đã PUBLISHED ra file PDF để in cho học sinh không có thiết bị. Sau đó nhập điểm thủ công vào hệ thống. Gradebook tổng hợp cả điểm online lẫn offline.
- **Giải quyết pain:** 1.3 (Digital Divide), 2.4 (Lớp học lai)
- **Cách triển khai:** Export PDF button trên Teacher Dashboard, form nhập điểm manual per-student, gradebook view tổng hợp.
- **Acceptance Criteria:**
  - PDF xuất ra đúng format bài thi, có chỗ điền tên + lớp, in được trên A4
  - Giáo viên nhập điểm cho 5 em offline trong < 5 phút
  - Bảng điểm tổng hợp hiện cả 2 nguồn, không phân biệt

#### M4. Leaderboard Redesign (Thiết kế lại bảng xếp hạng)

- **Mô tả:** Thay thế mô hình "Top 3 winner-takes-all" bằng hệ thống khuyến khích đa chiều:
  - **Tier / League:** Đồng → Bạc → Vàng → Kim cương (dựa trên tổng XP tích lũy, không phải rank so sánh)
  - **Tiến bộ cá nhân:** "Tuần này em giỏi hơn tuần trước X%" — so sánh với chính mình
  - **Badge đa dạng:** Không chỉ vinh danh kết quả mà còn vinh danh nỗ lực ("Chiến binh kiên cường" — sai nhiều nhưng không bỏ cuộc, "Ong chăm chỉ" — 7 ngày streak)
  - **Leaderboard lớp:** Giữ lại nhưng hiện Top 10 thay vì Top 3, và **mặc định ẩn** (học sinh chủ động mở xem)
- **Giải quyết pain:** 3.2 (Sợ bị bêu rếu)
- **Acceptance Criteria:**
  - Mọi học sinh đều có thể thăng tier nếu chăm chỉ (không phải chỉ giỏi nhất)
  - Không có em nào nhìn thấy mình "đội sổ" trên giao diện mặc định
  - Có ít nhất 5 loại badge khác nhau (nỗ lực, streak, improvement, combo, participation)

#### M5. Vietnamese-First, Child-Friendly UI (Giao diện thuần Việt, thân thiện trẻ em)

- **Mô tả:** Toàn bộ giao diện học sinh hiển thị bằng tiếng Việt bình dân. Icon lớn, màu sắc tươi sáng. Không có thuật ngữ kỹ thuật.
- **Giải quyết pain:** 3.4 (Giao diện người lớn), 2.2 (Mù công nghệ — phía giáo viên)
- **Nguyên tắc:**
  - Student UI: "Bảng vinh danh" thay vì "Leaderboard", "Cài đặt" thay vì "Settings", icon mây/ngôi sao thay vì hamburger menu
  - Teacher UI: "Tạo bài kiểm tra" thay vì "Content Generation", "Kho tài liệu" thay vì "Knowledge Base"
  - Các route URL không ảnh hưởng UX nhưng label/menu phải hoàn toàn Việt hóa
- **Acceptance Criteria:**
  - Không có từ tiếng Anh nào trên giao diện học sinh (trừ brand name "Age of Study")
  - Học sinh lớp 3 có thể tự navigate được mà không cần hướng dẫn (usability test)
  - Touch target tối thiểu 48x48px cho mọi nút bấm

---

### SHOULD HAVE — Cải thiện đáng kể tỷ lệ adoption

#### S1. Batch Approve Questions (Duyệt câu hỏi hàng loạt)

- **Mô tả:** Giáo viên có thể tick chọn nhiều câu → "Duyệt tất cả" 1 click. Hỗ trợ filter theo độ khó, trạng thái.
- **Giải quyết pain:** 2.1 (Thêm việc)
- **Acceptance Criteria:** Duyệt 50 câu trong < 3 phút (thay vì 30-45 phút từng câu).

#### S2. Basic Anti-Cheat (Chống gian lận cơ bản)

- **Mô tả:**
  - Randomize thứ tự câu hỏi và thứ tự đáp án cho mỗi lượt chơi
  - Validate đáp án đúng chỉ ở server-side (client không biết trước đáp án)
  - Rate-limit: Tối đa 1 answer/giây (chống spam click)
  - Flag tài khoản có pattern bất thường (10 câu đúng trong 10 giây)
- **Giải quyết pain:** 2.3 (Thành tích ảo), 3.3 (Hack/Cheat)
- **Acceptance Criteria:**
  - 2 học sinh ngồi cạnh nhau thấy thứ tự câu/đáp án khác nhau
  - Inspect Element (F12) không thấy correct_option_index trong response
  - Submit 5 đáp án trong 2 giây → bị reject

#### S3. Simplified Teacher Onboarding (Hướng dẫn giáo viên đơn giản)

- **Mô tả:** Lần đầu đăng nhập → Wizard 3 bước có hình minh họa:
  1. "Tải tài liệu lên" (kéo thả hoặc chọn file)
  2. "Máy tính tự tạo câu hỏi" (hiện loading + preview)
  3. "Kiểm tra và giao bài" (duyệt + assign cho lớp)
- **Giải quyết pain:** 2.2 (Mù công nghệ)
- **Acceptance Criteria:** Cô giáo 55 tuổi chưa từng dùng App hoàn thành được flow tạo quiz đầu tiên trong < 10 phút.

#### S4. School-Level Dashboard (Dashboard cấp trường)

- **Mô tả:** Role "Hiệu trưởng" (tách biệt với Teacher) có thể:
  - Xem tổng quan: Số học sinh active, số bài quiz đã tạo, số giáo viên đang dùng
  - So sánh giữa các lớp: Điểm trung bình, tỷ lệ hoàn thành
  - Export báo cáo: PDF/Excel để nộp Phòng Giáo dục
  - Xem giáo viên nào tích cực / chưa sử dụng
- **Giải quyết pain:** 4.2 (Báo cáo & Giám sát)
- **Acceptance Criteria:** Hiệu trưởng export được 1 báo cáo tổng hợp toàn trường trong < 2 phút.

#### S5. Auto-Save & Resume (Tự động lưu & Tiếp tục)

- **Mô tả:** Nếu học sinh đóng trình duyệt hoặc mất mạng giữa quiz → khi quay lại, hiện popup "Em đang làm dở bài [Toán lớp 5 - Phân số]. Tiếp tục?" → Resume đúng câu đang làm.
- **Giải quyết pain:** 1.2 (Mạng chập chờn)
- **Acceptance Criteria:** Đóng tab ở câu 6/10 → mở lại → tiếp tục từ câu 6 với đúng thời gian còn lại.

---

### COULD HAVE — Nâng cao trải nghiệm (v1.1+)

#### C1. Narrative/Story Mode (Thế giới game có câu chuyện)

- **Mô tả:** Biến "Age of Study" thành thế giới game thật sự — học sinh là "Chiến binh tri thức" giải cứu vương quốc bằng kiến thức. Mỗi chương trình = 1 vùng đất. Hoàn thành quiz = đánh boss. Có nhân vật, avatar, pet.
- **Giải quyết pain:** 3.1 (Chán học — cạnh tranh với TikTok)
- **Lý do defer:** Tốn nhiều effort thiết kế content + art, không ảnh hưởng core functionality.

#### C2. Text-to-Speech cho Lớp 1-2

- **Mô tả:** Nút "Đọc câu hỏi" (icon loa) — dùng Web Speech API đọc to câu hỏi + 4 đáp án cho học sinh chưa đọc thạo.
- **Giải quyết pain:** 3.4 (Giao diện trẻ em — nhóm 6-7 tuổi)
- **Lý do defer:** Web Speech API chất lượng tiếng Việt còn hạn chế, cần test kỹ.

#### C3. AI Tutor "Cú Mèo" đầy đủ

- **Mô tả:** Chatbot RAG-based như SRS mô tả (FR-2.3).
- **Giải quyết pain:** 3.1 (Chán học — tương tác 2 chiều)
- **Lý do defer:** Phức tạp, tốn token Gemini, cần RAG pipeline riêng. Core value của v1.0 là quiz + gamification, chưa cần chatbot.

#### C4. Parent Portal (Cổng phụ huynh)

- **Mô tả:** Phụ huynh xem tiến độ con em qua link/QR code đơn giản (không cần tạo tài khoản).
- **Giải quyết pain:** 2.3 (biết bố mẹ có làm hộ không — nếu phụ huynh thấy con đang học thì ít can thiệp hơn)

---

### WON'T HAVE in v1.0 — Bỏ bớt Over-Engineering

| Tính năng trong SRS hiện tại | Lý do bỏ / defer |
|---|---|
| 2FA qua SMS (FR-3.1) | Trường tiểu học vùng trung du — phụ huynh không cần và không quen 2FA. Dùng mật khẩu đơn giản + PIN là đủ |
| GDPR compliance (FR-3.6) | Chưa cần — trường Việt Nam, không có user EU. Tuân thủ Luật An ninh mạng VN là đủ |
| Penetration testing hàng quý (FR-3.7) | MVP cho cuộc thi, chưa có budget. Defer sang khi có user thật đông |
| Data Subject Access Request portal (FR-3.6) | Phức tạp, 0% khả năng có phụ huynh Ninh Lai dùng. Xử lý manual nếu có yêu cầu |
| AES-256 encryption at rest cho PII (FR-3.3) | Supabase đã có encryption at rest mặc định. Không cần tự implement thêm lớp AES riêng |
| Breach notification system 72h (FR-3.7) | Scope cuộc thi, chưa cần hệ thống automated. Document quy trình manual là đủ |

---

## V. MA TRẬN PAIN POINT → TÍNH NĂNG

| Pain Point | Mức độ | Tính năng giải quyết | Ưu tiên |
|---|---|---|---|
| 1.1 Thiết bị chung | Critical | M2 — Multi-User Per Device | MUST |
| 1.2 Mạng chập chờn | Critical | M1 — Offline-Resilient Quiz, S5 — Auto-Save | MUST |
| 1.3 Digital Divide | Critical | M3 — Print Quiz & Manual Score | MUST |
| 2.1 Thêm việc | High | S1 — Batch Approve | SHOULD |
| 2.2 Mù công nghệ | High | S3 — Teacher Onboarding, M5 — Việt hóa UI | MUST + SHOULD |
| 2.3 Thành tích ảo | High | S2 — Anti-Cheat | SHOULD |
| 2.4 Lớp học lai | High | M3 — Print Quiz & Manual Score | MUST |
| 3.1 Chán học | Medium | C1 — Story Mode, M4 — Tier System | COULD + MUST |
| 3.2 Sợ bêu rếu | High | M4 — Leaderboard Redesign | MUST |
| 3.3 Hack/Cheat | Medium | S2 — Anti-Cheat | SHOULD |
| 3.4 UI người lớn | High | M5 — Child-Friendly UI, C2 — TTS | MUST + COULD |
| 4.1 Bỏ lại phía sau | Critical | M3 — Print Quiz (inclusive design) | MUST |
| 4.2 Báo cáo | High | S4 — School Dashboard | SHOULD |
| 4.3 Chi phí bảo trì | Medium | Tech stack hiện tại OK, cần thêm docs vận hành | — |

---

## VI. ROADMAP ĐỀ XUẤT

### Phase 1 — MVP Cuộc thi (4-6 tuần)

**Mục tiêu:** Demo được tại trường Ninh Lai, chạy được với 1-2 lớp thí điểm.

- [x] AI sinh câu hỏi từ tài liệu (đã có trong SRS)
- [x] Human-in-the-loop review (đã có trong SRS)
- [x] Quiz Arena với Gamification cơ bản (đã có trong SRS)
- [ ] **M1** — Offline-Resilient Quiz (PWA + Cache)
- [ ] **M2** — Multi-User Per Device (Quick Switch)
- [ ] **M3** — Print Quiz PDF + Manual Score Entry
- [ ] **M4** — Leaderboard Redesign (Tier + Tiến bộ cá nhân)
- [ ] **M5** — Việt hóa toàn bộ UI

### Phase 2 — Adoption & Scale (sau cuộc thi, 4-8 tuần)

**Mục tiêu:** Triển khai toàn trường, giáo viên tự vận hành được.

- [ ] **S1** — Batch Approve
- [ ] **S2** — Anti-Cheat cơ bản
- [ ] **S3** — Teacher Onboarding Wizard
- [ ] **S4** — School Dashboard + Export báo cáo
- [ ] **S5** — Auto-Save & Resume
- [ ] Custom Node (giáo viên tự thêm topic)

### Phase 3 — Engagement & Depth (dài hạn)

**Mục tiêu:** Giữ chân học sinh lâu dài, mở rộng sang trường khác.

- [ ] **C1** — Story Mode / Narrative Gamification
- [ ] **C2** — Text-to-Speech
- [ ] **C3** — AI Tutor "Cú Mèo"
- [ ] **C4** — Parent Portal
- [ ] Team-based learning (nhóm cùng giải quiz)

---

## VII. CÂU HỎI KIỂM CHỨNG

Trước khi code bất kỳ tính năng nào, hãy tự hỏi:

> **"Nếu mất mạng, mất điện thoại, mất kiên nhẫn — tính năng này vẫn giúp được học sinh Ninh Lai học tốt hơn không?"**

Nếu câu trả lời là "Không" — thì cần xem lại thiết kế.

---

*Tài liệu này là bản phân tích đối chiếu giữa Pain Points thực địa và SRS hiện tại, dùng làm cơ sở để điều chỉnh ưu tiên phát triển cho phù hợp với bối cảnh triển khai thực tế.*
