alter table public.investor_profiles enable row level security;

drop policy if exists "Investors can create own profile" on public.investor_profiles;
create policy "Investors can create own profile"
on public.investor_profiles
for insert
to authenticated
with check (id = auth.uid() and role = 'investor');
