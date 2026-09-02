-- Market admins can manage assigned letters, but analytics remain Owner-only.

drop policy if exists "Market admins read assigned letter analytics" on public.letter_analytics_events;
drop policy if exists "Owner reads letter analytics" on public.letter_analytics_events;
create policy "Owner reads letter analytics"
on public.letter_analytics_events
for select
to authenticated
using (public.current_admin_market() = 'ALL');

create or replace function public.get_letter_analytics_summary(p_letter_id uuid default null)
returns table (
  letter_id uuid,
  total_opens bigint,
  unique_viewers bigint,
  engaged_views bigint,
  completed_views bigint,
  memories_views bigint,
  bouquet_360_views bigint,
  music_plays bigint,
  replayed_views bigint,
  last_viewed_at timestamptz,
  screen_views jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(public.current_admin_market(), '') <> 'ALL' then
    raise exception 'Owner access required.' using errcode = '42501';
  end if;

  return query
  select
    letter_row.id,
    (select count(*) from public.letter_analytics_events event where event.letter_id = letter_row.id and event.event_type = 'letter_opened'),
    (select count(distinct event.visitor_token) from public.letter_analytics_events event where event.letter_id = letter_row.id and event.event_type = 'letter_opened'),
    (select count(*) from public.letter_analytics_events event where event.letter_id = letter_row.id and event.event_type = 'letter_engaged'),
    (select count(*) from public.letter_analytics_events event where event.letter_id = letter_row.id and event.event_type = 'letter_completed'),
    (select count(*) from public.letter_analytics_events event where event.letter_id = letter_row.id and event.event_type = 'memories_viewed'),
    (select count(*) from public.letter_analytics_events event where event.letter_id = letter_row.id and event.event_type = 'bouquet_360_viewed'),
    (select count(*) from public.letter_analytics_events event where event.letter_id = letter_row.id and event.event_type = 'music_played'),
    (select count(*) from public.letter_analytics_events event where event.letter_id = letter_row.id and event.event_type = 'letter_replayed'),
    (select max(event.created_at) from public.letter_analytics_events event where event.letter_id = letter_row.id and event.event_type = 'letter_opened'),
    coalesce(
      (
        select jsonb_object_agg(screen_totals.screen_number, screen_totals.views order by screen_totals.screen_number)
        from (
          select event.screen_number, count(*) as views
          from public.letter_analytics_events event
          where event.letter_id = letter_row.id
            and event.event_type = 'screen_viewed'
            and event.screen_number is not null
          group by event.screen_number
        ) screen_totals
      ),
      '{}'::jsonb
    )
  from public.letters letter_row
  where p_letter_id is null or letter_row.id = p_letter_id;
end;
$$;

revoke all on function public.get_letter_analytics_summary(uuid) from public;
grant execute on function public.get_letter_analytics_summary(uuid) to authenticated;
