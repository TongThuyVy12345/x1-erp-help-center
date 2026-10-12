-- 1. Tạo tài khoản email trong Supabase > Authentication > Users > Add user.
-- 2. Đổi admin@example.com thành email vừa tạo.
-- 3. Chạy SQL này trong Supabase SQL Editor (không đưa vào code frontend).
insert into public.admin_users (user_id)
select id from auth.users where lower(email) = lower('tongthuyvy2703@gmail.com')
on conflict (user_id) do nothing;
-- Kết quả: phải có 1 dòng đúng email nếu user đã được tạo.
select u.email, a.user_id from public.admin_users a join auth.users u on u.id = a.user_id;
