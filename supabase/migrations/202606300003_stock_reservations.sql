create table if not exists public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  session_token text not null,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (session_token, product_id)
);

create index if not exists stock_reservations_session_token_idx
  on public.stock_reservations (session_token);

create index if not exists stock_reservations_expires_at_idx
  on public.stock_reservations (expires_at);

alter table public.stock_reservations enable row level security;

create or replace function public.release_expired_stock_reservations()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products p
  set stock = coalesce(p.stock, 0) + expired.total_quantity
  from (
    select product_id, sum(quantity)::integer as total_quantity
    from public.stock_reservations
    where expires_at <= now()
    group by product_id
  ) expired
  where p.id = expired.product_id;

  delete from public.stock_reservations
  where expires_at <= now();
end;
$$;

create or replace function public.release_stock_reservation(p_session_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products p
  set stock = coalesce(p.stock, 0) + released.quantity
  from (
    select product_id, sum(quantity)::integer as quantity
    from public.stock_reservations
    where session_token = p_session_token
    group by product_id
  ) released
  where p.id = released.product_id;

  delete from public.stock_reservations
  where session_token = p_session_token;
end;
$$;

create or replace function public.commit_stock_reservation(p_session_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.stock_reservations
  where session_token = p_session_token;
end;
$$;

create or replace function public.reserve_cart_stock(
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
  if p_session_token is null or length(trim(p_session_token)) = 0 then
    return query select false, 'Missing checkout session.'::text, null::timestamptz;
    return;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return query select false, 'Your cart is empty.'::text, null::timestamptz;
    return;
  end if;

  perform public.release_expired_stock_reservations();
  perform public.release_stock_reservation(p_session_token);

  for item in
    select product_id, quantity
    from jsonb_to_recordset(p_items) as x(product_id uuid, quantity integer)
  loop
    if item.product_id is null or coalesce(item.quantity, 0) <= 0 then
      perform public.release_stock_reservation(p_session_token);
      return query select false, 'Invalid cart item.'::text, null::timestamptz;
      return;
    end if;

    update public.products
    set stock = coalesce(stock, 0) - item.quantity
    where id = item.product_id
      and coalesce(stock, 0) >= item.quantity;

    if not found then
      perform public.release_stock_reservation(p_session_token);
      return query
        select false,
          coalesce((select name from public.products where id = item.product_id), 'This item') || ' is no longer available in that quantity.'::text,
          null::timestamptz;
      return;
    end if;

    insert into public.stock_reservations (session_token, product_id, quantity, expires_at)
    values (p_session_token, item.product_id, item.quantity, reservation_expires_at);
  end loop;

  return query select true, 'Stock reserved for checkout.'::text, reservation_expires_at;
end;
$$;

grant execute on function public.release_expired_stock_reservations() to anon, authenticated;
grant execute on function public.release_stock_reservation(text) to anon, authenticated;
grant execute on function public.commit_stock_reservation(text) to anon, authenticated;
grant execute on function public.reserve_cart_stock(text, jsonb, integer) to anon, authenticated;
