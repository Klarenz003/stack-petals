alter table public.investor_invitations enable row level security;

drop policy if exists "Public can read published investor invitations" on public.investor_invitations;
create policy "Public can read published investor invitations"
on public.investor_invitations
for select
to anon, authenticated
using (published = true);

drop policy if exists "Investor admins can read all invitations" on public.investor_invitations;
create policy "Investor admins can read all invitations"
on public.investor_invitations
for select
to authenticated
using (public.is_investor_admin());
