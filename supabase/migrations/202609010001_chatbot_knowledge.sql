create table if not exists public.chatbot_knowledge (
  id uuid primary key default gen_random_uuid(),
  market_code text not null default 'ALL' check (market_code in ('PH', 'CA', 'ALL')),
  category text not null default 'General' check (length(category) between 2 and 50),
  question text not null check (length(question) between 3 and 300),
  answer text not null check (length(answer) between 3 and 2000),
  keywords text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'approved')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chatbot_knowledge_lookup_idx
  on public.chatbot_knowledge (market_code, status, active, updated_at desc);

alter table public.chatbot_knowledge enable row level security;

drop policy if exists "Owner reads chatbot knowledge" on public.chatbot_knowledge;
create policy "Owner reads chatbot knowledge"
on public.chatbot_knowledge for select to authenticated
using (public.current_admin_market() = 'ALL');

drop policy if exists "Owner creates chatbot knowledge" on public.chatbot_knowledge;
create policy "Owner creates chatbot knowledge"
on public.chatbot_knowledge for insert to authenticated
with check (public.current_admin_market() = 'ALL');

drop policy if exists "Owner updates chatbot knowledge" on public.chatbot_knowledge;
create policy "Owner updates chatbot knowledge"
on public.chatbot_knowledge for update to authenticated
using (public.current_admin_market() = 'ALL')
with check (public.current_admin_market() = 'ALL');

drop policy if exists "Owner deletes chatbot knowledge" on public.chatbot_knowledge;
create policy "Owner deletes chatbot knowledge"
on public.chatbot_knowledge for delete to authenticated
using (public.current_admin_market() = 'ALL');

create table if not exists public.chatbot_interactions (
  id uuid primary key default gen_random_uuid(),
  session_token text not null check (
    length(session_token) between 20 and 80
    and session_token ~ '^[A-Za-z0-9_-]+$'
  ),
  market_code text not null check (market_code in ('PH', 'CA')),
  question text not null check (length(question) between 2 and 500),
  answer text not null check (length(answer) between 1 and 1000),
  topic text not null default 'other' check (
    topic in ('products', 'ordering', 'fulfillment', 'payment', 'customization', 'keepsake', 'tracking', 'gallery', 'contact', 'other')
  ),
  in_scope boolean not null default true,
  needs_human boolean not null default false,
  suggested_route text not null default '',
  feedback text check (feedback is null or feedback in ('helpful', 'not_helpful')),
  review_status text not null default 'new' check (review_status in ('new', 'added', 'ignored')),
  created_at timestamptz not null default now(),
  feedback_at timestamptz
);

create index if not exists chatbot_interactions_created_idx
  on public.chatbot_interactions (created_at desc);

create index if not exists chatbot_interactions_review_idx
  on public.chatbot_interactions (needs_human, review_status, created_at desc);

alter table public.chatbot_interactions enable row level security;

drop policy if exists "Owner reads chatbot interactions" on public.chatbot_interactions;
create policy "Owner reads chatbot interactions"
on public.chatbot_interactions for select to authenticated
using (public.current_admin_market() = 'ALL');

drop policy if exists "Owner updates chatbot interactions" on public.chatbot_interactions;
create policy "Owner updates chatbot interactions"
on public.chatbot_interactions for update to authenticated
using (public.current_admin_market() = 'ALL')
with check (public.current_admin_market() = 'ALL');

drop policy if exists "Owner deletes chatbot interactions" on public.chatbot_interactions;
create policy "Owner deletes chatbot interactions"
on public.chatbot_interactions for delete to authenticated
using (public.current_admin_market() = 'ALL');

create or replace function public.rate_chatbot_interaction(
  p_interaction_id uuid,
  p_session_token text,
  p_feedback text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if p_feedback not in ('helpful', 'not_helpful') then
    return false;
  end if;

  if p_session_token is null
    or length(p_session_token) not between 20 and 80
    or p_session_token !~ '^[A-Za-z0-9_-]+$'
  then
    return false;
  end if;

  update public.chatbot_interactions
  set feedback = p_feedback,
      feedback_at = now()
  where id = p_interaction_id
    and session_token = p_session_token
    and created_at > now() - interval '30 days';

  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

revoke all on function public.rate_chatbot_interaction(uuid, text, text) from public;
grant execute on function public.rate_chatbot_interaction(uuid, text, text) to anon, authenticated;

insert into public.chatbot_knowledge (market_code, category, question, answer, keywords, status)
values
  ('ALL', 'QR Keepsake', 'How does the QR keepsake work?', 'Scan the QR tag attached to the Stack Petals gift to open its personalized keepsake experience. Depending on the order, it can include a letter, six petal messages, memories, music, and a bouquet 360 view.', array['qr', 'scan', 'keepsake', 'letter'], 'approved'),
  ('ALL', 'Order Tracking', 'How can I track my order?', 'Open Track Order and enter the order reference and the same phone number used during checkout. The tracker shows the latest preparation, pickup, or delivery status.', array['track', 'status', 'reference', 'phone'], 'approved'),
  ('ALL', 'Customization', 'Can I request a custom gift?', 'Yes. Share the preferred colors, occasion, recipient, and message idea through Contact. Stack Petals will confirm whether the requested design and schedule are available before promising the order.', array['custom', 'color', 'occasion', 'request'], 'approved'),
  ('ALL', 'Letter Experience', 'What can be included in a personalized letter?', 'The Stack Petals letter experience can include a personal letter, six petal messages, photo memories, a customer song suggestion, and a bouquet 360 view when available for that gift.', array['letter', 'petal', 'message', 'music', 'memory', '360'], 'approved'),
  ('PH', 'Pickup', 'Where is Philippines pickup?', 'Philippines pickup is around Santa Ana, Taytay, Rizal. Final pickup instructions and availability are confirmed with the order.', array['pickup', 'taytay', 'rizal', 'philippines'], 'approved'),
  ('CA', 'Fulfillment', 'What pickup or delivery options are available in Canada?', 'Available Canada pickup or delivery choices are shown during checkout and may depend on the product and customer location. Use checkout for the current options and final total.', array['canada', 'pickup', 'delivery', 'fulfillment'], 'approved'),
  ('ALL', 'Payment', 'What payment methods can I use?', 'Payment methods can differ between the Philippines and Canada stores. Select the correct store and review the currently available methods during checkout.', array['payment', 'gcash', 'interac', 'checkout'], 'approved')
on conflict do nothing;
