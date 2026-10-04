# Storefront error tracking

The customer application sends minimal failure reports to `report-storefront-error`.
The admin owner dashboard at `/storefront-health` reads and triages them.
Both applications must use the same Supabase project.

## Deploy before expecting reports

1. Apply `supabase/migrations/202610040001_storefront_errors.sql` through your normal migration workflow. It depends on the existing `current_admin_market()` function. Do not apply a second copy from the admin repository.
2. Set Edge Function secrets (not Vite variables):
   - `STOREFRONT_ERROR_ORIGINS`: comma-separated exact storefront origins, e.g. `https://your-store.example`. Include your local development origin only when testing.
   - `STOREFRONT_ERROR_HASH_SECRET`: a new random secret of at least 32 bytes. Never commit it.
3. Deploy the function: `supabase functions deploy report-storefront-error`. The repository config disables JWT verification because customers need not be signed in. The function accepts only explicitly allowed origins, validated bounded payloads, and rate-limited ingestion; origins are not an authentication mechanism.
4. Deploy the storefront and admin builds. Sign into admin with a profile whose role is `admin` and whose `admin_market` is `ALL`; open **Storefront Health**.

The built-in Edge Function environment supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never put a service-role key in either browser application.

## What is collected

Action category, allowlisted diagnostic code, allowlisted page category, market, mobile/desktop category, and server timestamp. No raw exception messages, stack traces, form values, names, addresses, emails, letter text, payment proof, photos, full URLs, QR tokens, or persistent customer/session identifiers are sent.

Reports cover Vue/runtime failures, unhandled promise rejections, router errors, collection loading, availability checks, stock reservations, order submission (including upload failures), order lookup, contact, chat, and letter loading/publishing. Missing or unpublished letters and normal validation errors are not all treated as failures. This is not exhaustive performance monitoring or uptime monitoring.

The client suppresses identical action/code reports for 60 seconds and sends at most 20 reports per page load. Ingestion is capped at 30 requests per minute per daily salted source-IP hash using an atomic database function. Raw IP addresses are never stored. Rate-limit rows expire after a day and are removed during subsequent ingestion. A shared IP may suppress reports from multiple customers. Browser failure to report is silent and never blocks shopping.

## Access, triage, and retention

Anonymous users and customer/investor accounts cannot read reports or change status. Database policies and column-level grants restrict reading/triage to owner admins; the route is also owner-only. Browser clients cannot insert reports directly. Resolving a report changes only its status, not the underlying bug. Later failures create new open reports.

Dashboard totals cover the selected market and date window, independent of inbox text/status filtering. Inbox count and pagination reflect all current filters. Reports are individual received events, **not unique customers**. Live refresh is opt-in and runs every 30 seconds while the tab is visible. Search uses stored action/page/code identifiers, e.g. `checkout`, `letter`, `42501`.

Event reports are retained until an authorized maintenance process removes them; there is no automatic deletion of reports. Choose a retention policy before production (90 days is a reasonable starting point) and schedule maintenance outside the browser UI. This feature makes no changes to existing orders or customer letters.

## Verify in staging

- Send a synthetic allowlisted report from an allowed origin; confirm it appears for the owner.
- Read `storefront_errors` as anon, a customer, and a non-owner admin: each must be denied or return no rows.
- Confirm owner status updates succeed, other column updates and direct client inserts are denied.
- Reject disallowed origins, unknown fields/categories, oversized input, and bursts above the limit.
- Simulate a failed checkout and letter request; confirm the customer sees friendly wording and the dashboard receives only safe metadata.
- Disable networking: checkout keeps its own error handling, tracking fails silently, and no recursive reporting occurs.

No live migration or function deployment was performed while implementing this feature.
