-- Run after letter_v2_publish_password_fix. Synthetic fixtures always roll back.
begin;
insert into public.letter_v2_qr_codes(public_token,activation_code,status,has_photo_upload)
values ('publish-password-regression','TEST-1234','claimed',false),
       ('publish-password-plain','TEST-1234','claimed',false);
set local role anon;
do $$
declare result record; plain record; access jsonb; remembered text; invalid_password text; i integer;
  surprise jsonb := '{"title":"Our moment","message":"You are loved","photo":"data:image/jpeg;base64,YQ=="}';
  labels jsonb := '["One","Two","Three","Four","Five","Six"]';
  artwork jsonb := '[0,1,2,3,4,5]';
begin
  foreach invalid_password in array array['','a','ab','abc','    ',repeat('a',73),repeat(chr(233),37)] loop
    begin
      perform public.create_letter_v2('publish-password-regression','Sender','Recipient','romance','Hello',
        invalid_password,'TEST-1234',surprise,'[]','[]',labels,artwork);
      raise exception 'FAIL invalid password accepted';
    exception when others then
      if sqlerrm <> 'Use a password of 4 characters or more, up to 72 bytes' then raise; end if;
    end;
  end loop;
  begin
    perform public.create_letter_v2('publish-password-regression','Sender','Recipient','romance','Hello',
      'abcd','WRONG',surprise,'[]','[]',labels,artwork);
    raise exception 'FAIL wrong activation accepted';
  exception when others then
    if sqlerrm <> 'Gift activation required' then raise; end if;
  end;
  begin
    perform public.create_letter_v2('publish-password-regression','Sender','Recipient','romance','Hello',
      'abcd','TEST-1234',surprise || '{"photo":"https://example.invalid/public.jpg"}'::jsonb,'[]','[]',labels,artwork);
    raise exception 'FAIL public photo URL accepted';
  exception when others then
    if sqlerrm <> 'Use a cropped surprise photo' then raise; end if;
  end;
  -- Use the same twelve-argument publisher as the actual composer.
  select * into result from public.create_letter_v2('publish-password-regression','Sender','Recipient','romance','Hello',
    'abcd','TEST-1234',surprise,'["data:image/jpeg;base64,YQ=="]','[]',labels,artwork);
  if result.id is null or length(result.management_token) is distinct from 64 then
    raise exception 'FAIL publishing receipt'; end if;
  if exists(select 1 from public.letters where id=result.id) then raise exception 'FAIL anonymous letter read'; end if;
  access := public.read_private_letter(result.id);
  if access->>'status' is distinct from 'locked' or access ? 'letter' then raise exception 'FAIL private photo leaked'; end if;
  access := public.read_private_letter(result.id,null,'wrong');
  if access->>'status' is distinct from 'incorrect' or access ? 'letter' then raise exception 'FAIL incorrect password'; end if;
  access := public.read_private_letter(result.id,null,'abcd',true);
  if access->>'status' is distinct from 'unlocked'
    or access#>>'{letter,backgrounds,final_surprise,photo}' is distinct from 'data:image/jpeg;base64,YQ=='
    or jsonb_array_length(access#>'{letter,memories}') is distinct from 0
    or access#>'{letter,backgrounds,petal_labels}' is distinct from labels
    or access#>'{letter,backgrounds,petal_artworks}' is distinct from artwork then
    raise exception 'FAIL four-character unlock, surprise or customization'; end if;
  remembered := access->>'access_token';
  if public.change_gift_letter_password(result.id,repeat('0',64),'efgh') then
    raise exception 'FAIL wrong management token accepted'; end if;
  foreach invalid_password in array array['abc','    ',repeat('a',73),repeat(chr(233),37)] loop
    if public.change_gift_letter_password(result.id,result.management_token,invalid_password) then
      raise exception 'FAIL invalid replacement password accepted'; end if;
  end loop;
  if not public.change_gift_letter_password(result.id,result.management_token,'efgh') then
    raise exception 'FAIL four-character password change'; end if;
  access := public.read_private_letter(result.id,remembered);
  if access->>'status' is distinct from 'locked' or access ? 'letter' then raise exception 'FAIL old remembered session survived'; end if;
  access := public.read_private_letter(result.id,null,'abcd');
  if access->>'status' is distinct from 'incorrect' then raise exception 'FAIL old password survived'; end if;
  access := public.read_private_letter(result.id,null,'efgh');
  if access->>'status' is distinct from 'unlocked' then raise exception 'FAIL new password unlock'; end if;
  -- One previous failure plus nine new failures must still hit the shared limit.
  for i in 1..9 loop
    access := public.read_private_letter(result.id,null,'wrong');
    if access->>'status' is distinct from 'incorrect' then raise exception 'FAIL retry accounting'; end if;
  end loop;
  access := public.read_private_letter(result.id,null,'efgh');
  if access->>'status' is distinct from 'limited' or access ? 'letter' then raise exception 'FAIL retry limit removed'; end if;
  -- The no-surprise path and Unicode codepoint counting must work as well.
  select * into plain from public.create_letter_v2('publish-password-plain','Sender','Recipient','romance','Hello',
    repeat(chr(127800),4),'TEST-1234',null::jsonb,'[]','[]',labels,artwork);
  access := public.read_private_letter(plain.id,null,repeat(chr(127800),4));
  if access->>'status' is distinct from 'unlocked' then raise exception 'FAIL Unicode four-character password'; end if;
end;
$$;
reset role;
do $$
declare fixture record; access jsonb;
begin
  select * into fixture from public.letter_v2_qr_codes where public_token='publish-password-regression';
  if fixture.has_photo_upload is distinct from false or fixture.status <> 'published' then
    raise exception 'FAIL memory capability or publish status'; end if;
  if not exists(select 1 from letter_private.credentials where letter_id=fixture.letter_id
    and password_hash like '$2a$10$%' and password_hash <> 'efgh' and failed_attempts=10) then
    raise exception 'FAIL bcrypt cost or failed-attempt protection'; end if;
  update public.letter_v2_qr_codes set status='revoked',revoked_at=now() where id=fixture.id;
  access := public.read_private_letter(fixture.letter_id,null,'efgh');
  if access->>'status' is distinct from 'unavailable' or access ? 'letter' then raise exception 'FAIL revoked QR readable'; end if;
end;
$$;
rollback;
