alter table public.letters
  add column if not exists bouquet_image_url text not null default '';

insert into storage.buckets (id, name, public)
values ('letter-bouquets', 'letter-bouquets', true)
on conflict (id) do update
set public = true;

drop policy if exists "Public can read letter bouquet images" on storage.objects;
create policy "Public can read letter bouquet images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'letter-bouquets');

drop policy if exists "Authenticated admins can upload letter bouquet images" on storage.objects;
create policy "Authenticated admins can upload letter bouquet images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'letter-bouquets');

drop policy if exists "Authenticated admins can update letter bouquet images" on storage.objects;
create policy "Authenticated admins can update letter bouquet images"
on storage.objects
for update
to authenticated
using (bucket_id = 'letter-bouquets')
with check (bucket_id = 'letter-bouquets');

drop policy if exists "Authenticated admins can delete letter bouquet images" on storage.objects;
create policy "Authenticated admins can delete letter bouquet images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'letter-bouquets');
