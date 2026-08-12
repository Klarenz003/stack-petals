create table if not exists public.business_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category text not null,
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_expenses_expense_date_idx
  on public.business_expenses (expense_date desc);

create table if not exists public.business_budgets (
  month_start date primary key check (month_start = date_trunc('month', month_start)::date),
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  updated_at timestamptz not null default now()
);

alter table public.business_expenses enable row level security;
alter table public.business_budgets enable row level security;

drop policy if exists "Authenticated admins manage business expenses" on public.business_expenses;
create policy "Authenticated admins manage business expenses"
on public.business_expenses for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated admins manage business budgets" on public.business_budgets;
create policy "Authenticated admins manage business budgets"
on public.business_budgets for all to authenticated using (true) with check (true);
