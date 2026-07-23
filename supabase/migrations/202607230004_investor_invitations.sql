create table if not exists public.investor_invitations (
  id uuid primary key default gen_random_uuid(),
  investor_name text not null default '',
  message text not null default '',
  sender_name text not null default 'Owner of Stack Petals',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.investor_invitations enable row level security;

drop policy if exists "Public can read published investor invitations" on public.investor_invitations;
create policy "Public can read published investor invitations"
on public.investor_invitations
for select
to anon, authenticated
using (published = true or public.is_investor_admin());

drop policy if exists "Investor admins can manage invitations" on public.investor_invitations;
create policy "Investor admins can manage invitations"
on public.investor_invitations
for all
to authenticated
using (public.is_investor_admin())
with check (public.is_investor_admin());
