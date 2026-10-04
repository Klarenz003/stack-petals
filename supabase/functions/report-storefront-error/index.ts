import { createClient } from 'npm:@supabase/supabase-js@2'

const origins = new Set((Deno.env.get('STOREFRONT_ERROR_ORIGINS') || '').split(',').map(x => x.trim()).filter(Boolean))
const operations = new Set(['runtime','navigation','products.load','checkout.availability','checkout.reserve','checkout.submit','letter.load','letter.publish','contact.send','chat.send','order.lookup'])
const pages = new Set(['home','bouquets','about','contact','gallery','track-order','receipt','letter','letter-v2','gift','town-preview','other'])
Deno.serve(async req => {
  const origin = req.headers.get('origin') || ''
  const headers = { 'Access-Control-Allow-Origin': origins.has(origin) ? origin : 'null', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' }
  const reply = (status: number) => new Response(null, { status, headers })
  if (!origins.has(origin)) return reply(403)
  if (req.method === 'OPTIONS') return reply(204)
  if (req.method !== 'POST') return reply(405)
  const secret = Deno.env.get('STOREFRONT_ERROR_HASH_SECRET')
  if (!secret) return reply(503)
  try {
    // Bound streamed input even when Content-Length is absent or misleading.
    const reader = req.body?.getReader()
    if (!reader) return reply(400)
    const chunks: Uint8Array[] = []; let size = 0
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.length
      if (size > 2048) { await reader.cancel(); return reply(413) }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size); let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
    const body = JSON.parse(new TextDecoder().decode(bytes))
    if (!body || Object.keys(body).some(key => !['operation','code','page','market','device'].includes(key)) || !operations.has(body.operation) || !pages.has(body.page) || !['PH','CA'].includes(body.market) || !['mobile','desktop'].includes(body.device)
      || typeof body.code !== 'string' || !/^([0-9A-Z]{5}|PGRST[0-9]{3}|TypeError|ReferenceError|RangeError|SyntaxError|ChunkLoadError|UNKNOWN)$/.test(body.code)) return reply(400)
    const source = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${secret}:${new Date().toISOString().slice(0,10)}:${source}`))
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2,'0')).join('')
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: allowed, error: limitError } = await client.rpc('allow_storefront_error', { p_source_hash: hash })
    if (limitError) return reply(503)
    if (!allowed) return reply(429)
    const { error } = await client.from('storefront_errors').insert({ operation: body.operation, code: body.code, page: body.page, market: body.market, device: body.device })
    return reply(error ? 503 : 204)
  } catch { return reply(400) }
})
