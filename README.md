# X1 ERP Help Center – Website hướng dẫn sử dụng

Dự án web **React + Vite + Supabase**, triển khai trên **Vercel**, dựa trên 6 giao diện HTML gốc trong `design-references/`. Đây là ứng dụng hoạt động với cơ sở dữ liệu thật, không chỉ là HTML tĩnh.

## 1. Các màn hình

| Giao diện gốc | Trang trong dự án | Đường dẫn |
|---|---|---|
| `4.html` | Trang chủ người xem | `/` |
| `5.html` | Đăng nhập | `/login` |
| `6.html`, `2.html` | Danh mục và đọc chi tiết bài | `/guides`, `/guides/:slug` |
| `1.html` | Quản lý cây chức năng cha / con | `/admin/categories` |
| `3.html` | Soạn Markdown, upload ảnh, lưu nháp, xuất bản | `/admin/articles/new`, `/admin/articles/:id` |
| Mở rộng từ thiết kế CMS | Dashboard và danh sách bài | `/admin`, `/admin/articles` |

Tính năng: tạo/sửa/xóa chuyên mục phân cấp, chỉnh thứ tự bằng mũi tên lên/xuống, soạn bài Markdown có bảng/liên kết/ảnh, nhập và xuất file `.md`, xem trước, lưu nháp, xuất bản, tìm kiếm, lưu ngày đăng và cập nhật, giao diện đọc **không có quyền sửa**, responsive trên điện thoại.

**Lưu ý:** Hiện chưa có gửi mail, lịch sử phiên bản, upload video, phản hồi lưu máy chủ hoặc tìm kiếm toàn văn quy mô lớn. Các nút phản hồi người đọc chỉ phản ánh lựa chọn trong phiên trang web; in tài liệu dùng chức năng Print/Save as PDF của trình duyệt. Logo `X1` trong code được tạo bằng CSS; thay bằng file logo thực tế khi cần.

## 2. Cài đặt để chạy ở Ubuntu / VS Code

Yêu cầu: Node.js 20.19+ hoặc 22.12+, npm.

```bash
unzip x1-erp-help-center.zip
cd x1-erp-help-center
npm install
cp .env.example .env.local
# Điền VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY trong .env.local
npm run dev
```

Mở `http://localhost:5173`.

**Nếu chưa cấu hình Supabase:** trang chủ và bài mẫu vẫn hiển thị ở chế độ **minh họa chỉ đọc**. Không thể đăng nhập, tạo bài hoặc lưu dữ liệu khi chưa kết nối Supabase.

## 3. Tạo database Supabase

1. Vào https://supabase.com/dashboard, đăng nhập và chọn **New project**. Đợi Supabase cấp database.
2. Chọn **SQL Editor → New query**. Mở và sao chép **toàn bộ** file `supabase/schema.sql`, nhấn **Run**. Script tạo `categories`, `articles`, `admin_users`, Storage bucket `article-images`, Row Level Security và cây chức năng khởi tạo.
3. Chọn **Project → Connect** (hoặc **Project Settings → API Keys** trong giao diện tương ứng), lấy **Project URL** và **Publishable key** (hoặc legacy **anon public key**), ví dụ:

```ini
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

4. Điền vào `.env.local` để chạy trên máy. **Không được dùng `service_role` / secret key** trong các biến bắt đầu `VITE_` vì chúng được công khai tới trình duyệt.

## 4. Tạo tài khoản Admin lần đầu

1. Trong Supabase Dashboard → **Authentication → Users → Add user**, nhập email và mật khẩu Admin. Nên đánh dấu email đã được xác nhận (nếu tùy chọn đó hiện ra).
2. Mở `supabase/make_admin.sql`, thay `admin@example.com` thành email vừa tạo. Chạy SQL trong Supabase **SQL Editor**.
3. Đăng nhập tại `http://localhost:5173/login` hoặc `https://ten-web.vercel.app/login`. Tài khoản đã nằm trong bảng `admin_users` sẽ được chuyển đến `/admin`.
4. Muốn tạo tài khoản chỉ xem: thêm người dùng mới trong Authentication → Users nhưng **không** thêm vào `admin_users`. Ngoài ra, trang người đọc mặc định **không cần đăng nhập**.

