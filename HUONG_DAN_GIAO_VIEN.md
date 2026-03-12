# 📚 Hướng Dẫn Từ A–Z: Xây Dựng Ứng Dụng "Age of Study"
## Dành cho Giáo Viên Tiểu Học Chưa Biết Lập Trình

> **Bạn là ai?** Một giáo viên dạy Tiếng Việt lớp 5, yêu thích công nghệ và muốn tạo ra công cụ học tập cho học sinh của mình.
> **Bạn cần gì?** Không cần biết lập trình. Chỉ cần biết đọc, làm theo từng bước, và biết cách nói chuyện với AI.

---

## MỤC LỤC

1. [Tư Duy Đúng Đắn Trước Khi Bắt Đầu](#1-tư-duy-đúng-đắn-trước-khi-bắt-đầu)
2. [Những Thứ Cần Chuẩn Bị (Hoàn Toàn Miễn Phí)](#2-những-thứ-cần-chuẩn-bị-hoàn-toàn-miễn-phí)
3. [Bước 1: Cài Đặt Công Cụ Lập Trình (VS Code)](#bước-1-cài-đặt-công-cụ-lập-trình-vs-code)
4. [Bước 2: Cài Đặt Node.js (Máy Chạy Code)](#bước-2-cài-đặt-nodejs-máy-chạy-code)
5. [Bước 3: Tạo Tài Khoản GitHub (Kho Lưu Code)](#bước-3-tạo-tài-khoản-github-kho-lưu-code)
6. [Bước 4: Tạo Dự Án Next.js (Khung Ứng Dụng)](#bước-4-tạo-dự-án-nextjs-khung-ứng-dụng)
7. [Bước 5: Tạo Tài Khoản Supabase (Cơ Sở Dữ Liệu)](#bước-5-tạo-tài-khoản-supabase-cơ-sở-dữ-liệu)
8. [Bước 6: Kết Nối Code Với GitHub](#bước-6-kết-nối-code-với-github)
9. [Bước 7: Deploy Lên Vercel (Đưa Web Lên Mạng)](#bước-7-deploy-lên-vercel-đưa-web-lên-mạng)
10. [Cách Nói Chuyện Với AI Để Viết Code](#cách-nói-chuyện-với-ai-để-viết-code)
11. [Khi AI Viết Code Sai: Cách Nhận Biết và Sửa](#khi-ai-viết-code-sai-cách-nhận-biết-và-sửa)
12. [Bảng Cứu Trợ Khẩn Cấp](#bảng-cứu-trợ-khẩn-cấp)

---

## 1. Tư Duy Đúng Đắn Trước Khi Bắt Đầu

### Hãy nghĩ đơn giản như thế này:

| Khái niệm kỹ thuật | Hiểu như thế này |
|---|---|
| **Code / Lập trình** | Như soạn giáo án, nhưng máy tính đọc thay vì người |
| **Next.js** | Cái khung để xây trang web (như bộ khung nhà) |
| **GitHub** | USB/Google Drive lưu trữ toàn bộ code của bạn |
| **Vercel** | Dịch vụ đưa trang web của bạn lên internet (như người host web) |
| **Supabase** | Tủ hồ sơ điện tử lưu dữ liệu học sinh, điểm số, bài tập |
| **VS Code** | Phần mềm soạn thảo code (như Microsoft Word nhưng cho code) |
| **Terminal / Command Prompt** | Cửa sổ nhập lệnh — giống như nói chuyện trực tiếp với máy tính |
| **npm install** | Lệnh cài thêm tính năng vào dự án (như tải thêm font chữ) |
| **AI Agent (GitHub Copilot)** | Trợ lý AI tự động viết code cho bạn trong VS Code |

### Quan trọng: Tâm lý khi gặp lỗi
> ❌ **Đừng sợ lỗi đỏ.** Lỗi là bình thường, ngay cả lập trình viên 10 năm kinh nghiệm cũng gặp lỗi hàng ngày.
> ✅ **Cứ copy lỗi đó, hỏi AI.** 99% lỗi đã có người gặp và AI biết cách sửa.

---

## 2. Những Thứ Cần Chuẩn Bị (Hoàn Toàn Miễn Phí)

Trước khi bắt đầu, hãy chuẩn bị sẵn:

- [ ] Máy tính chạy Windows 10/11 hoặc macOS (RAM tối thiểu 8GB)
- [ ] Kết nối Internet ổn định
- [ ] Địa chỉ Gmail (dùng để đăng ký tất cả tài khoản bên dưới)
- [ ] **Tài khoản GitHub** — [github.com](https://github.com) (miễn phí)
- [ ] **Tài khoản Vercel** — [vercel.com](https://vercel.com) (miễn phí, đăng nhập bằng GitHub)
- [ ] **Tài khoản Supabase** — [supabase.com](https://supabase.com) (miễn phí tier)
- [ ] **Tài khoản Antigravity hoặc github copilot** — [antigravity.google/](https://antigravity.google/) (free)

> 💡 **Mẹo:** Dùng cùng một tài khoản GitHub để đăng nhập Vercel — tiết kiệm thời gian.

---

## Bước 1: Cài Đặt Công Cụ Lập Trình (VS Code)

VS Code là nơi bạn sẽ làm việc mỗi ngày. Hãy nghĩ nó như Microsoft Word nhưng dành cho code.

### 1.1 Tải và cài VS Code

1. Truy cập: **[code.visualstudio.com](https://code.visualstudio.com)**
2. Nhấn nút **"Download for Windows"** (hoặc Mac nếu bạn dùng macOS)
3. Mở file vừa tải, nhấn **Next → Next → Install**
4. Sau khi cài xong, mở VS Code lên

### 1.2 Cài Extension Quan Trọng

Trong VS Code, bên trái có biểu tượng **4 ô vuông** (Extensions). Nhấn vào đó và cài các extension sau — CHỈ cần gõ tên, nhấn **Install**:

| Extension | Tác dụng |
|---|---|
| `GitHub Copilot` | **Quan trọng nhất** — AI viết code cho bạn |
| `GitHub Copilot Chat` | Hỏi AI ngay trong VS Code |
| `ESLint` | Kiểm tra lỗi code tự động |
| `Tailwind CSS IntelliSense` | Gợi ý class CSS |
| `Prettier - Code formatter` | Làm code đẹp, dễ đọc hơn |

### 1.3 Đăng Nhập GitHub Copilot

1. Sau khi cài `GitHub Copilot`, VS Code sẽ yêu cầu đăng nhập
2. Chọn **"Sign in with GitHub"**
3. Trình duyệt mở ra → đăng nhập tài khoản GitHub → cho phép
4. Quay lại VS Code → góc dưới bên phải xuất hiện biểu tượng Copilot ✓

---

## Bước 2: Cài Đặt Node.js (Máy Chạy Code)

Node.js là "động cơ" để chạy dự án Next.js trên máy bạn.

### 2.1 Tải Node.js

1. Truy cập: **[nodejs.org](https://nodejs.org)**
2. Nhấn tải bản **LTS** (ví dụ: 20.x.x LTS) — đây là bản ổn định nhất
3. Cài đặt bình thường (Next → Next → Install)

### 2.2 Kiểm Tra Cài Thành Công

Mở **Terminal trong VS Code** bằng cách:
- Nhấn `Ctrl + `` ` (phím backtick, cạnh số 1)
- Hoặc vào menu **Terminal → New Terminal**

Gõ lệnh sau rồi nhấn Enter:
```
node --version
```
Nếu thấy hiện ra `v20.x.x` (hoặc số phiên bản bất kỳ) → **Thành công!**

---

## Bước 3: Tạo Tài Khoản GitHub (Kho Lưu Code)

GitHub giống như Google Drive nhưng chuyên dụng cho code. Mỗi lần bạn thêm tính năng mới, code sẽ được lưu vào đây.

### 3.1 Đăng Ký

1. Truy cập: **[github.com](https://github.com)**
2. Nhấn **"Sign up"** → điền email, tạo mật khẩu, chọn username
3. Xác nhận email

### 3.2 Tạo Repository (Kho Chứa Dự Án)

1. Đăng nhập GitHub → nhấn nút **"New"** (màu xanh lá)
2. Điền thông tin:
   - **Repository name:** `age-of-study` (hoặc bất kỳ tên nào bạn thích)
   - **Description:** `Ứng dụng học tập cho học sinh lớp 5`
   - Chọn **Public** (miễn phí, ai cũng xem được) hoặc **Private** (chỉ bạn thấy)
   - ✅ Tích vào **"Add a README file"**
3. Nhấn **"Create repository"**

### 3.3 Cài Git Trên Máy Tính

Git là công cụ để "đẩy" code lên GitHub.

1. Tải tại: **[git-scm.com/download/win](https://git-scm.com/download/win)**
2. Cài đặt, giữ nguyên tất cả tùy chọn mặc định
3. Mở Terminal trong VS Code, gõ:
```
git --version
```
Thấy `git version 2.x.x` → thành công.

4. Thiết lập tên và email (dùng thông tin GitHub của bạn):
```
git config --global user.name "Tên Của Bạn"
git config --global user.email "email@gmail.com"
```

---

## Bước 4: Tạo Dự Án Next.js (Khung Ứng Dụng)

### 4.1 Tạo Thư Mục Làm Việc

1. Tạo thư mục trên Desktop tên là `du-an-hoc-tap`
2. Trong VS Code: **File → Open Folder** → chọn thư mục vừa tạo

### 4.2 Tạo Dự Án Next.js

Mở Terminal trong VS Code (Ctrl + \`) và gõ từng lệnh:

```bash
npx create-next-app@latest age-of-study
```

Máy sẽ hỏi bạn một loạt câu hỏi. Trả lời như sau:

```
✔ Would you like to use TypeScript? → Yes
✔ Would you like to use ESLint? → Yes
✔ Would you like to use Tailwind CSS? → Yes
✔ Would you like your code inside a `src/` directory? → Yes
✔ Would you like to use App Router? → Yes
✔ Would you like to use Turbopack for next dev? → No
✔ Would you like to customize the import alias? → No
```

> ⏳ Đợi khoảng 1–2 phút để máy tải các file cần thiết.

### 4.3 Chạy Thử Dự Án

```bash
cd age-of-study
npm run dev
```

Mở trình duyệt, truy cập: **http://localhost:3000**

Nếu thấy trang Next.js mặc định hiện ra → **Thành công!** Dự án đã chạy trên máy bạn.

> Nhấn `Ctrl + C` trong Terminal để dừng server.

---

## Bước 5: Tạo Tài Khoản Supabase (Cơ Sở Dữ Liệu)

Supabase là nơi lưu trữ toàn bộ dữ liệu: học sinh, bài học, điểm số, thành tích...

### 5.1 Tạo Tài Khoản và Dự Án

1. Truy cập: **[supabase.com](https://supabase.com)** → **"Start your project"**
2. Chọn **"Continue with GitHub"** (đăng nhập bằng GitHub cho tiện)
3. Nhấn **"New project"**:
   - **Name:** `age-of-study`
   - **Database Password:** Tạo mật khẩu mạnh (lưu lại nơi nào đó!)
   - **Region:** Southeast Asia (Singapore) — gần Việt Nam nhất
4. Nhấn **"Create new project"** → đợi khoảng 1–2 phút

### 5.2 Lấy Thông Tin Kết Nối (Quan Trọng!)

1. Vào **Project Settings → API**
2. Chép lại hai thứ này (sẽ dùng ở bước sau):
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 5.3 Tạo File Chứa Thông Tin Kết Nối

Trong thư mục `age-of-study`, tạo file tên `.env.local` (lưu ý có dấu chấm ở đầu):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> ⚠️ **QUAN TRỌNG:** File `.env.local` chứa thông tin bí mật. **KHÔNG BAO GIỜ** đẩy file này lên GitHub. Next.js tự động bỏ qua file này khi đẩy code.

### 5.4 Cài Package Supabase

Trong Terminal:
```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## Bước 6: Kết Nối Code Với GitHub

### 6.1 Khởi Tạo Git Trong Dự Án

Trong Terminal (đảm bảo bạn đang trong thư mục `age-of-study`):

```bash
git init
git add .
git commit -m "Khởi tạo dự án Age of Study"
```

### 6.2 Kết Nối Với GitHub Repository

Vào GitHub, mở repository bạn đã tạo ở Bước 3. Copy đường dẫn dạng:
`https://github.com/ten-ban/age-of-study.git`

Trong Terminal:
```bash
git remote add origin https://github.com/ten-ban/age-of-study.git
git branch -M main
git push -u origin main
```

> Máy sẽ yêu cầu đăng nhập GitHub — điền tên và mật khẩu (hoặc Personal Access Token nếu được yêu cầu).

### 6.3 Quy Trình Lưu Code Mỗi Ngày

Mỗi khi bạn thêm tính năng mới hoặc sửa xong, hãy làm 3 bước này:

```bash
git add .
git commit -m "Thêm tính năng [mô tả ngắn]"
git push
```

**Ví dụ:**
```bash
git commit -m "Thêm trang đăng nhập cho học sinh"
git commit -m "Sửa lỗi hiển thị điểm số"
git commit -m "Thêm bài tập đọc hiểu chương 3"
```

---

## Bước 7: Deploy Lên Vercel (Đưa Web Lên Mạng)

Sau khi code xong và đẩy lên GitHub, bước này sẽ đưa ứng dụng lên internet để học sinh và phụ huynh có thể truy cập.

### 7.1 Tạo Tài Khoản Vercel

1. Truy cập: **[vercel.com](https://vercel.com)**
2. Nhấn **"Sign Up"** → chọn **"Continue with GitHub"**
3. Cho phép Vercel truy cập GitHub của bạn

### 7.2 Import Dự Án Từ GitHub

1. Trong Vercel: nhấn **"Add New → Project"**
2. Tìm repository `age-of-study` → nhấn **"Import"**
3. Vercel tự nhận ra đây là Next.js → nhấn **"Deploy"** (không cần thay đổi gì)

### 7.3 Thêm Biến Môi Trường Vào Vercel

> ⚠️ Bước này **BẮT BUỘC** — nếu bỏ qua, web sẽ lỗi vì không có thông tin kết nối Supabase.

1. Trong Vercel, vào **Project Settings → Environment Variables**
2. Thêm từng cặp:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` |

3. Nhấn **"Redeploy"** sau khi thêm xong

### 7.4 Kết Quả

Sau khi deploy thành công, Vercel cấp cho bạn một địa chỉ web dạng:
`https://age-of-study-ten-ban.vercel.app`

Từ giờ, **mỗi lần bạn `git push` lên GitHub → Vercel tự động cập nhật web mới nhất** mà không cần làm gì thêm!

---

## Cách Nói Chuyện Với AI Để Viết Code

Đây là phần quan trọng nhất. AI (GitHub Copilot) giỏi viết code, nhưng bạn phải biết cách "ra đề bài" rõ ràng.

### Nguyên Tắc Vàng: **Mô Tả Cụ Thể Như Viết Đề Bài Văn**

❌ **Prompt mơ hồ (AI sẽ làm sai):**
```
Tạo trang học tập cho học sinh
```

✅ **Prompt cụ thể (AI sẽ làm đúng):**
```
Tạo trang web cho học sinh lớp 5 đọc một đoạn văn ngắn về chủ đề 
"Quê hương". Trang có:
- Tiêu đề bài đọc màu xanh đậm
- Đoạn văn hiển thị rõ ràng, font chữ cỡ 16
- Nút "Đọc xong" màu xanh lá ở cuối trang
- Khi nhấn nút "Đọc xong" thì hiện thông báo "Giỏi lắm! Bạn đã đọc xong bài"
Dùng Tailwind CSS, viết bằng TypeScript, file đặt tại app/student/bai-doc/page.tsx
```

---

### Template Prompt Theo Từng Tình Huống

#### 🆕 Tạo Trang Mới

```
Tạo trang [tên trang] tại đường dẫn [app/đường-dẫn/page.tsx].
Trang này dành cho [học sinh/giáo viên/admin].
Chức năng: [mô tả chi tiết].
Giao diện: [màu sắc, bố cục, các nút bấm].
Dữ liệu cần hiển thị: [danh sách dữ liệu].
Dùng Tailwind CSS và TypeScript.
```

#### ✏️ Sửa Giao Diện

```
Trong file [tên file], 
[thành phần nào đó] hiện đang [trông như thế nào].
Tôi muốn đổi thành [muốn trông như thế nào].
Chỉ thay đổi phần giao diện, không động vào logic.
```

#### 🐛 Báo Lỗi Cho AI

```
Code của tôi đang bị lỗi. Đây là thông báo lỗi:
[dán toàn bộ chữ đỏ trong Terminal vào đây]

Đây là file bị lỗi: [tên file]
Đây là code hiện tại: [dán code vào đây]

Hãy giải thích lỗi là gì và sửa giúp tôi.
```

#### 📊 Kết Nối Supabase Lấy Dữ Liệu

```
Trong Supabase, tôi có bảng [tên bảng] với các cột: [cột 1, cột 2, cột 3...].
Tôi muốn hiển thị danh sách dữ liệu từ bảng này trong trang [tên trang].
Dùng Supabase client đã được cấu hình tại src/lib/supabase.ts.
Hiển thị dạng bảng với Tailwind CSS.
```

---

### Cách Mở Copilot Chat Trong VS Code

1. Nhấn `Ctrl + Shift + I` (hoặc nhấn biểu tượng chat ở thanh bên trái)
2. Gõ prompt của bạn vào ô chat
3. AI sẽ trả lời và có thể tự động sửa code trong file

> 💡 **Mẹo:** Khi đang mở file cần sửa, hỏi AI sẽ chính xác hơn vì AI biết context của file đó.

---

## Khi AI Viết Code Sai: Cách Nhận Biết và Sửa

Đây là phần **thực tế nhất** — AI không phải lúc nào cũng đúng. Dưới đây là các tình huống thường gặp và cách xử lý.

---

### Tình Huống 1: Trang Trắng Sau Khi Thêm Code Mới

**Dấu hiệu:** Mở http://localhost:3000 thấy trang trắng hoàn toàn.

**Nguyên nhân thường gặp:** Code bị lỗi syntax (như viết văn sai ngữ pháp).

**Cách xử lý:**
1. Nhìn vào Terminal — sẽ thấy chữ đỏ báo lỗi
2. Copy toàn bộ dòng chữ đỏ đó
3. Mở Copilot Chat, dán vào và hỏi:
```
Terminal báo lỗi này: [dán lỗi vào đây]
File bị lỗi là [tên file]. Lỗi ở đâu và sửa như thế nào?
```

---

### Tình Huống 2: Giao Diện Không Giống Yêu Cầu

**Dấu hiệu:** AI viết code chạy được nhưng trông không như bạn mô tả.

**Cách xử lý — Phương pháp "Chụp Màn Hình + Mô Tả":**

1. Chụp màn hình trang web hiện tại
2. Hỏi AI:
```
Trang web hiện tại trông như thế này: [mô tả những gì bạn thấy]
Tôi muốn: [mô tả chi tiết bạn muốn gì khác]
Cụ thể là:
- Nút "X" hiện màu xám, tôi muốn màu xanh lá #22c55e
- Chữ tiêu đề hiện quá nhỏ, tôi muốn cỡ chữ 24px, in đậm
- Logo hiện ở giữa, tôi muốn căn sang trái
```

---

### Tình Huống 3: Tính Năng Chạy Được Nhưng Không Đúng Logic

**Ví dụ:** Bạn muốn khi học sinh đạt 100 điểm thì hiện thông báo "Xuất sắc", nhưng AI làm cho bất kỳ điểm nào cũng hiện.

**Cách xử lý — Phương pháp "Kể Câu Chuyện":**
```
Tính năng của tôi hoạt động chưa đúng. Đây là câu chuyện người dùng:

1. Học sinh làm bài kiểm tra
2. Hệ thống tính điểm
3. NẾU điểm >= 90: hiện thông báo "Xuất sắc" màu vàng
4. NẾU điểm từ 70-89: hiện "Giỏi" màu xanh  
5. NẾU điểm < 70: hiện "Cần cố gắng thêm" màu đỏ nhạt

Hiện tại code đang [mô tả vấn đề].
Đây là đoạn code liên quan: [dán code vào]
Hãy sửa logic cho đúng.
```

---

### Tình Huống 4: AI Thay Đổi Quá Nhiều, Làm Hỏng Những Phần Đang Chạy Tốt

**Dấu hiệu:** Bạn chỉ hỏi sửa một nút, nhưng AI viết lại cả trang và giờ nhiều thứ khác bị hỏng.

**Cách phòng tránh trước:**
```
CHÚ Ý QUAN TRỌNG: Chỉ thay đổi [phần cụ thể].
ĐỪNG thay đổi bất kỳ phần nào khác trong file.
ĐỪNG xóa hoặc di chuyển bất kỳ component nào khác.
Chỉ sửa đúng chỗ tôi yêu cầu.
```

**Cách khắc phục khi đã xảy ra:**
1. Trong VS Code, nhấn `Ctrl + Z` nhiều lần để hoàn tác
2. Hoặc dùng Git để về phiên bản cũ:
```bash
git status         # xem những file nào bị thay đổi
git checkout -- tên-file.tsx    # hủy thay đổi của 1 file cụ thể
```

---

### Tình Huống 5: AI Nói "Tôi Không Thể Làm Điều Đó"

**Nguyên nhân:** Yêu cầu quá phức tạp hoặc AI không có đủ context.

**Cách xử lý — Phương pháp "Chia Nhỏ":**

Thay vì hỏi 1 câu lớn:
```
❌ Tạo toàn bộ hệ thống quản lý học sinh với đăng nhập, bảng điểm, 
   lịch học, thông báo phụ huynh và chatbot AI
```

Hỏi từng bước nhỏ:
```
✅ Bước 1: Tạo trang đăng nhập đơn giản với email và mật khẩu
✅ Bước 2: Sau khi đăng nhập, chuyển đến trang chính
✅ Bước 3: Trang chính hiển thị tên học sinh từ Supabase
... (tiếp tục từng bước)
```

---

### Tình Huống 6: Không Biết File Nào Cần Sửa

**Cách xử lý:**
1. Nhấn `Ctrl + Shift + F` trong VS Code để mở tìm kiếm toàn bộ dự án
2. Gõ chữ/nội dung bạn thấy trên trang web (ví dụ: "Đăng nhập" hoặc "Chào mừng")
3. VS Code sẽ tìm ra file chứa chữ đó

Hoặc hỏi AI:
```
Trên trang web tôi thấy dòng chữ "Chào mừng đến với Age of Study".
File nào trong dự án chứa dòng chữ này?
```

---

### Checklist Trước Khi Hỏi AI

Trước mỗi lần hỏi AI, hãy tự trả lời:
- [ ] Tôi muốn thêm/sửa/xóa cái gì? (tính năng, giao diện, hay dữ liệu?)
- [ ] Tính năng này ở trang nào? (đường dẫn URL là gì?)
- [ ] Người dùng nào sẽ dùng? (học sinh, giáo viên, hay admin?)
- [ ] Kết quả mong muốn trông như thế nào? (màu gì, to nhỏ thế nào, ở đâu?)
- [ ] File nào hiện đang liên quan? (nếu biết)

---

## Bảng Cứu Trợ Khẩn Cấp

### Khi Gặp Lỗi — Làm Ngay 3 Bước Này:

```
Bước 1: Copy toàn bộ chữ đỏ trong Terminal
Bước 2: Mở Copilot Chat (Ctrl + Shift + I)
Bước 3: Dán lỗi vào và hỏi "Lỗi này là gì và sửa như thế nào?"
```

### Bảng Lệnh Terminal Hay Dùng Nhất

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy web trên máy (http://localhost:3000) |
| `npm run build` | Kiểm tra code có lỗi không trước khi deploy |
| `Ctrl + C` | Dừng server đang chạy |
| `git add .` | Chuẩn bị lưu tất cả thay đổi |
| `git commit -m "mô tả"` | Lưu thay đổi với ghi chú |
| `git push` | Đẩy code lên GitHub |
| `git status` | Xem những file nào đã thay đổi |

### Những Việc KHÔNG Nên Làm

| ❌ Đừng làm | ✅ Thay vào đó |
|---|---|
| Xóa file `.env.local` | Giữ nguyên, đây là file bí mật quan trọng |
| Đẩy `.env.local` lên GitHub | File này đã được bảo vệ tự động |
| Hỏi AI sửa tất cả mọi thứ một lúc | Hỏi từng việc một, từng tính năng một |
| Bỏ qua lỗi đỏ trong Terminal | Luôn đọc và hỏi AI về lỗi |
| Xóa thư mục `node_modules` | Nếu lỡ xóa, chạy `npm install` để khôi phục |

### Template Prompt "Cứu Trợ Khẩn Cấp"

Khi mọi thứ bị hỏng và bạn không biết bắt đầu từ đâu, dùng prompt này:

```
Dự án Next.js của tôi đang có vấn đề. 

Đây là những gì tôi đã làm gần đây: [mô tả]
Đây là lỗi đang xảy ra: [copy lỗi từ terminal hoặc trình duyệt]
Đây là file tôi vừa chỉnh sửa: [tên file]

Hãy:
1. Giải thích ngắn gọn nguyên nhân
2. Đưa ra bước sửa cụ thể nhất
3. Không thay đổi bất kỳ file nào khác ngoài file đang lỗi
```

---

## Lời Kết: Hành Trình Của Người Giáo Viên Lập Trình

Xây dựng một ứng dụng như Age of Study không phải việc của một ngày. Đây là lộ trình thực tế:

| Tuần | Mục tiêu |
|---|---|
| **Tuần 1** | Cài đặt xong môi trường, chạy được web trên máy |
| **Tuần 2** | Tạo được 1-2 trang đơn giản với Copilot |
| **Tuần 3** | Kết nối được Supabase, hiển thị dữ liệu thật |
| **Tuần 4** | Deploy lên Vercel, chia sẻ cho 1 học sinh thử |
| **Tháng 2** | Thêm dần các tính năng, cải thiện theo phản hồi |
| **Tháng 3+** | Dự án hoàn thiện, học sinh dùng hàng ngày |

> **Nhớ rằng:** Bạn không cần "hiểu code". Bạn chỉ cần **hiểu mình muốn gì** và **biết cách nói với AI**. Phần còn lại, AI lo.

**Chúc bạn thành công! 🎉**

---

*Tài liệu này được tạo cho dự án Age of Study — Ứng dụng học tập thông minh cho học sinh tiểu học Việt Nam.*
