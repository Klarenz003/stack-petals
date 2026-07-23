create table if not exists public.investor_payout_requests (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investor_profiles(id) on delete cascade,
  requested_amount numeric(12, 2) not null check (requested_amount > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'held', 'rejected')),
  payout_method text not null default '',
  note text not null default '',
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.investor_payout_requests enable row level security;

drop policy if exists "Investors can read own payout requests" on public.investor_payout_requests;
create policy "Investors can read own payout requests"
on public.investor_payout_requests
for select
to authenticated
using (investor_id = auth.uid() or public.is_investor_admin());

drop policy if exists "Investors can create own payout requests" on public.investor_payout_requests;
create policy "Investors can create own payout requests"
on public.investor_payout_requests
for insert
to authenticated
with check (investor_id = auth.uid() and status = 'pending');

drop policy if exists "Investor admins can manage payout requests" on public.investor_payout_requests;
create policy "Investor admins can manage payout requests"
on public.investor_payout_requests
for all
to authenticated
using (public.is_investor_admin())
with check (public.is_investor_admin());
