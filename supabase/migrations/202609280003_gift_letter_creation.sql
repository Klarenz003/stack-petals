create or replace function public.create_gift_letter(
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
declare new_id uuid;
begin
  if not exists (select 1 from public.gift_qr_codes where public_token = trim(p_public_token) and status in ('claimed','unused')) then
    raise exception 'Gift QR code is invalid or unavailable';
  end if;
  insert into public.letters (
    order_id, market_code, recipient, letter_theme, sender, message,
    song_suggestion, petal_messages, backgrounds, memories, angle_photos,
    has_360_view, published, template, gift_qr_id
  )
  select null, 'PH', nullif(trim(p_to), ''), coalesce(nullif(trim(p_theme), ''), 'romance'),
    nullif(trim(p_from), ''), trim(p_message), '',
    '["Your laugh","Your kindness","Being you","Your heart","Your smile","The way you care"]'::jsonb,
    jsonb_build_object('petal_artworks', '[0,1,2,3,4,5]'::jsonb),
    case when q.has_photo_upload then coalesce(p_memories, '[]'::jsonb) else '[]'::jsonb end, '[]'::jsonb, q.has_360_view, true, 'love', q.id
  from public.gift_qr_codes q
  where q.public_token = trim(p_public_token) and q.status in ('claimed','unused')
  returning public.letters.id into new_id;
  update public.gift_qr_codes set status='published', letter_id=new_id, published_at=now(), claimed_at=coalesce(claimed_at, now()) where public_token=trim(p_public_token);
  return query select new_id;
end;
$$;
revoke all on function public.create_gift_letter(text,text,text,text,text,jsonb) from public;
grant execute on function public.create_gift_letter(text,text,text,text,text,jsonb) to anon, authenticated;
