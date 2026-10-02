-- Include editable chapter 2 reminders in customer-created Gift QR letters.
-- The optional final argument keeps older six-argument clients compatible.
drop function if exists public.create_letter_v2(text, text, text, text, text, jsonb);

create or replace function public.create_letter_v2(
  p_public_token text,
  p_from text,
  p_to text,
  p_theme text,
  p_message text,
  p_memories jsonb default '[]'::jsonb,
  p_petal_messages jsonb default '[]'::jsonb
)
returns table (id uuid)
language plpgsql security definer set search_path = public
as $$
declare
  qr public.letter_v2_qr_codes%rowtype;
  new_id uuid;
  defaults jsonb := '["Your laugh","Your kindness","Being you","Your heart","Your smile","The way you care"]'::jsonb;
  notes jsonb := '[]'::jsonb;
  note_index integer;
begin
  if p_petal_messages is not null and jsonb_typeof(p_petal_messages) <> 'array' then
    raise exception 'Chapter 2 reminders must be an array';
  end if;

  -- Hold the QR row until creation and publication finish so parallel submits
  -- cannot create multiple letters for the same activated code.
  select q.* into qr
  from public.letter_v2_qr_codes q
  where q.public_token = trim(p_public_token)
    and q.status = 'claimed' and q.letter_id is null
  for update;
  if not found then
    raise exception 'Gift QR code is invalid, already published, or has not been claimed';
  end if;

  for note_index in 0..5 loop
    notes := notes || jsonb_build_array(coalesce(
      nullif(left(trim(p_petal_messages ->> note_index), 60), ''),
      defaults ->> note_index
    ));
  end loop;

  insert into public.letters (
    order_id, market_code, recipient, letter_theme, sender, message,
    song_suggestion, petal_messages, backgrounds, memories, angle_photos,
    has_360_view, published, template, letter_v2_qr_id
  ) values (
    null, 'PH', nullif(trim(p_to), ''), coalesce(nullif(trim(p_theme), ''), 'romance'),
    nullif(trim(p_from), ''), trim(p_message), '', notes,
    jsonb_build_object('petal_artworks', '[0,1,2,3,4,5]'::jsonb),
    case when qr.has_photo_upload then coalesce(p_memories, '[]'::jsonb) else '[]'::jsonb end,
    '[]'::jsonb, qr.has_360_view, true, 'love', qr.id
  ) returning public.letters.id into new_id;

  update public.letter_v2_qr_codes
  set status = 'published', letter_id = new_id, published_at = now(),
      claimed_at = coalesce(claimed_at, now())
  where letter_v2_qr_codes.id = qr.id;

  return query select new_id;
end;
$$;
revoke all on function public.create_letter_v2(text, text, text, text, text, jsonb, jsonb) from public;
grant execute on function public.create_letter_v2(text, text, text, text, text, jsonb, jsonb) to anon, authenticated;
notify pgrst, 'reload schema';
