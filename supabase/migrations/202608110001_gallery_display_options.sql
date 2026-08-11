alter table public.gallery_images
  add column if not exists category text not null default 'Crafted Flowers',
  add column if not exists focal_position text not null default 'center';

alter table public.gallery_images
  drop constraint if exists gallery_images_focal_position_check;

alter table public.gallery_images
  add constraint gallery_images_focal_position_check
  check (focal_position in ('top', 'center', 'bottom'));

create index if not exists gallery_images_category_idx
  on public.gallery_images (category);
