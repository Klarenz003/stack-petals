alter table public.products
  add column if not exists sale_price numeric;

alter table public.products
  drop constraint if exists products_sale_price_non_negative;

alter table public.products
  add constraint products_sale_price_non_negative
  check (sale_price is null or sale_price >= 0);
