delete from public.order_status_history h
using (
  select
    id,
    status,
    lag(status) over (partition by order_id order by created_at, id) as previous_status
  from public.order_status_history
) duplicates
where h.id = duplicates.id
  and duplicates.previous_status = duplicates.status;

create or replace function public.record_order_status_history(
  p_order_id uuid,
  p_status text,
  p_label text,
  p_note text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  latest_status text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_order_id::text, 0));

  select status
  into latest_status
  from public.order_status_history
  where order_id = p_order_id
  order by created_at desc, id desc
  limit 1;

  if latest_status = p_status then
    return;
  end if;

  insert into public.order_status_history (order_id, status, label, note)
  values (p_order_id, p_status, p_label, coalesce(p_note, ''));
end;
$$;
