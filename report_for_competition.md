# BẢN MÔ TẢ SẢN PHẨM CUỘC THI SÁNG TẠO VỚI AI TRONG GIÁO DỤC NĂM HỌC 2025 - 2026

**ỨNG DỤNG NỀN TẢNG "AGE OF STUDY" TRONG ĐỔI MỚI HOẠT ĐỘNG ÔN TẬP TIẾNG VIỆT LỚP 5 THEO CHƯƠNG TRÌNH GDPT 2018.**

## I. Mục tiêu và Đối tượng (Mở đầu)

Kính thưa Ban giám khảo! Chúng tôi là những giáo viên trường Tiểu học Ninh Lai, đồng thời là nhóm tác giả nghiên cứu và thiết kế ứng dụng học tập _"Age of Study"_. Hưởng ứng cuộc thi _"Sáng tạo với AI trong giáo dục năm học 2025 - 2026"_ do Sở Giáo dục và Đào tạo tỉnh Tuyên Quang tổ chức, chúng tôi đã nghiên cứu thiết kế một nền tảng học tập ứng dụng Trí tuệ nhân tạo (AI) nhằm nâng cao chất lượng học tập môn Tiếng Việt dành cho học sinh lớp 5.

Mục tiêu cốt lõi của giải pháp là giảm tải áp lực soạn giảng cho giáo viên và tạo ra một môi trường học tập tương tác, cá nhân hóa cho học sinh.

## II. Bối cảnh và Nhu cầu thực tế

Môn Tiếng Việt lớp 5 theo Chương trình GDPT 2018 (bộ sách "Kết nối tri thức với cuộc sống") đòi hỏi học sinh không chỉ ghi nhớ mà còn phải vận dụng linh hoạt vốn từ vựng, ngữ pháp và biện pháp nghệ thuật. Tuy nhiên, thực trạng giảng dạy tại trường Tiểu học Ninh Lai và địa bàn tỉnh Tuyên Quang đặt ra nhiều bài toán cần giải quyết:

- **Khó khăn trong tiếp thu ngôn ngữ:** Tỉ lệ lớn học sinh tại trường là con em đồng bào dân tộc thiểu số. Các em thường gặp rào cản trong việc hiểu sâu các từ ngữ trừu tượng, từ đồng nghĩa, trái nghĩa, hoặc hình ảnh nhân hóa, so sánh trong sách giáo khoa mới. Việc ôn tập theo phương pháp truyền thống (bảng phấn, phiếu bài tập in giấy) dần trở nên khô khan, khó tạo động lực duy trì sự tập trung.
- **Áp lực soạn giảng của giáo viên:** Để thiết kế các bài tập tương tác, phân hóa theo từng nhóm đối tượng học sinh (yếu - trung bình - khá - giỏi), giáo viên phải mất hàng giờ đồng hồ mỗi ngày để tìm kiếm học liệu và xây dựng câu hỏi. Chúng ta đang thiếu hụt một ngân hàng câu hỏi trắc nghiệm tương tác bám sát chương trình mới có khả năng tự động sinh mới một cách nhanh chóng.

Đứng trước thách thức đó, chúng tôi phát triển _"Age of Study"_ - một hệ thống ứng dụng công nghệ giáo dục (EdTech) kết hợp AI, biến mỗi bài ôn tập thành một hành trình khám phá cá nhân hóa.

## III. Giới thiệu phần mềm & Tính sáng tạo (Đánh giá theo mô hình SAMR)

**Triết lý:** "Học mà chơi, chơi mà học". Nội dung phần mềm bám sát các mạch kiến thức Tiếng Việt lớp 5.

Điểm sáng tạo nhất của "Age of Study" được thể hiện qua lăng kính của **mô hình SAMR** (Substitution, Augmentation, Modification, Redefinition):

- **S (Substitution - Thay thế) & A (Augmentation - Nâng cao):** Ứng dụng số hóa hoàn toàn các bài tập trên giấy thành dạng tương tác trực tuyến, tự động chấm điểm và xếp hạng (Bảng vinh danh), giúp đánh giá tức thời tiến độ của học sinh.
- **M (Modification - Sửa đổi):** Giải phóng giáo viên khỏi việc soạn đề thủ công. AI đóng vai trò như một trợ giảng số, tự động hóa việc tạo ra các định dạng câu hỏi đa dạng (trắc nghiệm, điền khuyết, ghép nối...) bám sát tài liệu giáo án được cung cấp.
- **R (Redefinition - Tái định nghĩa):** Đây là giá trị cốt lõi xuất sắc nhất. Nhờ AI, hệ thống biến v iệc học đại trà (one-size-fits-all) thành học tập cá nhân hóa. AI cho phép tự động sinh ra những kịch bản ôn tập, giải thích lỗi sai bằng giọng điệu thân thiện (vai trò "Giáo sư Cú" của hệ thống) để chẩn đoán điểm yếu của từng học sinh. Đây là điều mà trước đây, một giáo viên không thể làm thủ công cho 30-40 học sinh cùng một lúc trong môi trường lớp học truyền thống.

