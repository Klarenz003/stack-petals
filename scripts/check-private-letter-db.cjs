// Optional isolated PostgreSQL security test. No project dependency is needed.
// Install embedded-postgres into a temporary directory, then pass that directory:
// node scripts/check-private-letter-db.cjs <temporary-package-directory>
const { createRequire } = require('node:module')
const { pathToFileURL } = require('node:url')
const { join, resolve } = require('node:path')
const { readFileSync } = require('node:fs')
const { randomBytes } = require('node:crypto')
const assert = require('node:assert/strict')

;(async () => {
  if (!process.argv[2]) throw Error('Pass an isolated temporary package directory.')
  const root = resolve(process.argv[2]), req = createRequire(join(root, 'package.json'))
  const { default: EmbeddedPostgres } = await import(pathToFileURL(req.resolve('embedded-postgres')).href)
  const db = new EmbeddedPostgres({ databaseDir: join(root, `letter-test-${Date.now()}`), user: 'postgres', password: randomBytes(24).toString('hex'), port: 55439, persistent: true, createPostgresUser: false, postgresFlags: ['-h', '127.0.0.1'], onLog: () => {}, onError: () => {} })
  let client
  try {
    await db.initialise(); await db.start()
    client = db.getPgClient(); await client.connect()
    client.on('notice', n => { if (n.message.startsWith('PASS')) console.log(n.message) })
    // Minimal app schema, not a replacement for full Supabase staging tests.
    await client.query(`
      create role anon; create role authenticated; create schema extensions;
      create extension pgcrypto with schema extensions;
      create function public.admin_can_access_market(text) returns boolean language sql stable as
        $$ select coalesce(current_setting('request.jwt.claims',true),'{}')::jsonb->>'admin_market' = 'ALL' $$;
      revoke all on function public.admin_can_access_market(text) from public;
      grant execute on function public.admin_can_access_market(text) to authenticated;
      create table public.letter_v2_qr_codes (
        id uuid primary key default gen_random_uuid(), public_token text unique not null,
        activation_code text not null, product_name text default 'Gift letter',
        has_360_view boolean default false, has_photo_upload boolean default true,
        status text default 'unused', letter_id uuid, claimed_at timestamptz,published_at timestamptz
      );
      create table public.letters (
        id uuid primary key default gen_random_uuid(), order_id uuid, market_code text default 'PH',
        recipient text,letter_theme text,sender text,message text,song_suggestion text,
        petal_messages jsonb,backgrounds jsonb,memories jsonb,angle_photos jsonb,
        has_360_view boolean,published boolean,template text,letter_v2_qr_id uuid
      );
      alter table public.letters enable row level security;
      grant usage on schema public to anon,authenticated;
      grant select on public.letters to anon,authenticated;
      create policy published_read on public.letters for select to anon using (published);
      create policy admin_read on public.letters for select to authenticated using (public.admin_can_access_market(market_code));
      insert into public.letters(recipient,message,published,template) values ('Public recipient','Legacy public message',true,'original');
    `)
    await client.query(readFileSync('supabase/migrations/202610020001_letter_v2_chapter_two.sql', 'utf8'))
    const privacyMigration = readFileSync('supabase/migrations/202610050001_private_gift_letters.sql', 'utf8')
    await client.query(privacyMigration)
    await client.query(privacyMigration)
    await client.query(readFileSync('supabase/tests/private_gift_letters.sql', 'utf8'))
    const surpriseMigration = readFileSync('supabase/migrations/202610060001_letter_final_surprise.sql', 'utf8')
    await client.query(surpriseMigration)
    await client.query(surpriseMigration)
    await client.query(readFileSync('supabase/tests/letter_final_surprise.sql', 'utf8'))
    const notesMigration = readFileSync('supabase/migrations/202610060002_letter_note_customization.sql', 'utf8')
    await client.query(notesMigration)
    await client.query(notesMigration)
    await client.query(readFileSync('supabase/tests/letter_note_customization.sql', 'utf8'))
    await client.query(`set role anon`)
    assert.equal((await client.query(`select message from public.letters`)).rows[0].message, 'Legacy public message')
    await client.query(`reset role; insert into public.letter_v2_qr_codes(public_token,activation_code,status) values ('roles-test','CODE-1234','claimed')`)
    const result = (await client.query(`select * from public.create_letter_v2('roles-test','Sender','Recipient','romance','Role test message','two little flowers','CODE-1234','[]','[]')`)).rows[0]
    const unlocked = (await client.query(`select public.read_private_letter($1,null,'two little flowers',true) as access`, [result.id])).rows[0].access
    assert.equal(unlocked.status, 'unlocked')
    const credentials = (await client.query(`select * from letter_private.credentials where letter_id=$1`, [result.id])).rows
    await client.query(privacyMigration)
    assert.deepEqual((await client.query(`select * from letter_private.credentials where letter_id=$1`, [result.id])).rows, credentials)
    assert.equal((await client.query(`select public.read_private_letter($1,$2) as access`, [result.id, unlocked.access_token])).rows[0].access.status, 'unlocked')
    console.log('PASS repeated migration preserves password hashes, composer credentials and remembered sessions')
    await client.query(`set role authenticated`)
    assert.equal((await client.query(`select id from public.letters where id=$1`, [result.id])).rowCount, 0)
    await client.query(`select set_config('request.jwt.claims','{"admin_market":"ALL"}',false)`)
    assert.equal((await client.query(`select id from public.letters where id=$1`, [result.id])).rowCount, 1)
    await client.query(`reset role`)
    console.log('PASS legacy public access, non-admin denial and authorized admin read')
  } finally {
    if (client) await client.end()
    await db.stop()
  }
})().catch(error => { console.error(error); process.exitCode = 1 })
