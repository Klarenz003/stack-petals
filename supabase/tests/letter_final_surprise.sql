begin;
insert into public.letter_v2_qr_codes(public_token,activation_code,status,has_photo_upload) values
 ('surprise-test','TEST-1234','claimed',true),
 ('surprise-no-photo','TEST-1234','claimed',false);
set local role anon;
do $$
declare result record; access jsonb;
begin
  begin
    perform public.create_letter_v2('surprise-test','Sender','Recipient','romance','Hello','two little flowers','TEST-1234',
      '{"title":"Final note","message":"You are loved","photo":"https://public.example/photo.jpg"}'::jsonb,'[]'::jsonb,'[]'::jsonb);
    raise exception 'FAIL public photo URL accepted';
  exception when others then
    if sqlerrm <> 'Use a cropped surprise photo' then raise; end if;
  end;
  begin
    perform public.create_letter_v2('surprise-no-photo','Sender','Recipient','romance','Hello','two little flowers','TEST-1234',
      '{"title":"Final note","message":"You are loved","photo":"data:image/jpeg;base64,YQ=="}'::jsonb,'[]'::jsonb,'[]'::jsonb);
    raise exception 'FAIL restricted photo accepted';
  exception when others then
    if sqlerrm <> 'Photo uploads are not enabled for this gift' then raise; end if;
  end;
  begin
    perform public.create_letter_v2('surprise-test','Sender','Recipient','romance','Hello','two little flowers','WRONG',
      '{"title":"Final note","message":"You are loved"}'::jsonb,'[]'::jsonb,'[]'::jsonb);
    raise exception 'FAIL wrong activation accepted';
  exception when others then
    if sqlerrm <> 'Gift activation required' then raise; end if;
  end;
  select * into result from public.create_letter_v2('surprise-test','Sender','Recipient','romance','Hello','two little flowers','TEST-1234',
    '{"title":"Our moment","message":"You are loved","photo":"data:image/jpeg;base64,YQ=="}'::jsonb,'[]'::jsonb,'[]'::jsonb);
  if exists(select 1 from public.letters where id=result.id) then raise exception 'FAIL anonymous letter read'; end if;
  access := public.read_private_letter(result.id);
  if access->>'status' <> 'locked' or access ? 'letter' then raise exception 'FAIL surprise leaked before unlock'; end if;
  access := public.read_private_letter(result.id,null,'two little flowers',true);
  if access->>'status' <> 'unlocked'
    or access#>>'{letter,backgrounds,final_surprise,photo}' <> 'data:image/jpeg;base64,YQ=='
    or access#>>'{letter,backgrounds,final_surprise,message}' <> 'You are loved' then
    raise exception 'FAIL private surprise content missing';
  end if;
  raise notice 'PASS surprise publisher preserves activation/password security, blocks public media and honors photo capability';
end;
$$;
rollback;
