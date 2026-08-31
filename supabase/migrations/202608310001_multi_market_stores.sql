-- Stack Petals multi-market foundation.
-- Existing storefront data is assigned to the Philippines market during migration.

create table if not exists public.store_markets (
  code text primary key check (code in ('PH', 'CA')),
  name text not null,
  locale text not null,
  currency_code text not null check (currency_code in ('PHP', 'CAD')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.store_markets (code, name, locale, currency_code)
values
  ('PH', 'Philippines', 'en-PH', 'PHP'),
  ('CA', 'Canada', 'en-CA', 'CAD')
on conflict (code) do update set
  name = excluded.name,
  locale = excluded.locale,
  currency_code = excluded.currency_code;

alter table public.investor_profiles
  add column if not exists admin_market text;

update public.investor_profiles
set admin_market = 'ALL'
where role = 'admin' and admin_market is null;

alter table public.investor_profiles
  drop constraint if exists investor_profiles_admin_market_check;

alter table public.investor_profiles
  add constraint investor_profiles_admin_market_check
  check (admin_market is null or admin_market in ('PH', 'CA', 'ALL'));

create or replace function public.current_admin_market()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select profile.admin_market
  from public.investor_profiles profile
  where profile.id = auth.uid()
    and profile.role = 'admin'
  limit 1;
$$;

create or replace function public.admin_can_access_market(p_market_code text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select profile.role = 'admin'
        and profile.admin_market in ('ALL', upper(p_market_code))
      from public.investor_profiles profile
      where profile.id = auth.uid()
      limit 1
    ),
    false
  );
$$;

revoke all on function public.current_admin_market() from public;
revoke all on function public.admin_can_access_market(text) from public;
grant execute on function public.current_admin_market() to authenticated;
grant execute on function public.admin_can_access_market(text) to authenticated;

create table if not exists public.product_markets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  market_code text not null references public.store_markets(code),
  price numeric(12, 2) not null check (price >= 0),
  sale_price numeric(12, 2) check (sale_price is null or sale_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  featured boolean not null default false,
  active boolean not null default true,
  pre_order_allowed boolean not null default true,
  prep_days integer not null default 5 check (prep_days >= 0),
  delivery_restrictions text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, market_code)
);

insert into public.product_markets (
  product_id,
  market_code,
  price,
  sale_price,
  stock,
  featured,
  active,
  pre_order_allowed,
  prep_days,
  delivery_restrictions
)
select
  product.id,
  'PH',
  coalesce(product.price, 0),
  product.sale_price,
  coalesce(product.stock, 0),
  coalesce(product.featured, false),
  true,
  coalesce(product.pre_order_allowed, true),
  coalesce(product.prep_days, 5),
  coalesce(product.delivery_restrictions, '')
from public.products product
on conflict (product_id, market_code) do nothing;

create index if not exists product_markets_market_active_idx
  on public.product_markets (market_code, active, sort_order, created_at desc);

alter table public.product_markets enable row level security;

drop policy if exists "Public can read active market products" on public.product_markets;
create policy "Public can read active market products"
on public.product_markets
for select
to anon, authenticated
using (active or public.admin_can_access_market(market_code));

drop policy if exists "Market admins can create market products" on public.product_markets;
create policy "Market admins can create market products"
on public.product_markets
for insert
to authenticated
with check (public.admin_can_access_market(market_code));

drop policy if exists "Market admins can update market products" on public.product_markets;
create policy "Market admins can update market products"
on public.product_markets
for update
to authenticated
using (public.admin_can_access_market(market_code))
with check (public.admin_can_access_market(market_code));

drop policy if exists "Market admins can delete market products" on public.product_markets;
create policy "Market admins can delete market products"
on public.product_markets
for delete
to authenticated
using (public.admin_can_access_market(market_code));

alter table public.products enable row level security;

do $$
declare policy_row record;
begin
  for policy_row in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'products'
  loop
    execute format('drop policy if exists %I on public.products', policy_row.policyname);
  end loop;
end $$;

create policy "Public can read product details"
on public.products for select to anon, authenticated using (true);

create policy "Market admins can create product details"
on public.products for insert to authenticated
with check (public.current_admin_market() in ('PH', 'CA', 'ALL'));

create policy "Market admins can update owned product details"
on public.products for update to authenticated
using (
  public.current_admin_market() = 'ALL'
  or exists (
    select 1 from public.product_markets market_product
    where market_product.product_id = products.id
      and public.admin_can_access_market(market_product.market_code)
  )
)
with check (
  public.current_admin_market() = 'ALL'
  or exists (
    select 1 from public.product_markets market_product
    where market_product.product_id = products.id
      and public.admin_can_access_market(market_product.market_code)
  )
);

create policy "Market admins can delete owned product details"
on public.products for delete to authenticated
using (
  public.current_admin_market() = 'ALL'
  or exists (
    select 1 from public.product_markets market_product
    where market_product.product_id = products.id
      and public.admin_can_access_market(market_product.market_code)
  )
);

