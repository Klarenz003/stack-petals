-- Run after 202610080001_default_surprise_photo.sql. Fixtures roll back.
begin;
insert into public.letter_v2_qr_codes(public_token,activation_code,status,has_photo_upload)
values ('default-surprise-photo','TEST-1234','claimed',false);
set local role anon;
do $$
declare result record; access jsonb;
begin
  begin
    perform public.create_letter_v2('default-surprise-photo','Sender','Recipient','romance','Hello','two little flowers','WRONG',
      '{"title":"Our moment","message":"You are loved","photo":"data:image/jpeg;base64,YQ=="}'::jsonb,'[]'::jsonb,'[]'::jsonb);
    raise exception 'FAIL wrong activation accepted';
  exception when others then
    if sqlerrm <> 'Gift activation required' then raise; end if;
  end;
  begin
    perform public.create_letter_v2('default-surprise-photo','Sender','Recipient','romance','Hello','two little flowers','TEST-1234',
      '{"title":"Our moment","message":"You are loved","photo":"https://public.example/photo.jpg"}'::jsonb,'[]'::jsonb,'[]'::jsonb);
    raise exception 'FAIL public surprise photo accepted';
  exception when others then
    if sqlerrm <> 'Use a cropped surprise photo' then raise; end if;
  end;
  select * into result from public.create_letter_v2('default-surprise-photo','Sender','Recipient','romance','Hello','two little flowers','TEST-1234',
    '{"title":"Our moment","message":"You are loved","photo":"data:image/jpeg;base64,YQ=="}'::jsonb,'["data:image/jpeg;base64,YQ=="]'::jsonb,'[]'::jsonb);
  if exists(select 1 from public.letters where id=result.id) then raise exception 'FAIL anonymous letter read'; end if;
  access := public.read_private_letter(result.id);
  if access->>'status' <> 'locked' or access ? 'letter' then raise exception 'FAIL surprise leaked before unlock'; end if;
  access := public.read_private_letter(result.id,null,'two little flowers',true);
  if access->>'status' <> 'unlocked'
    or access#>>'{letter,backgrounds,final_surprise,photo}' <> 'data:image/jpeg;base64,YQ=='
    or jsonb_array_length(access#>'{letter,memories}') <> 0 then
    raise exception 'FAIL special photo or separate memory capability';
  end if;
  raise notice 'PASS default special photo preserves activation/password security and memory capability';
end;
$$;
reset role;
do $$
begin
  if (select has_photo_upload from public.letter_v2_qr_codes where public_token='default-surprise-photo') is distinct from false then
    raise exception 'FAIL memory capability changed';
  end if;
end;
$$;
rollback;
