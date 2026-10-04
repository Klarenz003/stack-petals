// Exercise the actual Edge handler without a live database or secrets.
import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import ts from 'typescript'

let handler, allowed = true, failLimit = false, inserted = []
const client = {
  rpc: async () => ({ data: allowed, error: failLimit ? {} : null }),
  from: () => ({ insert: async row => { inserted.push(row); return { error: null } } }),
}
const source = fs.readFileSync(new URL('../supabase/functions/report-storefront-error/index.ts', import.meta.url), 'utf8').replace(/^import .*\n/, '')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
vm.runInNewContext(compiled, {
  createClient: () => client, Response, Request, TextEncoder, TextDecoder, crypto: webcrypto,
  Deno: { env: { get: key => ({ STOREFRONT_ERROR_ORIGINS: 'https://store.example', STOREFRONT_ERROR_HASH_SECRET: 'synthetic-secret-for-testing-only' })[key] }, serve: value => { handler = value } },
})
const payload = { operation: 'checkout.submit', code: '42501', page: 'home', market: 'PH', device: 'mobile' }
const send = (body, origin = 'https://store.example', method = 'POST') => handler(new Request('https://test.example', {
  method, headers: { origin, 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.1' },
  ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
}))
assert.equal((await send(payload)).status, 204)
assert.equal(JSON.stringify(inserted[0]), JSON.stringify(payload))
assert.equal((await send(payload, 'https://untrusted.example')).status, 403)
assert.equal((await send(payload, 'https://store.example', 'OPTIONS')).status, 204)
assert.equal((await send(payload, 'https://store.example', 'GET')).status, 405)
for (const body of [{ ...payload, email: 'private@example.com' }, { ...payload, operation: 'secret' }, { ...payload, page: '/gift/private-token' }, { ...payload, code: 'private content' }, { ...payload, market: 'ALL' }, null, 'not json']) {
  assert.equal((await send(body)).status, 400)
}
assert.equal((await send('x'.repeat(2049))).status, 413)
allowed = false
assert.equal((await send(payload)).status, 429)
failLimit = true
assert.equal((await send(payload)).status, 503)
assert.equal(inserted.length, 1)
console.log('PASS: Edge ingestion accepts safe reports and rejects private fields, invalid categories, oversized input, disallowed origins, and rate-limited requests.')
