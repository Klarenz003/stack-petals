create or replace function public.lookup_customer_order(
  p_order_reference text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_order_id uuid;
  normalized_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  result jsonb;
begin
  if normalized_phone !~ '^09[0-9]{9}$' then
    return null;
  end if;

  begin
    requested_order_id := regexp_replace(
      trim(coalesce(p_order_reference, '')),
      '^SP-',
      '',
      'i'
    )::uuid;
  exception
    when invalid_text_representation then
      return null;
  end;

  select jsonb_build_object(
    'order', jsonb_build_object(
      'id', orders.id,
      'created_at', orders.created_at,
      'customer_name', orders.customer_name,
      'email', orders.email,
      'phone', orders.phone,
      'address', orders.address,
      'delivery_date', orders.delivery_date,
      'items', coalesce(to_jsonb(orders.items), '[]'::jsonb),
      'total', orders.total,
      'payment_method', orders.payment_method,
      'status', orders.status,
      'delivery_method', case
        when lower(coalesce(orders.address, '')) like '%pick up%'
          or lower(coalesce(orders.note, '')) like '%fulfillment: pick up%'
        then 'pickup'
        else 'delivery'
      end
    ),
    'history', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', history.id,
            'status', history.status,
            'label', history.label,
            'note', history.note,
            'created_at', history.created_at
          )
          order by history.created_at asc
        )
        from public.order_status_history history
        where history.order_id = orders.id
      ),
      '[]'::jsonb
    )
  )
  into result
  from public.orders orders
  where orders.id = requested_order_id
    and regexp_replace(coalesce(orders.phone, ''), '[^0-9]', '', 'g') = normalized_phone;

  return result;
end;
$$;

revoke all on function public.lookup_customer_order(text, text) from public;
grant execute on function public.lookup_customer_order(text, text) to anon, authenticated;

create or replace function public.get_published_letter_order_items(p_order_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(to_jsonb(orders.items), '[]'::jsonb)
  from public.orders orders
  where orders.id = p_order_id
    and exists (
      select 1
      from public.letters letters
      where letters.order_id = orders.id
        and letters.published = true
    )
  limit 1;
$$;

revoke all on function public.get_published_letter_order_items(uuid) from public;
grant execute on function public.get_published_letter_order_items(uuid) to anon, authenticated;

drop policy if exists "Public can read orders for tracking" on public.orders;
drop policy if exists "Stack Petals admins can read orders" on public.orders;
create policy "Stack Petals admins can read orders"
on public.orders
for select
to authenticated
using (
  exists (
    select 1
    from public.investor_profiles profile
    where profile.id = auth.uid()
      and profile.role = 'admin'
  )
);

drop policy if exists "Public can read order status history" on public.order_status_history;
drop policy if exists "Stack Petals admins can read order status history" on public.order_status_history;
create policy "Stack Petals admins can read order status history"
on public.order_status_history
for select
to authenticated
using (
  exists (
    select 1
    from public.investor_profiles profile
    where profile.id = auth.uid()
      and profile.role = 'admin'
  )
);