create or replace function public.get_storefront_products(p_market_code text)
returns table (
  id uuid,
  product_id uuid,
  name text,
  price numeric,
  sale_price numeric,
  image text,
  category text,
  badge text,
  stock integer,
  featured boolean,
  pre_order_allowed boolean,
  prep_days integer,
  delivery_restrictions text,
  market_code text,
  currency_code text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    market_product.id,
    product.id,
    product.name,
    market_product.price,
    market_product.sale_price,
    product.image,
    product.category,
    product.badge,
    market_product.stock,
    market_product.featured,
    market_product.pre_order_allowed,
    market_product.prep_days,
    market_product.delivery_restrictions,
    market_product.market_code,
    market.currency_code
  from public.product_markets market_product
  join public.products product on product.id = market_product.product_id
  join public.store_markets market on market.code = market_product.market_code
  where market_product.market_code = upper(p_market_code)
    and market_product.active = true
    and market.active = true
  order by market_product.sort_order asc, market_product.created_at desc;
$$;

revoke all on function public.get_storefront_products(text) from public;
grant execute on function public.get_storefront_products(text) to anon, authenticated;

alter table public.orders
  add column if not exists market_code text not null default 'PH' references public.store_markets(code),
  add column if not exists currency_code text not null default 'PHP';

alter table public.orders
  drop constraint if exists orders_currency_code_check;

alter table public.orders
  add constraint orders_currency_code_check check (currency_code in ('PHP', 'CAD'));

create index if not exists orders_market_created_at_idx
  on public.orders (market_code, created_at desc);

drop policy if exists "Authenticated can update orders" on public.orders;
drop policy if exists "Stack Petals admins can read orders" on public.orders;
drop policy if exists "Market admins can read orders" on public.orders;
drop policy if exists "Market admins can update orders" on public.orders;

create policy "Market admins can read orders"
on public.orders
for select
to authenticated
using (public.admin_can_access_market(market_code));

create policy "Market admins can update orders"
on public.orders
for update
to authenticated
using (public.admin_can_access_market(market_code))
with check (public.admin_can_access_market(market_code));

drop policy if exists "Stack Petals admins can read order status history" on public.order_status_history;
drop policy if exists "Market admins can read order status history" on public.order_status_history;

create policy "Market admins can read order status history"
on public.order_status_history
for select
to authenticated
using (
  exists (
    select 1
    from public.orders orders
    where orders.id = order_status_history.order_id
      and public.admin_can_access_market(orders.market_code)
  )
);

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
declare order_market text;
begin
  select orders.market_code into order_market
  from public.orders orders where orders.id = p_order_id;

  if order_market is null then
    raise exception 'Order not found.';
  end if;

  if auth.uid() is not null then
    if not public.admin_can_access_market(order_market) then
      raise exception 'Admin access to this order market is required.' using errcode = '42501';
    end if;
  elsif p_status not in ('pending', 'preorder') or exists (
    select 1 from public.order_status_history history where history.order_id = p_order_id
  ) then
    raise exception 'Public order history can only be initialized once.' using errcode = '42501';
  end if;

  insert into public.order_status_history (order_id, status, label, note)
  values (p_order_id, p_status, p_label, coalesce(p_note, ''));
end;
$$;

create table if not exists public.market_stock_reservations (
  id uuid primary key default gen_random_uuid(),
  session_token text not null,
  market_product_id uuid not null references public.product_markets(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (session_token, market_product_id)
);

create index if not exists market_stock_reservations_expires_idx
  on public.market_stock_reservations (expires_at);

alter table public.market_stock_reservations enable row level security;

create or replace function public.release_expired_market_stock_reservations()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.product_markets market_product
  set stock = market_product.stock + expired.total_quantity,
      updated_at = now()
  from (
    select market_product_id, sum(quantity)::integer as total_quantity
    from public.market_stock_reservations
    where expires_at <= now()
    group by market_product_id
  ) expired
  where market_product.id = expired.market_product_id;

  delete from public.market_stock_reservations where expires_at <= now();
end;
$$;

create or replace function public.release_market_stock_reservation(p_session_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.product_markets market_product
  set stock = market_product.stock + released.quantity,
      updated_at = now()
  from (
    select market_product_id, sum(quantity)::integer as quantity
    from public.market_stock_reservations
    where session_token = p_session_token
    group by market_product_id
  ) released
  where market_product.id = released.market_product_id;

  delete from public.market_stock_reservations where session_token = p_session_token;
end;
$$;

create or replace function public.commit_market_stock_reservation(p_session_token text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.market_stock_reservations where session_token = p_session_token;
$$;

create or replace function public.reserve_market_cart_stock(
  p_market_code text,
  p_session_token text,
  p_items jsonb,
  p_minutes integer default 15
)
returns table(success boolean, message text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  reservation_expires_at timestamptz := now() + make_interval(mins => greatest(coalesce(p_minutes, 15), 1));
begin
  if upper(p_market_code) not in ('PH', 'CA') then
    return query select false, 'Invalid store market.'::text, null::timestamptz;
    return;
  end if;

  if p_session_token is null or length(trim(p_session_token)) = 0 then
    return query select false, 'Missing checkout session.'::text, null::timestamptz;
    return;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return query select false, 'Your cart is empty.'::text, null::timestamptz;
    return;
  end if;

  perform public.release_expired_market_stock_reservations();
  perform public.release_market_stock_reservation(p_session_token);

  for item in
    select market_product_id, quantity
    from jsonb_to_recordset(p_items) as x(market_product_id uuid, quantity integer)
  loop
    update public.product_markets
    set stock = stock - item.quantity,
        updated_at = now()
    where id = item.market_product_id
      and market_code = upper(p_market_code)
      and active = true
      and stock >= item.quantity
      and item.quantity > 0;

    if not found then
      perform public.release_market_stock_reservation(p_session_token);
      return query select false, 'An item is no longer available in this store.'::text, null::timestamptz;
      return;
    end if;

    insert into public.market_stock_reservations (session_token, market_product_id, quantity, expires_at)
    values (p_session_token, item.market_product_id, item.quantity, reservation_expires_at);
  end loop;

  return query select true, 'Stock reserved for checkout.'::text, reservation_expires_at;
end;
$$;

grant execute on function public.release_expired_market_stock_reservations() to anon, authenticated;
grant execute on function public.release_market_stock_reservation(text) to anon, authenticated;
grant execute on function public.commit_market_stock_reservation(text) to anon, authenticated;
grant execute on function public.reserve_market_cart_stock(text, text, jsonb, integer) to anon, authenticated;

alter table public.delivery_date_capacity
  add column if not exists market_code text not null default 'PH' references public.store_markets(code);

alter table public.delivery_date_capacity
  drop constraint if exists delivery_date_capacity_pkey;

alter table public.delivery_date_capacity
  add primary key (market_code, delivery_date);

create or replace function public.get_market_delivery_date_availability(
  p_market_code text,
  p_delivery_date date
)
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
  select coalesce(capacity.max_deliveries, 5)
  into configured_max
  from public.delivery_date_capacity capacity
  where capacity.delivery_date = p_delivery_date
    and capacity.market_code = upper(p_market_code);

  configured_max := coalesce(configured_max, 5);

  select count(*)::integer into booked
  from public.orders orders
  where orders.delivery_date::date = p_delivery_date
    and orders.market_code = upper(p_market_code)
    and coalesce(lower(orders.status), '') not in ('rejected', 'cancelled', 'issue');

  return query select
    p_delivery_date,
    configured_max,
    booked,
    greatest(configured_max - booked, 0),
    booked >= configured_max,
    booked < configured_max and greatest(configured_max - booked, 0) <= 2;
end;
$$;

create or replace function public.set_market_delivery_date_capacity(
  p_market_code text,
  p_delivery_date date,
  p_max_deliveries integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_can_access_market(upper(p_market_code)) then
    raise exception 'Admin access to this market is required.' using errcode = '42501';
  end if;

  insert into public.delivery_date_capacity (market_code, delivery_date, max_deliveries, updated_at)
  values (upper(p_market_code), p_delivery_date, greatest(p_max_deliveries, 0), now())
  on conflict (market_code, delivery_date)
  do update set max_deliveries = excluded.max_deliveries, updated_at = now();
end;
$$;

grant execute on function public.get_market_delivery_date_availability(text, date) to anon, authenticated;
grant execute on function public.set_market_delivery_date_capacity(text, date, integer) to authenticated;

alter table public.business_expenses
  add column if not exists market_code text not null default 'PH' references public.store_markets(code),
  add column if not exists currency_code text not null default 'PHP';

alter table public.business_budgets
  add column if not exists market_code text not null default 'PH' references public.store_markets(code),
  add column if not exists currency_code text not null default 'PHP';

alter table public.business_budgets
  drop constraint if exists business_budgets_pkey;

alter table public.business_budgets
  add primary key (market_code, month_start);

drop policy if exists "Authenticated admins manage business expenses" on public.business_expenses;
drop policy if exists "Market admins manage business expenses" on public.business_expenses;
create policy "Market admins manage business expenses"
on public.business_expenses
for all
to authenticated
using (public.admin_can_access_market(market_code))
with check (public.admin_can_access_market(market_code));

drop policy if exists "Authenticated admins manage business budgets" on public.business_budgets;
drop policy if exists "Market admins manage business budgets" on public.business_budgets;
create policy "Market admins manage business budgets"
on public.business_budgets
for all
to authenticated
using (public.admin_can_access_market(market_code))
with check (public.admin_can_access_market(market_code));

comment on column public.investor_profiles.admin_market is
  'PH or CA for market admins. ALL is reserved for the business owner.';
