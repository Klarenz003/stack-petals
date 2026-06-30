alter table public.orders
  add column if not exists admin_note text not null default '';

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  label text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_id_created_at_idx
  on public.order_status_history (order_id, created_at);

alter table public.order_status_history enable row level security;

create or replace function public.record_order_status_history(
  p_order_id uuid,
  p_status text,
  p_label text,
  p_note text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.order_status_history (order_id, status, label, note)
  values (p_order_id, p_status, p_label, coalesce(p_note, ''));
end;
$$;

grant execute on function public.record_order_status_history(uuid, text, text, text) to anon, authenticated;
