-- Keep letters separated by storefront while preserving Owner-only management.

alter table public.letters
  add column if not exists market_code text references public.store_markets(code);

update public.letters letter
set market_code = coalesce(order_row.market_code, 'PH')
from public.orders order_row
where letter.order_id = order_row.id::text
  and letter.market_code is null;

update public.letters
set market_code = 'PH'
where market_code is null;

alter table public.letters
  alter column market_code set default 'PH',
  alter column market_code set not null;

create index if not exists letters_market_created_idx
  on public.letters (market_code, created_at desc);

create or replace function public.set_letter_market_from_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  order_market text;
begin
  if new.order_id is not null then
    select orders.market_code
    into order_market
    from public.orders orders
    where orders.id::text = new.order_id;

    if order_market is not null then
      new.market_code := order_market;
    end if;
  end if;

  new.market_code := coalesce(upper(new.market_code), 'PH');
  return new;
end;
$$;

drop trigger if exists set_letter_market_from_order_trigger on public.letters;
create trigger set_letter_market_from_order_trigger
before insert or update of order_id, market_code on public.letters
for each row
execute function public.set_letter_market_from_order();

comment on column public.letters.market_code is
  'Storefront that owns this letter. Order-linked letters inherit the order market.';

-- Replace legacy broad policies. Recipients can read published pages, customer
-- checkout can create order-linked letters, and only the Owner can manage them.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'letters'
  loop
    execute format('drop policy if exists %I on public.letters', policy_row.policyname);
  end loop;
end $$;

create policy "Recipients read published letters and owner reads all"
on public.letters
for select
to anon, authenticated
using (published = true or public.current_admin_market() = 'ALL');

create policy "Checkout creates order letters"
on public.letters
for insert
to anon
with check (order_id is not null);

create policy "Owner creates standalone letters"
on public.letters
for insert
to authenticated
with check (public.current_admin_market() = 'ALL');

create policy "Owner updates letters"
on public.letters
for update
to authenticated
using (public.current_admin_market() = 'ALL')
with check (public.current_admin_market() = 'ALL');

create policy "Owner deletes letters"
on public.letters
for delete
to authenticated
using (public.current_admin_market() = 'ALL');

drop policy if exists "Stack Petals admins can read letter analytics" on public.letter_analytics_events;
drop policy if exists "Owner reads letter analytics" on public.letter_analytics_events;
create policy "Owner reads letter analytics"
on public.letter_analytics_events
for select
to authenticated
using (public.current_admin_market() = 'ALL');
