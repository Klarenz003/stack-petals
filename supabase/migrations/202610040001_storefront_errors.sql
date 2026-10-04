-- Anonymous clients cannot read or write reports directly. Ingestion is service-only.
begin;
create table public.storefront_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  operation text not null check (operation in ('runtime','navigation','products.load','checkout.availability','checkout.reserve','checkout.submit','letter.load','letter.publish','contact.send','chat.send','order.lookup')),
  code text not null check (code ~ '^([0-9A-Z]{5}|PGRST[0-9]{3}|TypeError|ReferenceError|RangeError|SyntaxError|ChunkLoadError|UNKNOWN)$'),
  page text not null check (page in ('home','bouquets','about','contact','gallery','track-order','receipt','letter','letter-v2','gift','town-preview','other')),
  market text not null check (market in ('PH','CA')),
  device text not null check (device in ('mobile','desktop')),
  status text not null default 'open' check (status in ('open','resolved'))
);
create index storefront_errors_created on public.storefront_errors(created_at desc);
alter table public.storefront_errors enable row level security;
revoke all on public.storefront_errors from public, anon, authenticated;
grant all on public.storefront_errors to service_role;
grant select on public.storefront_errors to authenticated;
grant update(status) on public.storefront_errors to authenticated;
create policy owner_read_errors on public.storefront_errors for select to authenticated
  using (public.current_admin_market() = 'ALL');
create policy owner_triage_errors on public.storefront_errors for update to authenticated
  using (public.current_admin_market() = 'ALL') with check (public.current_admin_market() = 'ALL');

-- Short-lived, salted source hashes support durable cross-instance rate limiting.
create table public.storefront_error_limits (source_hash text primary key, window_start timestamptz not null, hits integer not null);
alter table public.storefront_error_limits enable row level security;
revoke all on public.storefront_error_limits from public, anon, authenticated;
grant all on public.storefront_error_limits to service_role;
create function public.allow_storefront_error(p_source_hash text) returns boolean
language plpgsql security definer set search_path = public as $$
declare hit_count integer;
begin
  if length(p_source_hash) <> 64 then return false; end if;
  delete from public.storefront_error_limits where window_start < now() - interval '1 day';
  insert into public.storefront_error_limits values(p_source_hash, now(), 1)
  on conflict(source_hash) do update set
    hits = case when storefront_error_limits.window_start < now() - interval '1 minute' then 1 else storefront_error_limits.hits + 1 end,
    window_start = case when storefront_error_limits.window_start < now() - interval '1 minute' then now() else storefront_error_limits.window_start end
  returning hits into hit_count;
  return hit_count <= 30;
end;
$$;
revoke all on function public.allow_storefront_error(text) from public, anon, authenticated;
grant execute on function public.allow_storefront_error(text) to service_role;
commit;
