-- Deploy before the matching storefront release. Existing letters stay unchanged.
-- Safe to reapply: existing password hashes and browser sessions are preserved.
begin;
create extension if not exists pgcrypto;
create schema if not exists letter_private;
revoke all on schema letter_private from public, anon, authenticated;

alter table public.letters add column if not exists requires_password boolean not null default false;
alter table public.letters enable row level security;
create table if not exists letter_private.credentials (
  letter_id uuid primary key references public.letters(id) on delete cascade,
  password_hash text not null,
  manager_hash text not null,
  failed_attempts integer not null default 0,
  attempt_window timestamptz not null default now()
);
create table if not exists letter_private.sessions (
  token_hash text primary key,
  letter_id uuid not null references letter_private.credentials(letter_id) on delete cascade,
  expires_at timestamptz not null
);
create index if not exists sessions_letter_id_idx on letter_private.sessions(letter_id);
alter table letter_private.credentials enable row level security;
alter table letter_private.sessions enable row level security;
revoke all on all tables in schema letter_private from public, anon, authenticated;

-- Restrictive policies also constrain any older permissive public-read policy.
drop policy if exists "Password boundary for gift letters" on public.letters;
drop policy if exists "Public password boundary for gift letters" on public.letters;
drop policy if exists "Authenticated password boundary for gift letters" on public.letters;
create policy "Public password boundary for gift letters" on public.letters
  as restrictive for select to anon using (not requires_password);
create policy "Authenticated password boundary for gift letters" on public.letters
  as restrictive for select to authenticated
  using (not requires_password or public.admin_can_access_market(market_code));

create or replace function letter_private.keep_password_boundary() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.requires_password then new.requires_password := true; end if;
  return new;
end;
$$;
drop trigger if exists keep_gift_letter_password on public.letters;
create trigger keep_gift_letter_password before update on public.letters
  for each row execute function letter_private.keep_password_boundary();

-- The old publishing RPC must not remain an anonymous password bypass.
do $$
begin
  if to_regprocedure('public.create_letter_v2_internal(text,text,text,text,text,jsonb,jsonb)') is null then
    if to_regprocedure('public.create_letter_v2(text,text,text,text,text,jsonb,jsonb)') is null then
      raise exception 'Apply the chapter-two publishing migration before this migration';
    end if;
    alter function public.create_letter_v2(text,text,text,text,text,jsonb,jsonb)
      rename to create_letter_v2_internal;
  elsif to_regprocedure('public.create_letter_v2(text,text,text,text,text,jsonb,jsonb)') is not null then
    -- If an older deployment restored this overload, close that bypass too.
    revoke all on function public.create_letter_v2(text,text,text,text,text,jsonb,jsonb)
      from public, anon, authenticated;
  end if;
end;
$$;
revoke all on function public.create_letter_v2_internal(text,text,text,text,text,jsonb,jsonb)
  from public, anon, authenticated;

