# Private Gift QR letters

New Letter V2 gifts require a password chosen by their composer. Share that
password privately, never in the QR URL or on the gift card. A QR is a locator,
not proof of identity: anyone with both the link and password can read the letter.
No sign-in, SSO, email or recipient account is required.

## Release order

1. Apply `supabase/migrations/202610050001_private_gift_letters.sql` to the shared
   database **before** deploying this storefront version. This is additive for
   existing letters, but replaces the public publishing signature: old composer
   clients must refresh and reactivate their card. Coordinate both deployments.
2. Run `supabase/tests/private_gift_letters.sql` using a SQL client against an
   isolated migrated development database. It rolls back its own test fixtures.
   Confirm anon/authenticated RLS, admin access, legacy public reads and both
   `/letter/:id` and `/letter-v2/:id` in staging before production.
3. Run `npm run type-check`, `npm test`, `npm run build`. Browser check:
   Vite on 5183, isolated Chrome with CDP on 9243, then
   `node scripts/check-letter-password.cjs`. This test mocks all backend traffic;
   it is not proof of deployed database protection.
   Optional real PostgreSQL harness: install `embedded-postgres` in an isolated
   temporary directory and run `node scripts/check-private-letter-db.cjs <directory>`.
   It runs the migration and security assertions against a minimal app schema;
   it does not replace full Supabase staging validation.

No Edge Function or new environment secret is needed. Never deploy only the UI
and describe letters as protected. Existing letters are not automatically locked;
their composers have not chosen a password. Checkout/admin-created letters are
also unchanged.

The migration can be rerun in the SQL editor without deleting existing password
hashes or browser sessions. If the editor reports an aborted transaction after a
failed run, execute `ROLLBACK;` first, then run the entire updated migration.
Unexpected existing table/function definitions can still require inspection;
do not drop the private tables to work around a schema mismatch.

## Security boundary

- A restrictive SELECT policy hides the entire protected row from recipients.
  Direct table queries cannot reveal messages, names or inline memory photos.
  Existing authorized market admins retain access; this is access control, not
  end-to-end encryption or protection from the operator of the service.
- Password hashes use pgcrypto bcrypt with cost 10, in a non-exposed schema.
  Passwords require 10 characters, at most 72 UTF-8 bytes; spaces are preserved.
  Neither the composer nor recipient password is saved by application storage.
- Access tokens contain 256 bits of randomness. Only SHA-256 token hashes are
  stored server-side. The remember option stores the opaque token in localStorage
  for a fixed 30 days; unchecked uses sessionStorage with a 12-hour server expiry.
  Each visit revalidates authorization. Changing browser/device or clearing site
  data requires the password again. Storage denial still allows the current read.
- These are JavaScript-accessible bearer tokens, not HttpOnly cookies. Protect
  against XSS, restrict third-party scripts, and use HTTPS. A stolen token grants
  temporary access. A same-origin backend with HttpOnly cookies is a future
  hardening option, not a feature provided by this implementation.
- Ten failed passwords per letter per 15-minute window are allowed; the server
  serializes attempts so parallel requests cannot bypass that counter. Existing
  authorized sessions still work during a cooldown. The limit is shared: a
  malicious QR finder could temporarily cause a cooldown for a new recipient.
  Infrastructure/IP-level abuse controls remain recommended for larger traffic.
- Composer activation is checked again when publishing. Reclaiming an activated
  card also requires the activation code. Password changes require a separate
  random management token, **not** the QR or printed activation code. A receipt
  kept in the composer tab/session allows changes; closing/clearing that session
  can remove management access. There is no public password-recovery endpoint.
- A password change deletes all remembered sessions. Revoked/replaced gifts and
  unpublished letters cannot be opened with a password or old access token.
  Already-downloaded screenshots/media cannot be revoked.

## Photo scope

Composer memory uploads are cropped JPEG data URLs stored inside the protected
letter. The new publishing RPC rejects remote memory URLs. Public catalog images
and existing admin-uploaded bouquet/360 assets remain public assets: hiding their
URLs in a locked letter does not make the storage objects private. Do not put
confidential photos in those public buckets. Private object storage with signed
asset delivery would be needed for confidential externally uploaded media.

The active Gift QR flow is Letter V2. Legacy `/gift/*` UI and previously issued
public letters are not backfilled by this migration.
