create table if not exists public.delivery_date_capacity (
  delivery_date date primary key,
  max_deliveries integer not null default 5 check (max_deliveries >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.delivery_date_capacity enable row level security;

create or replace function public.get_delivery_date_availability(p_delivery_date date)
returns table(
  delivery_date date,
  max_deliveries integer,
  booked_deliveries integer,
  remaining_slots integer,
  is_full boolean,
  is_limited boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  configured_max integer;
  booked integer;
begin
  select coalesce(d.max_deliveries, 5)
  into configured_max
  from public.delivery_date_capacity d
  where d.delivery_date = p_delivery_date;

  configured_max := coalesce(configured_max, 5);

  select count(*)::integer
  into booked
  from public.orders o
  where o.delivery_date::date = p_delivery_date
    and coalesce(lower(o.status), '') not in ('rejected', 'cancelled', 'issue');

  return query
    select
      p_delivery_date,
      configured_max,
      booked,
      greatest(configured_max - booked, 0),
      booked >= configured_max,
      booked < configured_max and greatest(configured_max - booked, 0) <= 2;
end;
$$;

create or replace function public.set_delivery_date_capacity(
  p_delivery_date date,
  p_max_deliveries integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.delivery_date_capacity (delivery_date, max_deliveries, updated_at)
  values (p_delivery_date, greatest(p_max_deliveries, 0), now())
  on conflict (delivery_date)
  do update set
    max_deliveries = excluded.max_deliveries,
    updated_at = now();
end;
$$;

grant execute on function public.get_delivery_date_availability(date) to anon, authenticated;
grant execute on function public.set_delivery_date_capacity(date, integer) to anon, authenticated;