create or replace function public.create_letter_v2(
  p_public_token text, p_from text, p_to text, p_theme text, p_message text,
  p_password text, p_activation_code text,
  p_memories jsonb default '[]', p_petal_messages jsonb default '[]'
) returns table (id uuid, management_token text)
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare q public.letter_v2_qr_codes%rowtype; new_id uuid; secret text;
begin
  if p_password is null or char_length(p_password) < 10 or octet_length(p_password) > 72
    or btrim(p_password) = '' then raise exception 'Use a password of 10 characters or more, up to 72 bytes'; end if;
  if nullif(trim(p_to), '') is null or nullif(trim(p_message), '') is null
    or char_length(p_message) > 2000 or char_length(p_to) > 120 or char_length(p_from) > 120 then
    raise exception 'Invalid letter fields'; end if;
  -- Only private inline cropped photos are accepted, never public upload URLs.
  if p_memories is null or jsonb_typeof(p_memories) <> 'array' then raise exception 'Invalid memories'; end if;
  if jsonb_array_length(p_memories) > 3 or octet_length(p_memories::text) > 15000000
    or exists (select 1 from jsonb_array_elements(p_memories) m
      where jsonb_typeof(m) <> 'string' or (m #>> '{}') !~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$') then
    raise exception 'Use cropped photo uploads'; end if;
  select * into q from public.letter_v2_qr_codes
    where public_token = trim(p_public_token) and status = 'claimed' and letter_id is null for update;
  if not found or q.activation_code <> upper(trim(coalesce(p_activation_code,''))) then
    raise exception 'Gift activation required'; end if;
  select created.id into new_id from public.create_letter_v2_internal(
    p_public_token,p_from,p_to,p_theme,p_message,p_memories,p_petal_messages) created;
  secret := encode(gen_random_bytes(32), 'hex');
  insert into letter_private.credentials(letter_id,password_hash,manager_hash)
    values (new_id,crypt(p_password,gen_salt('bf',10)),encode(digest(secret,'sha256'),'hex'));
  update public.letters set requires_password = true where letters.id = new_id;
  return query select new_id,secret;
end;
$$;

-- Reopening an activated card still requires its activation credential.
create or replace function public.claim_letter_v2_qr(p_public_token text, p_activation_code text default null)
returns table (id uuid, product_name text, has_360_view boolean, has_photo_upload boolean, status text, letter_id uuid)
language sql security definer set search_path = public as $$
  update public.letter_v2_qr_codes q set status = 'claimed', claimed_at = coalesce(q.claimed_at,now())
  where q.public_token = trim(p_public_token) and q.status in ('unused','claimed')
    and q.activation_code = upper(trim(coalesce(p_activation_code,'')))
  returning q.id,q.product_name,q.has_360_view,q.has_photo_upload,q.status,q.letter_id;
$$;

create or replace function public.read_private_letter(
  p_letter_id uuid, p_access_token text default null, p_password text default null,
  p_remember boolean default false
) returns jsonb language plpgsql security definer
set search_path = public, extensions, pg_temp as $$
declare c letter_private.credentials%rowtype; body jsonb; secret text; expiry timestamptz;
begin
  -- No recipient names, messages or media are returned until authorization.
  if not exists (select 1 from public.letters l join public.letter_v2_qr_codes q on q.id=l.letter_v2_qr_id
    where l.id=p_letter_id and l.published and l.requires_password and q.status='published') then
    return jsonb_build_object('status','unavailable'); end if;
  select * into c from letter_private.credentials where letter_id=p_letter_id for update;
  if not found then return jsonb_build_object('status','unavailable'); end if;
  if p_access_token is not null and length(p_access_token)=64 and exists (
    select 1 from letter_private.sessions where letter_id=p_letter_id
      and token_hash=encode(digest(p_access_token,'sha256'),'hex') and expires_at>now()) then
    select to_jsonb(l) into body from public.letters l where l.id=p_letter_id;
    return jsonb_build_object('status','unlocked','letter',body);
  end if;
  if p_password is null then return jsonb_build_object('status','locked'); end if;
  if c.attempt_window <= now()-interval '15 minutes' then
    c.failed_attempts := 0; c.attempt_window := now();
    update letter_private.credentials set failed_attempts=0,attempt_window=now() where letter_id=p_letter_id;
  end if;
  -- Shared per-letter limit cannot be bypassed by changing browsers or IPs.
  -- Return, don't raise: failed-attempt updates must survive the transaction.
  if c.failed_attempts >= 10 then return jsonb_build_object('status','limited',
    'retry_after',ceil(extract(epoch from c.attempt_window+interval '15 minutes'-now()))); end if;
  if octet_length(p_password)>72 or char_length(p_password)<10 or crypt(p_password,c.password_hash)<>c.password_hash then
    update letter_private.credentials set failed_attempts=failed_attempts+1 where letter_id=p_letter_id;
    return jsonb_build_object('status','incorrect');
  end if;
  -- Do not reset failed attempts on success (avoids authenticated throttle bypass).
  delete from letter_private.sessions where letter_id=p_letter_id and expires_at<=now();
  secret := encode(gen_random_bytes(32),'hex');
  expiry := now() + case when p_remember then interval '30 days' else interval '12 hours' end;
  insert into letter_private.sessions values (encode(digest(secret,'sha256'),'hex'),p_letter_id,expiry);
  select to_jsonb(l) into body from public.letters l where l.id=p_letter_id;
  return jsonb_build_object('status','unlocked','letter',body,'access_token',secret,'expires_at',expiry);
end;
$$;

-- A separate random composer credential is needed to change the password.
-- The QR token or printed activation code alone can NEVER reset protection.
create or replace function public.change_gift_letter_password(p_letter_id uuid,p_management_token text,p_password text)
returns boolean language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if p_password is null or char_length(p_password)<10 or octet_length(p_password)>72 or btrim(p_password)='' then return false; end if;
  if length(coalesce(p_management_token,''))<>64 then return false; end if;
  perform 1 from letter_private.credentials where letter_id=p_letter_id
    and manager_hash=encode(digest(p_management_token,'sha256'),'hex') for update;
  if not found then return false; end if;
  update letter_private.credentials set password_hash=crypt(p_password,gen_salt('bf',10)),
    failed_attempts=0,attempt_window=now() where letter_id=p_letter_id;
  delete from letter_private.sessions where letter_id=p_letter_id;
  return true;
end;
$$;
revoke all on function public.create_letter_v2(text,text,text,text,text,text,text,jsonb,jsonb) from public;
revoke all on function public.read_private_letter(uuid,text,text,boolean) from public;
revoke all on function public.change_gift_letter_password(uuid,text,text) from public;
grant execute on function public.create_letter_v2(text,text,text,text,text,text,text,jsonb,jsonb) to anon,authenticated;
grant execute on function public.read_private_letter(uuid,text,text,boolean) to anon,authenticated;
grant execute on function public.change_gift_letter_password(uuid,text,text) to anon,authenticated;
notify pgrst, 'reload schema';
commit;
