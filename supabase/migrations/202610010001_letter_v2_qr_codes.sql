-- Standalone QR product for LetterPageV2. This is intentionally separate
-- from gift_qr_codes and checkout-created letters.
create extension if not exists pgcrypto;

create table if not exists public.letter_v2_qr_codes (
  id uuid primary key default gen_random_uuid(),
  public_token text not null unique,
  activation_code text not null,
  product_name text not null default 'LetterPage V2',
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

alter table if exists public.letters add column if not exists letter_v2_qr_id uuid references public.letter_v2_qr_codes(id) on delete set null;
create index if not exists letter_v2_qr_codes_status_idx on public.letter_v2_qr_codes(status);

do $$ begin
  alter table public.letter_v2_qr_codes add constraint letter_v2_qr_codes_letter_id_fkey
    foreign key (letter_id) references public.letters(id) on delete set null;
exception when duplicate_object then null; end $$;

alter table public.letter_v2_qr_codes enable row level security;
drop policy if exists "Admins manage LetterPage V2 QR codes" on public.letter_v2_qr_codes;
create policy "Admins manage LetterPage V2 QR codes" on public.letter_v2_qr_codes
  for all to authenticated using (public.is_investor_admin()) with check (public.is_investor_admin());

drop function if exists public.resolve_letter_v2_qr(text);
create function public.resolve_letter_v2_qr(p_public_token text)
returns table (id uuid, product_name text, has_360_view boolean, has_photo_upload boolean, status text, letter_id uuid)
language sql security definer stable set search_path = public as $$
  select q.id, q.product_name, q.has_360_view, q.has_photo_upload, q.status, q.letter_id
  from public.letter_v2_qr_codes q
  where q.public_token = trim(p_public_token) and q.status in ('unused', 'claimed', 'published');
$$;
revoke all on function public.resolve_letter_v2_qr(text) from public;
grant execute on function public.resolve_letter_v2_qr(text) to anon, authenticated;

drop function if exists public.claim_letter_v2_qr(text, text);
create function public.claim_letter_v2_qr(p_public_token text, p_activation_code text default null)
returns table (id uuid, product_name text, has_360_view boolean, has_photo_upload boolean, status text, letter_id uuid)
language sql security definer set search_path = public as $$
  update public.letter_v2_qr_codes q
  set status = case when q.status = 'unused' then 'claimed' else q.status end,
      claimed_at = coalesce(q.claimed_at, now())
  where q.public_token = trim(p_public_token) and q.status in ('unused', 'claimed')
    and (q.status = 'claimed' or q.activation_code = upper(trim(coalesce(p_activation_code, ''))))
  returning q.id, q.product_name, q.has_360_view, q.has_photo_upload, q.status, q.letter_id;
$$;
revoke all on function public.claim_letter_v2_qr(text, text) from public;
grant execute on function public.claim_letter_v2_qr(text, text) to anon, authenticated;

drop function if exists public.create_letter_v2(text, text, text, text, text, jsonb);
create function public.create_letter_v2(p_public_token text, p_from text, p_to text, p_theme text, p_message text, p_memories jsonb default '[]'::jsonb)
returns table (id uuid)
language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  insert into public.letters (order_id, market_code, recipient, letter_theme, sender, message, song_suggestion,
    petal_messages, backgrounds, memories, angle_photos, has_360_view, published, template, letter_v2_qr_id)
  select null, 'PH', nullif(trim(p_to), ''), coalesce(nullif(trim(p_theme), ''), 'romance'), nullif(trim(p_from), ''), trim(p_message), '',
    '["Your laugh","Your kindness","Being you","Your heart","Your smile","The way you care"]'::jsonb,
    jsonb_build_object('petal_artworks', '[0,1,2,3,4,5]'::jsonb),
    case when q.has_photo_upload then coalesce(p_memories, '[]'::jsonb) else '[]'::jsonb end,
    '[]'::jsonb, q.has_360_view, true, 'love', q.id
  from public.letter_v2_qr_codes q
  where q.public_token = trim(p_public_token) and q.status = 'claimed' and q.letter_id is null
  returning public.letters.id into new_id;
  if new_id is null then raise exception 'LetterPage V2 QR code is invalid, already published, or has not been claimed'; end if;
  update public.letter_v2_qr_codes set status = 'published', letter_id = new_id, published_at = now(), claimed_at = coalesce(claimed_at, now())
    where public_token = trim(p_public_token) and status = 'claimed' and letter_id is null;
  return query select new_id;
end; $$;
revoke all on function public.create_letter_v2(text, text, text, text, text, jsonb) from public;
grant execute on function public.create_letter_v2(text, text, text, text, text, jsonb) to anon, authenticated;
