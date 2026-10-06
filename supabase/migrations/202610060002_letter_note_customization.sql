-- Deploy after letter_final_surprise and before the matching storefront.
-- Keep all arguments required: defaulted overloads would make legacy RPCs ambiguous.
begin;
create or replace function public.create_letter_v2(
  p_public_token text, p_from text, p_to text, p_theme text, p_message text,
  p_password text, p_activation_code text, p_surprise jsonb,
  p_memories jsonb, p_petal_messages jsonb, p_petal_labels jsonb, p_petal_artworks jsonb
) returns table (id uuid, management_token text)
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare created_id uuid; manager text; labels jsonb := '[]'; notes jsonb := '[]'; i integer;
  defaults jsonb := '["Your laugh","Your kindness","Being you","Your heart","Your smile","The way you care"]';
  default_bodies jsonb := '["Your laughter makes the little moments feel brighter.","Your kindness means more than you may ever realize.","You make a difference simply by being yourself.","The warmth of your heart makes people feel at home.","Your smile has a way of brightening someone''s day.","The care you give leaves a lasting mark on others."]';
begin
  if p_petal_labels is null or jsonb_typeof(p_petal_labels) <> 'array' then raise exception 'Invalid note titles'; end if;
  if jsonb_array_length(p_petal_labels) <> 6 or exists(
    select 1 from jsonb_array_elements(p_petal_labels) item
    where jsonb_typeof(item) <> 'string' or char_length(item #>> '{}') > 36
  ) then raise exception 'Use six note titles of up to 36 characters'; end if;
  if p_petal_artworks is null or jsonb_typeof(p_petal_artworks) <> 'array' then raise exception 'Invalid note artwork'; end if;
  if jsonb_array_length(p_petal_artworks) <> 6 or exists(
    select 1 from jsonb_array_elements(p_petal_artworks) item
    where jsonb_typeof(item) <> 'number' or (item #>> '{}') !~ '^[0-5]$'
  ) then raise exception 'Choose one of the six artwork options for each note'; end if;
  if p_petal_messages is not null and jsonb_typeof(p_petal_messages) <> 'array' then raise exception 'Invalid note messages'; end if;
  for i in 0..5 loop
    labels := labels || jsonb_build_array(coalesce(nullif(btrim(p_petal_labels->>i),''),defaults->>i));
    notes := notes || jsonb_build_array(coalesce(nullif(left(btrim(p_petal_messages->>i),60),''),default_bodies->>i));
  end loop;
  if p_surprise is null or p_surprise = 'null'::jsonb then
    select published.id,published.management_token into created_id,manager
      from public.create_letter_v2(p_public_token,p_from,p_to,p_theme,p_message,
        p_password,p_activation_code,p_memories,notes) published;
  else
    select published.id,published.management_token into created_id,manager
      from public.create_letter_v2(p_public_token,p_from,p_to,p_theme,p_message,
        p_password,p_activation_code,p_surprise,p_memories,notes) published;
  end if;
  update public.letters l set backgrounds=coalesce(l.backgrounds,'{}'::jsonb)
    || jsonb_build_object('petal_labels',labels,'petal_artworks',p_petal_artworks) where l.id=created_id;
  return query select created_id,manager;
end;
$$;
revoke all on function public.create_letter_v2(text,text,text,text,text,text,text,jsonb,jsonb,jsonb,jsonb,jsonb) from public;
grant execute on function public.create_letter_v2(text,text,text,text,text,text,text,jsonb,jsonb,jsonb,jsonb,jsonb) to anon,authenticated;
notify pgrst, 'reload schema';
commit;
