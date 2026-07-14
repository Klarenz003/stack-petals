create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text not null default '',
  caption text not null default '',
  featured boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gallery_images_featured_sort_idx
  on public.gallery_images (featured, sort_order, created_at desc);

alter table public.gallery_images enable row level security;

drop policy if exists "Public can read featured gallery images" on public.gallery_images;
create policy "Public can read featured gallery images"
on public.gallery_images
for select
to anon, authenticated
using (featured = true or auth.role() = 'authenticated');

drop policy if exists "Authenticated admins can create gallery images" on public.gallery_images;
create policy "Authenticated admins can create gallery images"
on public.gallery_images
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated admins can update gallery images" on public.gallery_images;
create policy "Authenticated admins can update gallery images"
on public.gallery_images
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated admins can delete gallery images" on public.gallery_images;
create policy "Authenticated admins can delete gallery images"
on public.gallery_images
for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('gallery-images', 'gallery-images', true)
on conflict (id) do update
set public = true;

drop policy if exists "Public can read gallery images" on storage.objects;
create policy "Public can read gallery images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'gallery-images');

drop policy if exists "Authenticated admins can upload gallery images" on storage.objects;
create policy "Authenticated admins can upload gallery images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'gallery-images');

drop policy if exists "Authenticated admins can update gallery images" on storage.objects;
create policy "Authenticated admins can update gallery images"
on storage.objects
for update
to authenticated
using (bucket_id = 'gallery-images')
with check (bucket_id = 'gallery-images');

drop policy if exists "Authenticated admins can delete gallery images" on storage.objects;
create policy "Authenticated admins can delete gallery images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'gallery-images');
