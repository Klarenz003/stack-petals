-- A letter is available for every purchase, while the interactive 360 viewer
-- is enabled only when the purchased bouquet includes that capability.
alter table public.products
  add column if not exists has_360_view boolean not null default false;

comment on column public.products.has_360_view is
  'Whether this bouquet includes the interactive 360-degree viewer.';

alter table public.letters
  add column if not exists has_360_view boolean not null default false;

comment on column public.letters.has_360_view is
  'Whether the purchased bouquet includes the interactive 360-degree viewer.';
