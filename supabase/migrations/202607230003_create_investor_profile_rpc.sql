create or replace function public.create_investor_profile(
  p_user_id uuid,
  p_full_name text,
  p_email text,
  p_phone text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.investor_profiles (id, full_name, email, phone, role, updated_at)
  values (
    p_user_id,
    coalesce(p_full_name, ''),
    coalesce(p_email, ''),
    coalesce(p_phone, ''),
    'investor',
    now()
  )
  on conflict (id)
  do update set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    role = 'investor',
    updated_at = now();
end;
$$;

grant execute on function public.create_investor_profile(uuid, text, text, text) to authenticated;
