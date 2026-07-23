alter table public.investor_payout_requests
  add column if not exists account_type text not null default '',
  add column if not exists account_number text not null default '',
  add column if not exists account_name text not null default '';