## IV. Cấu trúc kỹ thuật và Quy trình tạo ra sản phẩm

### 1. Cấu trúc kỹ thuật của hệ thống

- **Nền tảng ứng dụng (Frontend & Backend):** Phát triển trên framework **Next.js** (React) bằng ngôn ngữ **TypeScript**.
- **Cơ sở dữ liệu và Xác thực (Database & Auth):** Tận dụng **Supabase** (PostgreSQL) để quản lý CSDL và ngân hàng câu hỏi. Xác thực qua JSON Web Token (JWT) và Row Level Security bảo vệ an toàn thông tin theo Luật An ninh mạng.
- **Mô hình Trí tuệ nhân tạo (AI Model):** Tích hợp công cụ **Google Gemini 2.5 Flash** qua API có bản quyền. Đây là mô hình tối ưu xử lý ngôn ngữ tự nhiên tiếng Việt và xuất dữ liệu dạng cấu trúc (JSON).

### 2. Quy trình kiểm soát của con người (Human-In-The-Loop)

Sản phẩm tuân thủ nghiêm ngặt nguyên tắc đạo đức AI trong giáo dục. Toàn bộ quy trình sinh câu hỏi theo trình tự:
👉 **AI gợi ý** $\rightarrow$ 👉 **Con người kiểm tra** $\rightarrow$ 👉 **Con người quyết định** $\rightarrow$ 👉 **Hệ thống thực thi**

Khác với các ứng dụng tự động hoàn toàn, _"Age of Study"_ đề cao triết lý nhà giáo là trọng tâm. Chúng tôi sử dụng AI để giảm tải khối lượng công việc, nhưng **giảm thiểu sai sót tối đa thông qua lớp kiểm duyệt của giáo viên (Human-In-The-Loop), đảm bảo dữ liệu đầu ra đạt tiêu chuẩn sư phạm 100% trước khi đến tay học sinh**. Giáo viên có toàn quyền thêm, bớt, chỉnh sửa đáp án, độ khó, hoặc thay đổi lời giải thích trước khi phê duyệt lưu vào ngân hàng đề.

### 3. Sơ đồ luồng dữ liệu (Data Flow) khi tạo câu hỏi

1. **Input:** Giáo viên tải lên file (PDF/Word), nhập văn bản hoặc chọn tính năng tự truy xuất dữ liệu từ Kho kiến thức (Knowledge Base).
2. **Contextualize (Kiến tạo ngữ cảnh):** Hệ thống trích xuất nội dung, kết hợp với CSDL tạo thành bộ ngữ cảnh (`Context`) độ nét cao.
3. **AI Processing:** Gửi HTTP POST Request bảo mật tới API Google Gemini, mang theo `System Prompt` (vai trò giáo viên) và bộ ngữ cảnh.
4. **Structured Output:** Gemini phân tích và trả về một cấu trúc mảng JSON chính xác (Structured JSON) chứa nội dung, đáp án và lời giải thích.
5. **Parse & Render:** Hệ thống parse JSON thành giao diện UI trực quan để Giáo viên duyệt.

### 4. Câu lệnh mẫu (Prompts) và Đảm bảo tính khoa học

- **Prompt định hình tính cách sư phạm:**
  > _"Bạn là Giáo sư Cú, một chuyên gia giáo dục tiểu học tại Việt Nam, cực kỳ yêu mến trẻ em. Nhiệm vụ của bạn là tạo các câu hỏi Tiếng Việt thú vị dựa trên tài liệu. Hãy dùng giọng văn ngọt ngào, khích lệ (Ví dụ: 'Hiệp sĩ nhỏ', 'Nhà thông thái nhí'). Nếu học sinh trả lời sai, lời giải thích không được phê bình mà phải gợi mở..."_
- **Prompt ràng buộc tính khoa học:**
  > _"YÊU CẦU NGHIÊM NGẶT: KHÔNG ĐƯỢC sử dụng kiến thức bên ngoài tài liệu được cung cấp. Bạn CHỈ được phép tạo các câu hỏi dựa hoàn toàn vào dữ liệu đầu vào. Phải tuân thủ định dạng JSON."_

### 5. An toàn thông tin và Bảo vệ người dùng

API Gemini được chủ động thiết lập ngưỡng bảo vệ an toàn cao nhất (`HarmBlockThreshold.BLOCK_LOW_AND_ABOVE`) nhằm chặn đứng mọi rủi ro về Quấy rối (Harassment), Thông tin thù ghét (Hate Speech), Nội dung người lớn (Sexually Explicit) và Nội dung nguy hiểm (Dangerous Content), tạo sự an tâm tuyệt đối cho học đường. Hệ thống cam kết không có các tác vụ thu thập dữ liệu trái phép chạy ngầm.

## V. Hiệu quả và Tác động thực tiễn

Quá trình áp dụng thử nghiệm tại lớp chủ nhiệm ở Trường Tiểu học Ninh Lai đã mang lại những kết quả đo lường được rất tích cực:

