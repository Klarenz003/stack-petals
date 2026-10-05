-- Run ONLY against an isolated local/test database after all migrations.
-- Self-contained fixtures; rollback leaves no letters or credentials behind.
begin;
insert into public.letter_v2_qr_codes(public_token,activation_code,status)
  values ('private-letter-regression-fixture','TEST-1234','claimed');
set local role anon;
do $$
declare result record; response jsonb; token text; i integer;
begin
  -- No anonymous access to the original unprotected publisher.
  begin
    perform public.create_letter_v2_internal('private-letter-regression-fixture','Sender','Recipient','romance','Private test message','[]','[]');
    raise exception 'FAIL: original publisher remained callable';
  exception when insufficient_privilege then null; end;
  -- The public QR token alone is not a composer credential.
  begin
    perform public.create_letter_v2('private-letter-regression-fixture','Sender','Recipient','romance','Private test message','two little flowers','WRONG','[]','[]');
    raise exception 'FAIL: publish succeeded without activation';
  exception when raise_exception then
    if sqlerrm <> 'Gift activation required' then raise; end if;
  end;
  select * into result from public.create_letter_v2('private-letter-regression-fixture','Sender','Recipient','romance','Private test message','two little flowers','TEST-1234','["data:image/jpeg;base64,AAAA"]','[]');
  perform set_config('test.private_letter_id',result.id::text,true);
  perform set_config('test.private_letter_manager',result.management_token,true);
  if exists(select 1 from public.letters where id=result.id) then raise exception 'FAIL: anon raw SELECT leaked private letter/photos'; end if;
  begin
    perform 1 from letter_private.credentials;
    raise exception 'FAIL: private hash table is readable';
  exception when insufficient_privilege then null; end;
  response := public.read_private_letter(result.id);
  if response <> '{"status":"locked"}'::jsonb then raise exception 'FAIL: locked metadata leaked content: %',response; end if;
  response := public.read_private_letter(result.id,null,'two little flowers',true);
  if response->>'status'<>'unlocked' or response->'letter'->>'message'<>'Private test message' then raise exception 'FAIL: correct password did not unlock'; end if;
  token := response->>'access_token';
  if length(token)<>64 or (response->>'expires_at')::timestamptz < now()+interval '29 days' then raise exception 'FAIL: remember token/lifetime'; end if;
  perform set_config('test.private_letter_access',token,true);
  if public.read_private_letter(result.id,token)->>'status'<>'unlocked' then raise exception 'FAIL: remembered token'; end if;
  for i in 1..10 loop
    if public.read_private_letter(result.id,null,'wrong password')->>'status'<>'incorrect' then raise exception 'FAIL: wrong-password behavior'; end if;
  end loop;
  if public.read_private_letter(result.id,null,'two little flowers')->>'status'<>'limited' then raise exception 'FAIL: brute-force limit'; end if;
  if public.read_private_letter(result.id,token)->>'status'<>'unlocked' then raise exception 'FAIL: throttle blocked already-authorized reader'; end if;
  if public.change_gift_letter_password(result.id,repeat('c',64),'another private phrase') then raise exception 'FAIL: QR finder changed password'; end if;
  if not public.change_gift_letter_password(result.id,result.management_token,'another private phrase') then raise exception 'FAIL: composer password change'; end if;
  if public.read_private_letter(result.id,token)->>'status'<>'locked' then raise exception 'FAIL: password change did not revoke devices'; end if;
  if public.read_private_letter(result.id,null,'two little flowers')->>'status'<>'incorrect' then raise exception 'FAIL: old password still accepted'; end if;
  response := public.read_private_letter(result.id,null,'another private phrase',false);
  if response->>'status'<>'unlocked' or (response->>'expires_at')::timestamptz>now()+interval '13 hours' then raise exception 'FAIL: new password or session lifetime'; end if;
  perform set_config('test.private_letter_access',response->>'access_token',true);
end;
$$;
reset role;
do $$
declare v_id uuid := current_setting('test.private_letter_id')::uuid;
begin
  if exists(select 1 from letter_private.credentials c where c.letter_id=v_id and (c.password_hash='another private phrase' or c.manager_hash=current_setting('test.private_letter_manager'))) then raise exception 'FAIL: plaintext credential storage'; end if;
  update public.letters set requires_password=false where id=v_id;
  if not (select requires_password from public.letters where id=v_id) then raise exception 'FAIL: password boundary could be removed'; end if;
  update letter_private.sessions set expires_at=now()-interval '1 second' where sessions.letter_id=v_id;
end;
$$;
set local role anon;
do $$
begin
  if public.read_private_letter(current_setting('test.private_letter_id')::uuid,current_setting('test.private_letter_access'))->>'status'<>'locked' then raise exception 'FAIL: expired token accepted'; end if;
end;
$$;
reset role;
update public.letter_v2_qr_codes set status='revoked' where public_token='private-letter-regression-fixture';
set local role anon;
do $$
begin
  if public.read_private_letter(current_setting('test.private_letter_id')::uuid,null,'another private phrase')->>'status'<>'unavailable' then raise exception 'FAIL: revoked gift readable'; end if;
  raise notice 'PASS private gift-letter server security checks';
end;
$$;
reset role;
rollback;
