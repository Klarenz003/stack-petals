create table if not exists public.letter_analytics_events (
  id uuid primary key default gen_random_uuid(),
  letter_id uuid not null references public.letters(id) on delete cascade,
  visitor_token text not null check (length(visitor_token) between 20 and 80),
  visit_token text not null check (length(visit_token) between 20 and 80),
  event_type text not null check (
    event_type in (
      'letter_opened',
      'letter_engaged',
      'screen_viewed',
      'memories_viewed',
      'bouquet_360_viewed',
      'music_played',
      'letter_completed',
      'letter_replayed'
    )
  ),
  screen_number integer check (screen_number is null or screen_number between 1 and 20),
  device_type text not null default 'unknown' check (device_type in ('mobile', 'tablet', 'desktop', 'unknown')),
  created_at timestamptz not null default now()
);

create index if not exists letter_analytics_events_letter_created_idx
  on public.letter_analytics_events (letter_id, created_at desc);

create index if not exists letter_analytics_events_letter_visitor_idx
  on public.letter_analytics_events (letter_id, visitor_token);

create unique index if not exists letter_analytics_events_visit_event_idx
  on public.letter_analytics_events (
    letter_id,
    visit_token,
    event_type,
    coalesce(screen_number, 0)
  );

alter table public.letter_analytics_events enable row level security;

drop policy if exists "Stack Petals admins can read letter analytics" on public.letter_analytics_events;
create policy "Stack Petals admins can read letter analytics"
on public.letter_analytics_events
for select
to authenticated
using (
  exists (
    select 1
    from public.investor_profiles profile
    where profile.id = auth.uid()
      and profile.role = 'admin'
  )
);

create or replace function public.record_letter_analytics_event(
  p_letter_id uuid,
  p_visitor_token text,
  p_visit_token text,
  p_event_type text,
  p_screen_number integer default null,
  p_device_type text default 'unknown'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_type not in (
    'letter_opened',
    'letter_engaged',
    'screen_viewed',
    'memories_viewed',
    'bouquet_360_viewed',
    'music_played',
    'letter_completed',
    'letter_replayed'
  ) then
    raise exception 'Unsupported letter analytics event.';
  end if;

  if p_visitor_token is null
    or length(p_visitor_token) not between 20 and 80
    or p_visitor_token !~ '^[A-Za-z0-9_-]+$'
  then
    raise exception 'Invalid visitor token.';
  end if;

  if p_visit_token is null
    or length(p_visit_token) not between 20 and 80
    or p_visit_token !~ '^[A-Za-z0-9_-]+$'
  then
    raise exception 'Invalid visit token.';
  end if;

  if p_screen_number is not null and p_screen_number not between 1 and 20 then
    raise exception 'Invalid screen number.';
  end if;

  if not exists (
    select 1
    from public.letters
    where id = p_letter_id
      and published = true
  ) then
    return;
  end if;

  insert into public.letter_analytics_events (
    letter_id,
    visitor_token,
    visit_token,
    event_type,
    screen_number,
    device_type
  )
  values (
    p_letter_id,
    p_visitor_token,
    p_visit_token,
    p_event_type,
    p_screen_number,
    case
      when p_device_type in ('mobile', 'tablet', 'desktop') then p_device_type
      else 'unknown'
    end
  )
  on conflict do nothing;
end;
$$;

revoke all on function public.record_letter_analytics_event(uuid, text, text, text, integer, text) from public;
grant execute on function public.record_letter_analytics_event(uuid, text, text, text, integer, text)
  to anon, authenticated;

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
  if not exists (
    select 1
    from public.investor_profiles profile
    where profile.id = auth.uid()
      and profile.role = 'admin'
  ) then
    raise exception 'Admin access required.' using errcode = '42501';
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
