-- X1 Accounting: chạy toàn bộ script trong Supabase > SQL Editor.
-- Bảng dữ liệu, phân quyền phía máy chủ và kho hình ảnh.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 150),
  slug text not null unique check (length(trim(slug)) between 1 and 170),
  description text not null default '',
  parent_id uuid references public.categories(id) on delete restrict,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint category_not_own_parent check (id is distinct from parent_id)
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 200),
  slug text not null unique check (length(trim(slug)) between 1 and 220),
  excerpt text not null default '',
  content text not null default '',
  category_id uuid not null references public.categories(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_id uuid default auth.uid() references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create or replace function public.touch_article()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  -- Ghi nhận ngày đăng đầu tiên; xuất bản lại vẫn giữ ngày đăng gốc.
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;
drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at before update on public.categories for each row execute function public.touch_updated_at();
drop trigger if exists trg_articles_updated_at on public.articles;
create trigger trg_articles_updated_at before insert or update on public.articles for each row execute function public.touch_article();

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;

drop policy if exists "admins can see own membership" on public.admin_users;
create policy "admins can see own membership" on public.admin_users for select to authenticated using (user_id = (select auth.uid()));
-- Không cấp insert/update/delete của admin_users cho client: chỉ SQL Editor/service role cấp quyền.

drop policy if exists "all users read categories" on public.categories;
create policy "all users read categories" on public.categories for select to anon, authenticated using (true);
drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public reads published or admin reads all" on public.articles;
create policy "public reads published or admin reads all" on public.articles for select to anon, authenticated using (status = 'published' or public.is_admin());
drop policy if exists "admins manage articles" on public.articles;
create policy "admins manage articles" on public.articles for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.admin_users to authenticated;
grant select on public.categories, public.articles to anon, authenticated;
grant insert, update, delete on public.categories, public.articles to authenticated;

-- Kho ảnh công khai: chỉ quản trị viên có quyền upload/sửa/xóa.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('article-images', 'article-images', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin uploads article images" on storage.objects;
create policy "admin uploads article images" on storage.objects for insert to authenticated
  with check (bucket_id = 'article-images' and public.is_admin());
drop policy if exists "admin updates article images" on storage.objects;
create policy "admin updates article images" on storage.objects for update to authenticated
  using (bucket_id = 'article-images' and public.is_admin())
  with check (bucket_id = 'article-images' and public.is_admin());
drop policy if exists "admin removes article images" on storage.objects;
create policy "admin removes article images" on storage.objects for delete to authenticated
  using (bucket_id = 'article-images' and public.is_admin());
drop policy if exists "admin lists article images" on storage.objects;
create policy "admin lists article images" on storage.objects for select to authenticated
  using (bucket_id = 'article-images' and public.is_admin());

-- Danh mục mẫu từ thiết kế HTML. Không tự tạo bài viết để bạn soạn nội dung thật.
insert into public.categories (title, slug, description, position)
values
('Mua hàng', 'mua-hang', 'Đơn mua hàng, nhập kho và chi phí mua hàng', 1),
('Bán hàng', 'ban-hang', 'Bán hàng, xuất kho và hóa đơn khách hàng', 2),
('Kho', 'kho', 'Nhập, xuất, tồn kho và kiểm kê', 3),
('Sản xuất', 'san-xuat', 'Nguyên vật liệu, bán thành phẩm và thành phẩm', 4),
('Sửa chữa & Bảo hành', 'sua-chua-bao-hanh', 'Quy trình sửa chữa và tài sản cố định', 5),
('Tiền mặt (Quỹ)', 'tien-mat', 'Phiếu thu, phiếu chi và sổ quỹ', 6),
('Tiền gửi ngân hàng', 'tien-gui', 'Thu chi ngân hàng và đối chiếu', 7),
('Tạm ứng nội bộ', 'tam-ung', 'Đề nghị, thanh toán và quyết toán tạm ứng', 8),
('Vay nợ & Đầu tư', 'vay-no-dau-tu', 'Cho vay, khế ước và theo dõi lãi', 9),
('Kế toán tổng hợp', 'ke-toan-tong-hop', 'Bút toán, kết chuyển và khóa sổ', 10),
('Báo cáo & Phân tích', 'bao-cao-phan-tich', 'Sổ sách và báo cáo kế toán', 11)
on conflict (slug) do nothing;

insert into public.categories (title,slug,description,position,parent_id)
select v.title, v.slug, v.description, v.position, p.id
from (values
  ('Nhập kho mua hàng','nhap-kho-mua-hang','Ghi nhận nhập kho từ mua hàng',1,'mua-hang'),
  ('Trả hàng mua','tra-hang-mua','Quy trình trả hàng nhà cung cấp',2,'mua-hang'),
  ('Phân bổ chi phí mua','phan-bo-chi-phi-mua','Chi phí vận chuyển và chi phí mua hàng',3,'mua-hang'),
  ('Xuất kho bán hàng','xuat-kho-ban-hang','Giao hàng, ghi nhận doanh thu và giá vốn',1,'ban-hang'),
  ('Trả hàng bán','tra-hang-ban','Hàng bán bị trả lại và hoàn tiền',2,'ban-hang'),
  ('Giá vốn & doanh thu','gia-von-doanh-thu','Quy trình ghi nhận doanh thu',3,'ban-hang'),
  ('Sản xuất thành phẩm','san-xuat-thanh-pham','Xuất vật liệu và nhập thành phẩm',1,'san-xuat'),
  ('Sửa chữa tăng giá TSCĐ','sua-chua-tang-gia-tscd','Xuất vật tư sửa chữa và ghi tăng nguyên giá',1,'sua-chua-bao-hanh'),
  ('Phiếu thu','phieu-thu','Thu tiền mặt',1,'tien-mat'),
  ('Phiếu chi','phieu-chi','Chi tiền mặt',2,'tien-mat'),
  ('Thu ngân hàng','thu-ngan-hang','Thu qua tiền gửi',1,'tien-gui'),
  ('Chi ngân hàng','chi-ngan-hang','Chi qua tiền gửi',2,'tien-gui'),
  ('Đề nghị tạm ứng','de-nghi-tam-ung','Lập đề nghị tạm ứng',1,'tam-ung'),
  ('Quyết toán tạm ứng','quyet-toan-tam-ung','Thanh quyết toán tạm ứng',2,'tam-ung'),
  ('Khế ước cho vay','khe-uoc-cho-vay','Theo dõi gốc và lãi',1,'vay-no-dau-tu'),
  ('Hóa đơn dịch vụ','hoa-don-dich-vu','Hạch toán hóa đơn dịch vụ',1,'ke-toan-tong-hop'),
  ('Kết chuyển cuối kỳ','ket-chuyen-cuoi-ky','Kết chuyển chi phí và doanh thu',2,'ke-toan-tong-hop'),
  ('Báo cáo kế toán','bao-cao-ke-toan','Báo cáo tài chính và sổ sách',1,'bao-cao-phan-tich')
) as v(title,slug,description,position,parent_slug)
join public.categories p on p.slug = v.parent_slug
on conflict (slug) do nothing;