Chính sách database chặn người xem sửa dữ liệu ngay cả khi họ tự gọi API. Không có chức năng đăng ký Admin công khai.

## 5. Cách đưa code lên GitHub rồi deploy Vercel (khuyên dùng)

**Bước 1: Đưa thư mục code lên GitHub**

- Đăng nhập https://github.com → **New repository**, đặt tên `x1-erp-help-center` → tạo repo riêng tư (Private) hoặc công khai theo chính sách công ty.
- Trong terminal VS Code tại thư mục dự án (không phải thư mục cha của ZIP), chạy:

```bash
git init
git add .
git commit -m "Initial X1 ERP Help Center"
git branch -M main
git remote add origin https://github.com/TEN_GITHUB/x1-erp-help-center.git
git push -u origin main
```

- Nếu repo GitHub tạo sẵn có README/commit, xử lý lịch sử trước khi push; dễ nhất tạo repo **trống** lúc đầu. Nếu dùng giao diện GitHub **Add file → Upload files**, cần **giải nén ZIP trước**, upload nội dung thư mục, không tải ZIP nguyên khối làm source code.

**Bước 2: Triển khai trên Vercel**

1. Vào https://vercel.com/new → **Import Git Repository** → kết nối GitHub → chọn `x1-erp-help-center`.
2. Framework Preset: **Vite** (thường tự phát hiện); Build Command: `npm run build`; Output Directory: `dist`; Root Directory: `./`.
3. Ở mục **Environment Variables** tạo đúng hai biến:

   `VITE_SUPABASE_URL` = URL Supabase

   `VITE_SUPABASE_PUBLISHABLE_KEY` = publishable / anon key

   Chọn **Production** (và **Preview** nếu cần thử các branch khác). Đây là publishable key, có thể dùng ở client; bảo mật phụ thuộc vào **RLS** đã chạy trong bước 3.
4. Nhấn **Deploy**. Sau khi hoàn tất, vào link dạng `https://x1-erp-help-center-xxx.vercel.app` → xem Trang chủ, `/guides`, `/login`, `/admin`.
5. Nếu đã Deploy **trước khi thêm biến môi trường**: vào Vercel → Project → **Settings → Environment Variables** để thêm, sau đó **Deployments → Redeploy** vì Vite nhúng biến vào lúc build.

Khi muốn sửa code sau này:

```bash
git add .
git commit -m "Update documentation portal"
git push
```

Vercel tự build lại từ GitHub; các bài viết và ảnh đã lưu trên Supabase **không mất khi redeploy**.

### Cách khác: deploy trực tiếp từ terminal (không cần tạo GitHub trước)

```bash
npm install
npm install -g vercel
vercel login
vercel       # liên kết hoặc tạo project; Preview
vercel --prod  # đẩy Production
```

Nhớ thêm 2 biến môi trường ở **Vercel Project Settings** và `vercel --prod` lại sau khi thêm biến. Không cần `git push` với cách này.

## 6. Cách sử dụng CMS

1. Vào `/login` bằng Admin.
2. Chọn **Chuyên mục & Menu** → **Thêm chức năng cha** hoặc chọn một mục rồi **Thêm chức năng con** → nhập tên, slug, mô tả, thứ tự và nhấn **Lưu chuyên mục**. Chọn mục và nhấn ↑ / ↓ để đổi thứ tự cùng cấp. Không thể xóa chuyên mục nếu còn bài hoặc danh mục con.
3. Chọn **Quản lý bài viết → Thêm bài viết** → nhập tiêu đề, chọn chuyên mục, điền mô tả, nội dung Markdown.
4. Nhấn **Chèn ảnh** để upload PNG/JPG/WEBP/GIF tối đa 5MB. Ảnh được lưu Supabase Storage, hệ thống tự chèn cú pháp Markdown `![Mô tả](https://...)`.
5. Nhấn **Lưu bản nháp** để người xem chưa thấy; nhấn **Xuất bản bài viết** để người xem truy cập được. Ngày đăng đầu tiên (`published_at`) được tạo ở database khi bài chuyển sang trạng thái Published; `updated_at` cập nhật khi sửa.
6. Bấm **Chế độ người xem** hoặc mở trang `/guides` để kiểm tra kết quả. Người đọc không thấy nút sửa trừ khi đang có quyền Admin.

