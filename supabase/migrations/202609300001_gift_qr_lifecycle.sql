-- Canonical reusable gift QR lifecycle.
-- The explicit drops are intentional: PostgreSQL cannot replace a function
-- when its OUT/returns-table row type changes.

create extension if not exists pgcrypto;

create table if not exists public.gift_qr_codes (
  id uuid primary key default gen_random_uuid(),
  public_token text not null unique,
  activation_code text not null,
  product_name text not null default 'Stack Petals gift',
  has_360_view boolean not null default false,
  has_photo_upload boolean not null default true,
  status text not null default 'unused' check (status in ('unused', 'claimed', 'published', 'revoked', 'replaced')),
  letter_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  published_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.gift_qr_codes add column if not exists has_photo_upload boolean not null default true;
alter table public.gift_qr_codes add column if not exists letter_id uuid;
alter table if exists public.letters add column if not exists gift_qr_id uuid references public.gift_qr_codes(id) on delete set null;

create index if not exists gift_qr_codes_status_idx on public.gift_qr_codes(status);
create index if not exists gift_qr_codes_product_idx on public.gift_qr_codes(product_name);

do $$
begin
  alter table public.gift_qr_codes
    add constraint gift_qr_codes_letter_id_fkey foreign key (letter_id)
    references public.letters(id) on delete set null;
exception when duplicate_object then null;
end;
$$;

alter table public.gift_qr_codes enable row level security;
drop policy if exists "Admins manage gift QR codes" on public.gift_qr_codes;
create policy "Admins manage gift QR codes"
  on public.gift_qr_codes for all to authenticated
  using (public.is_investor_admin())
  with check (public.is_investor_admin());

drop function if exists public.resolve_gift_qr(text);
create function public.resolve_gift_qr(p_public_token text)
returns table (id uuid, product_name text, has_360_view boolean, has_photo_upload boolean, status text, letter_id uuid)
language sql security definer stable set search_path = public
as $$
  select q.id, q.product_name, q.has_360_view, q.has_photo_upload, q.status, q.letter_id
  from public.gift_qr_codes q
  where q.public_token = trim(p_public_token)
    and q.status in ('unused', 'claimed', 'published');
$$;
revoke all on function public.resolve_gift_qr(text) from public;
grant execute on function public.resolve_gift_qr(text) to anon, authenticated;

drop function if exists public.claim_gift_qr(text, text);
create function public.claim_gift_qr(p_public_token text, p_activation_code text default null)
returns table (id uuid, product_name text, has_360_view boolean, has_photo_upload boolean, status text, letter_id uuid)
language plpgsql security definer set search_path = public
as $$
begin
  return query
  update public.gift_qr_codes q
     set status = case when q.status = 'unused' then 'claimed' else q.status end,
         claimed_at = coalesce(q.claimed_at, now())
   where q.public_token = trim(p_public_token)
     and q.status in ('unused', 'claimed')
     and (nullif(trim(coalesce(p_activation_code, '')), '') is null
          or q.activation_code = upper(trim(p_activation_code)))
  returning q.id, q.product_name, q.has_360_view, q.has_photo_upload, q.status, q.letter_id;
end;
$$;
revoke all on function public.claim_gift_qr(text, text) from public;
grant execute on function public.claim_gift_qr(text, text) to anon, authenticated;

drop function if exists public.publish_gift_qr(text, uuid);
create function public.publish_gift_qr(p_public_token text, p_letter_id uuid)
returns boolean
language sql security definer set search_path = public
as $$
  update public.gift_qr_codes
     set letter_id = p_letter_id, status = 'published', published_at = now()
   where public_token = trim(p_public_token) and status in ('claimed', 'published')
  returning true;
$$;
revoke all on function public.publish_gift_qr(text, uuid) from public;
grant execute on function public.publish_gift_qr(text, uuid) to anon, authenticated;

drop function if exists public.create_gift_letter(text, text, text, text, text, jsonb);
create function public.create_gift_letter(
  p_public_token text,
  p_from text,
  p_to text,
  p_theme text,
  p_message text,
  p_memories jsonb default '[]'::jsonb
)
returns table (id uuid)
language plpgsql security definer set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.letters (
    order_id, market_code, recipient, letter_theme, sender, message,
    song_suggestion, petal_messages, backgrounds, memories, angle_photos,
    has_360_view, published, template, gift_qr_id
  )
  select null, 'PH', nullif(trim(p_to), ''), coalesce(nullif(trim(p_theme), ''), 'romance'),
    nullif(trim(p_from), ''), trim(p_message), '',
    '["Your laugh","Your kindness","Being you","Your heart","Your smile","The way you care"]'::jsonb,
    jsonb_build_object('petal_artworks', '[0,1,2,3,4,5]'::jsonb),
    case when q.has_photo_upload then coalesce(p_memories, '[]'::jsonb) else '[]'::jsonb end,
    '[]'::jsonb, q.has_360_view, true, 'love', q.id
  from public.gift_qr_codes q
  where q.public_token = trim(p_public_token)
    and q.status = 'claimed'
    and q.letter_id is null
  returning public.letters.id into new_id;

  if new_id is null then
    raise exception 'Gift QR code is invalid, already published, or has not been claimed';
  end if;

  update public.gift_qr_codes
     set status = 'published', letter_id = new_id, published_at = now(), claimed_at = coalesce(claimed_at, now())
   where public_token = trim(p_public_token) and status = 'claimed' and letter_id is null;

  return query select new_id;
end;
$$;
revoke all on function public.create_gift_letter(text, text, text, text, text, jsonb) from public;
grant execute on function public.create_gift_letter(text, text, text, text, text, jsonb) to anon, authenticated;
