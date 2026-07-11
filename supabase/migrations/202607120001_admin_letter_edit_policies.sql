alter table public.letters enable row level security;

drop policy if exists "Authenticated admins can update letters" on public.letters;
create policy "Authenticated admins can update letters"
on public.letters
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated admins can delete letters" on public.letters;
create policy "Authenticated admins can delete letters"
on public.letters
for delete
to authenticated
using (true);