Có thể **nhập file .md**, **xuất file .md**, dùng Markdown theo mẫu:

```md
# Hướng dẫn tạo phiếu thu

## 1. Mục đích
Quy trình ghi nhận khoản tiền thu.

## 2. Các bước thực hiện
### Bước 1: Vào phân hệ Tiền mặt
Chọn **Tiền mặt → Phiếu thu**.

![Màn hình tạo phiếu thu](https://duong-dan-anh.png)

| Trường | Hướng dẫn |
| --- | --- |
| Khách hàng | Chọn đối tác |
| Số tiền | Nhập số tiền |
```

## 7. Những lỗi thường gặp

| Hiện tượng | Kiểm tra |
|---|---|
| Trang chủ chỉ hiển thị demo | Hai biến `VITE_...` chưa được điền, sai tên hoặc chưa build lại. |
| Trang trắng / lỗi 404 khi truy cập thẳng `/admin` | Kiểm tra `vercel.json` có rewrite SPA; redeploy. |
| `Could not find table ...` | Chưa chạy `supabase/schema.sql` trên project đúng. |
| Đăng nhập được nhưng không thấy CMS | Chưa thêm UUID user vào `admin_users`. Chạy `make_admin.sql` và đăng nhập lại. |
| Upload ảnh 403/Unauthorized | Chưa tạo bucket/policy, chưa là Admin, ảnh quá 5MB hoặc định dạng không cho phép. |
| Lưu bài lỗi `duplicate key` | Slug đã trùng với bài/chuyên mục khác, đổi slug. |
| Lưu bài thành công nhưng người xem không thấy | Bài vẫn đang ở trạng thái **draft**; chuyển sang **published**. |

## 8. Phân quyền / lưu ý kỹ thuật

- **Admin** được xác định từ `public.admin_users`, không lấy từ localStorage hay một biến frontend.
- `categories`: ai cũng được đọc; chỉ Admin tạo/sửa/xóa.
- `articles`: công khai **chỉ những bản published**; chỉ Admin được đọc nháp/chỉnh sửa.
- `article-images`: file công khai để nhúng vào bài; chỉ Admin upload/sửa/xóa thông qua RLS.
- Người đọc có thể đọc công khai không cần tài khoản. Nếu cần giới hạn nội bộ, phải thay đổi policy đọc và thêm màn hình kiểm tra quyền người xem; bản hiện tại được thiết kế là **cổng tài liệu công khai**.
- Nội dung Markdown được xử lý bằng `react-markdown` + `rehype-sanitize`, không chạy HTML tùy ý của người soạn.
- Tìm kiếm hiện tại lọc dữ liệu người dùng được RLS cho phép tải xuống ở phía trình duyệt; với quy mô hàng chục nghìn bài nên chuyển sang tìm kiếm phân trang hoặc full-text ở PostgreSQL.
- Supabase Free và Vercel Free có hạn mức theo gói; kiểm tra điều khoản sử dụng và hạn mức trước khi dùng quy mô lớn.

## 9. Cấu trúc mã nguồn

```text
x1-erp-help-center/
├── index.html
├── src/
│   ├── main.jsx / App.jsx / state.jsx / style.css
│   ├── pages/           # Public, Login, Admin, Editor
│   ├── components/      # Header, Tree, Markdown
│   └── lib/             # Supabase, demo, helpers
├── supabase/
│   ├── schema.sql       # Tables + RLS + bucket + cây chức năng mẫu
│   └── make_admin.sql   # Cấp Admin lần đầu
├── design-references/   # 6 file HTML gốc
├── vercel.json          # Rewrite tuyến React SPA
├── .env.example
└── package.json
```
