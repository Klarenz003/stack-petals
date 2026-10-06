begin;
insert into public.letter_v2_qr_codes(public_token,activation_code,status) values
 ('custom-notes','TEST-1234','claimed'),('custom-notes-surprise','TEST-1234','claimed');
set local role anon;
do $$
declare result record; access jsonb;
begin
  begin
    perform public.create_letter_v2('custom-notes','Sender','Recipient','romance','Hello','two little flowers','TEST-1234',
      null,'[]','[]','["One","Two","Three","Four","Five","Six"]','[9,1,2,3,4,5]');
    raise exception 'FAIL invalid artwork accepted';
  exception when others then
    if sqlerrm <> 'Choose one of the six artwork options for each note' then raise; end if;
  end;
  select * into result from public.create_letter_v2('custom-notes','Sender','Recipient','romance','Hello','two little flowers','TEST-1234',
    null,'[]','["Love your laugh","Kindness","Memory","Heart","Smile","Care"]','["My sunshine","","Our adventures","Your heart","Your smile","Your care"]','[3,4,5,2,1,0]');
  if exists(select 1 from public.letters where id=result.id) then raise exception 'FAIL public read'; end if;
  access := public.read_private_letter(result.id,null,'two little flowers',false);
  if access#>>'{letter,backgrounds,petal_labels,0}' <> 'My sunshine'
    or access#>>'{letter,backgrounds,petal_labels,1}' <> 'Your kindness'
    or access#>'{letter,backgrounds,petal_artworks}' <> '[3,4,5,2,1,0]'::jsonb
    or access#>>'{letter,petal_messages,0}' <> 'Love your laugh' then raise exception 'FAIL custom notes missing'; end if;
  select * into result from public.create_letter_v2('custom-notes-surprise','Sender','Recipient','romance','Hello','two little flowers','TEST-1234',
    '{"title":"For you","message":"A surprise"}','[]','[]','["One","Two","Three","Four","Five","Six"]','[5,4,3,2,1,0]');
  access := public.read_private_letter(result.id,null,'two little flowers',false);
  if access#>>'{letter,backgrounds,final_surprise,message}' <> 'A surprise'
    or access#>>'{letter,backgrounds,petal_labels,0}' <> 'One' then raise exception 'FAIL surprise lost'; end if;
  if access#>>'{letter,petal_messages,0}' <> 'Your laughter makes the little moments feel brighter.'
    or access#>>'{letter,petal_messages,5}' <> 'The care you give leaves a lasting mark on others.' then
    raise exception 'FAIL ready-to-use note defaults missing';
  end if;
  raise notice 'PASS editable note titles, bodies and artwork remain private and coexist with final surprise';
end;
$$;
rollback;
