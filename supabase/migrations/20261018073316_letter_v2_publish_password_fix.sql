-- Forward repair for deployments that still gate the special surprise photo.
-- Timestamp matches the migration recorded by the production database.
-- Only letter passwords change to four characters; admin/Auth passwords do not.
-- Existing letters, QR capabilities, password hashes and sessions are untouched.
begin;
set local lock_timeout = '5s';

create or replace function public.create_letter_v2(
  p_public_token text, p_from text, p_to text, p_theme text, p_message text,
  p_password text, p_activation_code text,
  p_memories jsonb default '[]', p_petal_messages jsonb default '[]'
) returns table (id uuid, management_token text)
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare q public.letter_v2_qr_codes%rowtype; new_id uuid; secret text;
begin
  if p_password is null or char_length(p_password) < 4 or octet_length(p_password) > 72
    or btrim(p_password) = '' then raise exception 'Use a password of 4 characters or more, up to 72 bytes'; end if;
  if nullif(trim(p_to), '') is null or nullif(trim(p_message), '') is null
    or char_length(p_message) > 2000 or char_length(p_to) > 120 or char_length(p_from) > 120 then
    raise exception 'Invalid letter fields'; end if;
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

create or replace function public.create_letter_v2(
  p_public_token text, p_from text, p_to text, p_theme text, p_message text,
  p_password text, p_activation_code text, p_surprise jsonb,
  p_memories jsonb, p_petal_messages jsonb
) returns table (id uuid, management_token text)
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare created_id uuid; manager text; final_note jsonb; photo text;
begin
  if p_surprise is null or jsonb_typeof(p_surprise) <> 'object'
    or jsonb_typeof(p_surprise->'message') is distinct from 'string'
    or nullif(btrim(p_surprise->>'message'),'') is null
    or char_length(p_surprise->>'message') > 600
    or jsonb_typeof(p_surprise->'title') is distinct from 'string'
    or char_length(p_surprise->>'title') > 80 then
    raise exception 'Invalid final surprise';
  end if;
  if p_surprise ? 'photo' and jsonb_typeof(p_surprise->'photo') not in ('string','null') then
    raise exception 'Invalid surprise photo';
  end if;
  photo := nullif(p_surprise->>'photo','');
  if photo is not null and (octet_length(photo) > 3000000
    or photo !~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$') then
    raise exception 'Use a cropped surprise photo';
  end if;
  final_note := jsonb_build_object(
    'title',coalesce(nullif(btrim(p_surprise->>'title'),''),'One more thing: you are loved.'),
    'message',btrim(p_surprise->>'message'),'photo',photo);
  -- The secure base retains activation checks, locking and memory-photo gating.
  -- The single special surprise photo is included with every Gift QR.
  select published.id,published.management_token into created_id,manager
    from public.create_letter_v2(p_public_token,p_from,p_to,p_theme,p_message,
      p_password,p_activation_code,p_memories,p_petal_messages) published;
  update public.letters l set backgrounds=coalesce(l.backgrounds,'{}'::jsonb)
    || jsonb_build_object('final_surprise',final_note) where l.id=created_id;
  return query select created_id,manager;
end;
$$;

create or replace function public.read_private_letter(
  p_letter_id uuid, p_access_token text default null, p_password text default null,
  p_remember boolean default false
) returns jsonb language plpgsql security definer
set search_path = public, extensions, pg_temp as $$
declare c letter_private.credentials%rowtype; body jsonb; secret text; expiry timestamptz;
begin
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
  -- Preserve the shared ten-attempt / fifteen-minute limit.
  if c.failed_attempts >= 10 then return jsonb_build_object('status','limited',
    'retry_after',ceil(extract(epoch from c.attempt_window+interval '15 minutes'-now()))); end if;
  if octet_length(p_password)>72 or char_length(p_password)<4 or crypt(p_password,c.password_hash)<>c.password_hash then
    update letter_private.credentials set failed_attempts=failed_attempts+1 where letter_id=p_letter_id;
    return jsonb_build_object('status','incorrect');
  end if;
  -- Successful unlocks must not reset the failed-attempt counter.
  delete from letter_private.sessions where letter_id=p_letter_id and expires_at<=now();
  secret := encode(gen_random_bytes(32),'hex');
  expiry := now() + case when p_remember then interval '30 days' else interval '12 hours' end;
  insert into letter_private.sessions values (encode(digest(secret,'sha256'),'hex'),p_letter_id,expiry);
  select to_jsonb(l) into body from public.letters l where l.id=p_letter_id;
  return jsonb_build_object('status','unlocked','letter',body,'access_token',secret,'expires_at',expiry);
end;
$$;

create or replace function public.change_gift_letter_password(p_letter_id uuid,p_management_token text,p_password text)
returns boolean language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if p_password is null or char_length(p_password)<4 or octet_length(p_password)>72 or btrim(p_password)='' then return false; end if;
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
revoke all on function public.create_letter_v2(text,text,text,text,text,text,text,jsonb,jsonb,jsonb) from public;
revoke all on function public.read_private_letter(uuid,text,text,boolean) from public;
revoke all on function public.change_gift_letter_password(uuid,text,text) from public;
grant execute on function public.create_letter_v2(text,text,text,text,text,text,text,jsonb,jsonb) to anon,authenticated;
grant execute on function public.create_letter_v2(text,text,text,text,text,text,text,jsonb,jsonb,jsonb) to anon,authenticated;
grant execute on function public.read_private_letter(uuid,text,text,boolean) to anon,authenticated;
grant execute on function public.change_gift_letter_password(uuid,text,text) to anon,authenticated;
notify pgrst, 'reload schema';
commit;
