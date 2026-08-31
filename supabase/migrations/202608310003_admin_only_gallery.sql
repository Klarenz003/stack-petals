-- Gallery content remains public, but only Stack Petals admins may manage it.

drop policy if exists "Public can read featured gallery images" on public.gallery_images;
drop policy if exists "Public reads featured gallery images and admins read all" on public.gallery_images;
create policy "Public reads featured gallery images and admins read all"
on public.gallery_images
for select
to anon, authenticated
using (
  featured = true
  or public.current_admin_market() in ('PH', 'CA', 'ALL')
);

drop policy if exists "Authenticated admins can create gallery images" on public.gallery_images;
drop policy if exists "Stack Petals admins create gallery images" on public.gallery_images;
create policy "Stack Petals admins create gallery images"
on public.gallery_images
for insert
to authenticated
with check (public.current_admin_market() in ('PH', 'CA', 'ALL'));

drop policy if exists "Authenticated admins can update gallery images" on public.gallery_images;
drop policy if exists "Stack Petals admins update gallery images" on public.gallery_images;
create policy "Stack Petals admins update gallery images"
on public.gallery_images
for update
to authenticated
using (public.current_admin_market() in ('PH', 'CA', 'ALL'))
with check (public.current_admin_market() in ('PH', 'CA', 'ALL'));

drop policy if exists "Authenticated admins can delete gallery images" on public.gallery_images;
drop policy if exists "Stack Petals admins delete gallery images" on public.gallery_images;
create policy "Stack Petals admins delete gallery images"
on public.gallery_images
for delete
to authenticated
using (public.current_admin_market() in ('PH', 'CA', 'ALL'));

drop policy if exists "Authenticated admins can upload gallery images" on storage.objects;
drop policy if exists "Stack Petals admins upload gallery images" on storage.objects;
create policy "Stack Petals admins upload gallery images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'gallery-images'
  and public.current_admin_market() in ('PH', 'CA', 'ALL')
);

drop policy if exists "Authenticated admins can update gallery images" on storage.objects;
drop policy if exists "Stack Petals admins update gallery image files" on storage.objects;
create policy "Stack Petals admins update gallery image files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'gallery-images'
  and public.current_admin_market() in ('PH', 'CA', 'ALL')
)
with check (
  bucket_id = 'gallery-images'
  and public.current_admin_market() in ('PH', 'CA', 'ALL')
);

drop policy if exists "Authenticated admins can delete gallery images" on storage.objects;
drop policy if exists "Stack Petals admins delete gallery image files" on storage.objects;
create policy "Stack Petals admins delete gallery image files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'gallery-images'
  and public.current_admin_market() in ('PH', 'CA', 'ALL')
);
