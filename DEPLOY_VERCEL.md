# Triển khai X1 ERP Help Center lên Vercel — hướng dẫn ngắn

**Bạn cần:** tài khoản [GitHub](https://github.com), [Vercel](https://vercel.com), [Supabase](https://supabase.com).

1. **Giải nén** mã nguồn ZIP (không upload nguyên file ZIP lên repo GitHub).
2. Tạo **Supabase Project**. Vào **SQL Editor** và chạy `supabase/schema.sql`.
3. Vào **Authentication → Users → Add user**, thêm email/mật khẩu Admin. Đổi email trong `supabase/make_admin.sql`, chạy file SQL này để cấp vai trò Admin.
4. Lấy `Project URL` và `Publishable key` trong bảng điều khiển Supabase. **Không lấy secret/service_role key**.
5. Tạo repository GitHub `x1-erp-help-center` rồi chạy trong thư mục dự án:

   ```bash
   git init
   git add .
   git commit -m "X1 ERP Help Center"
   git branch -M main
   git remote add origin https://github.com/TEN_TAI_KHOAN/x1-erp-help-center.git
   git push -u origin main
   ```

6. Vào [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → chọn repo. Cấu hình:

   - **Framework** = Vite
   - **Build command** = `npm run build`
   - **Output Directory** = `dist`
   - **Root Directory** = `./`

7. Trong **Environment Variables** điền:

   ```ini
   VITE_SUPABASE_URL=https://...supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

8. Nhấn **Deploy** → mở link Vercel do hệ thống cung cấp → vào `/login` bằng tài khoản Admin → vào `/admin/categories` để sửa cây chức năng, `/admin/articles/new` để đăng hướng dẫn. Người khác xem tại `/` và `/guides`.

**Chú ý:** Sau khi thêm/sửa Environment Variables trên Vercel, cần **Redeploy** để cập nhật bản build. Các bài viết đã lưu trong **Supabase** vẫn còn nguyên khi bạn cập nhật code ở Vercel. Xem `README.md` để có hướng dẫn chi tiết và xử lý lỗi.
