-- Deploy after private_gift_letters and before the matching storefront release.
-- The existing password-protected publisher remains unchanged for older clients.
begin;
create or replace function public.create_letter_v2(
  p_public_token text, p_from text, p_to text, p_theme text, p_message text,
  p_password text, p_activation_code text, p_surprise jsonb,
  p_memories jsonb, p_petal_messages jsonb
) returns table (id uuid, management_token text)
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare created_id uuid; manager text; final_note jsonb; photo text; allows_photo boolean;
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
  select q.has_photo_upload into allows_photo from public.letter_v2_qr_codes q
    where q.public_token=trim(p_public_token) for update;
  if photo is not null and not coalesce(allows_photo,false) then
    raise exception 'Photo uploads are not enabled for this gift';
  end if;
  final_note := jsonb_build_object(
    'title',coalesce(nullif(btrim(p_surprise->>'title'),''),'One more thing: you are loved.'),
    'message',btrim(p_surprise->>'message'),'photo',photo);
  -- Delegate activation/password validation, hashing and publication to the
  -- existing secure publisher. This overload adds no public update permission.
  select published.id,published.management_token into created_id,manager
    from public.create_letter_v2(p_public_token,p_from,p_to,p_theme,p_message,
      p_password,p_activation_code,p_memories,p_petal_messages) published;
  update public.letters l set backgrounds=coalesce(l.backgrounds,'{}'::jsonb)
    || jsonb_build_object('final_surprise',final_note) where l.id=created_id;
  return query select created_id,manager;
end;
$$;
revoke all on function public.create_letter_v2(text,text,text,text,text,text,text,jsonb,jsonb,jsonb) from public;
grant execute on function public.create_letter_v2(text,text,text,text,text,text,text,jsonb,jsonb,jsonb) to anon,authenticated;
notify pgrst, 'reload schema';
commit;