**1. Đối với Học sinh:**
Tỉ lệ học sinh yêu thích và chủ động hoàn thành bài tập ôn tập Tiếng Việt trên máy tính/điện thoại tăng vọt. Sự cạnh tranh lành mạnh trên Bảng vinh danh giúp các em có động lực to lớn.
_Bảng thống kê chất lượng môn Tiếng Việt trước và sau khi sử dụng "Age of Study" (Khảo sát 30 học sinh):_

| Tiêu chí                                | Trước khi áp dụng | Sau 1 học kỳ áp dụng | Tăng trưởng |
| :-------------------------------------- | :---------------: | :------------------: | :---------: |
| Tỉ lệ học sinh chủ động làm bài tập nhà |        30%        |         85%          |    +55%     |
| Điểm kiểm tra định kỳ (Khá - Giỏi)      |        45%        |         72%          |    +27%     |
| Tỉ lệ học sinh hiểu sâu từ vựng khó     |        40%        |         80%          |    +40%     |

**2. Đối với Giáo viên:**
Việc soạn đề, ra bài tập được tự động hóa đáng kể. Trích lời nhận xét của cô Nguyễn Thị T., giáo viên cùng khối tại trường Tiểu học Ninh Lai:

> _"Trước đây, để soạn một bài ôn tập trắc nghiệm đa dạng câu hỏi cho lớp, tôi mất ít nhất 1.5 đến 2 giờ đồng hồ mỗi tối. Từ ngày dùng 'Age of Study', tôi chỉ cần tải file tài liệu Word lên, AI đã trả về bộ 20 câu hỏi thú vị chỉ trong 10 giây. Tôi chỉ việc tốn thêm 5 phút rà soát lại kết quả. Ứng dụng thực sự đã 'cứu cánh' khối lượng công việc khổng lồ của tôi."_

## VI. Tính khả thi, Bền vững và Hướng phát triển

### 1. Tính khả thi và Giải bài toán chi phí

Hội đồng giám khảo có thể lo ngại về chi phí duy trì API của Google Gemini. Tuy nhiên, sản phẩm được thiết kế với cơ chế tối ưu chi phí (Scalability & Sustainability):

- **Tối ưu gói API:** Hệ thống tận dụng gói Free Tier (phiên bản miễn phí) của Google Gemini Flash 2.5 dành cho nhà phát triển học thuật và giáo dục, cung cấp tới 15 Request/phút (hoàn toàn dư dả cho quy mô hoạt động của một trường tiểu học).
- **Chi phí vận hành siêu rẻ:** Nhờ kiến trúc Serverless (Next.js Edge) và hệ quản trị cơ sở dữ liệu Supabase, chi phí duy trì máy chủ cho một trường học chỉ rơi vào khoảng chưa tới 50.000 VNĐ/tháng. Mức chi phí này hoàn toàn nằm trong khả năng của ngân sách chi thường xuyên hoặc quỹ xã hội hóa của bất kỳ trường trường công lập nào.
  Do đó, khả năng nhân rộng (scale) ra toàn tỉnh Tuyên Quang là cực kỳ khả thi do rào cản tài chính được giảm thiểu về gần bằng 0.

### 2. Hướng phát triển phần mềm trong tương lai gần

Để phần mềm hoàn thiện hơn, đưa mô hình SAMR chạm mức Tái định nghĩa (Redefinition) triệt để trong mọi ngóc ngách, chúng tôi đang nghiên cứu tích hợp:

- **Thư viện AI Âm thanh (Text-to-Speech):** AI đọc diễn cảm văn bản, giúp các em học sinh ở vùng sâu vùng xa, con em dân tộc thiểu số rèn luyện kỹ năng nghe và đọc phát âm tiếng Việt chuẩn xác hơn.
- **Tương tác nhóm & Học tập hợp tác:** Tạo lập phân hệ không gian ảo để học sinh cùng nhau thảo luận, làm việc nhóm phát triển ý tưởng bài văn miêu tả ngay trên nền tảng.
- **AI Rèn kỹ năng cảm thụ văn học:** AI đóng vai trò gia sư hỗ trợ phân tích và sửa lỗi đoạn văn của học sinh, chấm điểm tự luận bước đầu và gợi ý cách sử dụng các biện pháp nghệ thuật làm cho đoạn văn thêm sinh động.

## VII. Kết luận & Thông điệp

_"Age of Study"_ không hướng tới việc thay thế người giáo viên, mà được định vị là cánh tay nối dài, một "trợ lý số" miệt mài giúp chúng ta chạm đến trái tim và khơi gợi sự hứng thú học tập của thế hệ học sinh số (Gen Z, Gen Alpha).

Chúng tôi sẽ liên tục cập nhật dữ liệu để phần mềm không chỉ là công cụ kiểm tra đánh giá, mà thực sự là người bạn đồng hành nuôi dưỡng tình yêu tiếng Việt trong trẻo của các em.

Xin trân trọng cảm ơn Ban giám khảo đã quan tâm và lắng nghe. Rất mong nhận được sự góp ý chuyên môn từ hội đồng để công trình của nhóm tác giả ngày một hoàn thiện và thiết thực hơn!
