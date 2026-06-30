insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do update
set public = true;

drop policy if exists "Public can upload payment proofs" on storage.objects;
create policy "Public can upload payment proofs"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'proofs');

drop policy if exists "Public can read payment proofs" on storage.objects;
create policy "Public can read payment proofs"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'proofs');

alter table public.orders enable row level security;

drop policy if exists "Public can create orders" on public.orders;
create policy "Public can create orders"
on public.orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can read orders for tracking" on public.orders;
create policy "Public can read orders for tracking"
on public.orders
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated can update orders" on public.orders;
create policy "Authenticated can update orders"
on public.orders
for update
to authenticated
using (true)
with check (true);

alter table public.letters enable row level security;

drop policy if exists "Public can create letters" on public.letters;
create policy "Public can create letters"
on public.letters
for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can read published letters" on public.letters;
create policy "Public can read published letters"
on public.letters
for select
to anon, authenticated
using (published = true or auth.role() = 'authenticated');

alter table public.order_status_history enable row level security;

drop policy if exists "Public can create order status history" on public.order_status_history;
create policy "Public can create order status history"
on public.order_status_history
for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can read order status history" on public.order_status_history;
create policy "Public can read order status history"
on public.order_status_history
for select
to anon, authenticated
using (true);
