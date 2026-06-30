alter table public.products
  add column if not exists pre_order_allowed boolean not null default true,
  add column if not exists prep_days integer not null default 5 check (prep_days >= 0),
  add column if not exists delivery_restrictions text not null default '';
