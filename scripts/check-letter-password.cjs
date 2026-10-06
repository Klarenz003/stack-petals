// Vite on 5183; isolated Chrome CDP on 9243. All backend requests are mocked.
// This checks browser UX, not live database enforcement.
const assert = require('node:assert/strict')
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
;(async () => {
  const tabs = await (await fetch('http://127.0.0.1:9243/json')).json()
  const ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }))
  let id = 0, revoked = false, reads = 0, published = false
  const pending = new Map(), errors = [], requests = []
  const letterId = 'a1111111-1111-4111-8111-111111111111'
  const letter = { id: letterId, order_id: null, recipient: 'Private recipient', sender: 'Private sender', message: 'PRIVATE MESSAGE MARKER', published: true, template: 'love', letter_theme: 'romance', petal_messages: [], backgrounds: {}, memories: [], angle_photos: [], requires_password: true }
  const send = (method, params = {}) => new Promise(resolve => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })) })
  ws.addEventListener('message', event => {
    const m = JSON.parse(event.data)
    if (m.id) { pending.get(m.id)?.(m); pending.delete(m.id) }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params)
    if (m.method !== 'Fetch.requestPaused') return
    const request = m.params.request, url = new URL(request.url)
    let body = []
    if (request.method !== 'OPTIONS') {
      const data = request.postData ? JSON.parse(request.postData) : null
      requests.push({ path: url.pathname, data })
      if (url.pathname.endsWith('/read_private_letter')) {
        reads++
        if (data.p_access_token === 'a'.repeat(64) && !revoked) body = { status: 'unlocked', letter }
        else if (data.p_password === 'two little flowers') body = { status: 'unlocked', letter, access_token: 'a'.repeat(64), expires_at: new Date(Date.now() + (data.p_remember ? 30 * 86400000 : 12 * 3600000)).toISOString() }
        else if (data.p_password === 'limited password') body = { status: 'limited', retry_after: 600 }
        else body = { status: data.p_password ? 'incorrect' : 'locked' }
      }
      if (url.pathname.endsWith('/claim_letter_v2_qr')) body = [{ id: 'qr-one', has_photo_upload: true, has_360_view: false }]
      if (url.pathname.endsWith('/resolve_letter_v2_qr')) body = [{ id: 'qr-one', product_name: 'Gift letter', status: 'unused', has_photo_upload: true, has_360_view: false }]
      if (url.pathname.endsWith('/create_letter_v2')) { published = true; body = [{ id: letterId, management_token: 'b'.repeat(64) }] }
      if (url.pathname.endsWith('/change_gift_letter_password')) { body = true; revoked = true }
    }
    send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Access-Control-Allow-Headers', value: '*' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' }], body: Buffer.from(JSON.stringify(body)).toString('base64') })
  })
  const run = async expression => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true })
    if (r.result.exceptionDetails) throw Error(JSON.stringify(r.result.exceptionDetails))
    return r.result.result.value
  }
  const waitFor = async expression => { for (let n = 0; n < 150; n++) { if (await run(expression)) return; await delay(100) } throw Error(`Timed out: ${expression}`) }
  const navigate = async path => { await send('Page.navigate', { url: `http://127.0.0.1:5183${path}` }); await delay(300) }
  const fill = (selector, value) => run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}))})()`)
  try {
    await send('Runtime.enable'); await send('Page.enable')
    await send('Fetch.enable', { patterns: [{ urlPattern: '*rest/v1/*' }, { urlPattern: '*functions/v1/*' }] })
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `sessionStorage.setItem('stack-petals:startup-ready:v1','ready')` })
    for (const [width, height] of [[390, 844], [320, 740], [844, 390], [1440, 1000]]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 900 })
      await navigate(`/letter-v2/${letterId}`); await waitFor(`!!document.querySelector('#recipient-password')`)
      assert.equal(await run(`document.body.textContent.includes('PRIVATE MESSAGE MARKER')`), false)
      assert.equal(await run(`document.body.textContent.includes('Private recipient')`), false)
      assert.equal(await run(`document.documentElement.scrollWidth > innerWidth+1`), false)
      assert.equal(await run(`!!document.querySelector('.gift-studio-progress')`), false)
      console.log(`PASS private unlock layout ${width}x${height}`)
    }
    await fill('#recipient-password', 'wrong password'); await run(`document.querySelector('.letter-unlock form').requestSubmit()`)
    await waitFor(`document.querySelector('[role=alert]')?.textContent.includes('didn’t match')`)
    assert.equal(await run(`document.body.textContent.includes('PRIVATE MESSAGE MARKER')`), false)
    await fill('#recipient-password', 'limited password'); await run(`document.querySelector('.letter-unlock form').requestSubmit()`)
    await waitFor(`document.querySelector('[role=alert]')?.textContent.includes('10 minutes')`)
    await fill('#recipient-password', 'two little flowers'); await run(`document.querySelector('.letter-remember input').click();document.querySelector('.letter-unlock form').requestSubmit()`)
    await waitFor(`!document.querySelector('#recipient-password') && !!document.querySelector('#stack-petals-cinematic-styles')`)
    const stored = await run(`localStorage.getItem('stack-petals:letter-access:${letterId}')`)
    assert.deepEqual(Object.keys(JSON.parse(stored)), ['token', 'expiresAt'])
    assert.equal(stored.includes('two little flowers'), false)
    assert.ok(Date.parse(JSON.parse(stored).expiresAt) - Date.now() > 29 * 86400000)
    const before = reads
    await navigate(`/letter-v2/${letterId}`); await waitFor(`!!document.querySelector('#stack-petals-cinematic-styles')`)
    assert.ok(reads > before)
    assert.equal(await run(`!!document.querySelector('#recipient-password')`), false)
    revoked = true
    await navigate(`/letter/${letterId}`); await waitFor(`!!document.querySelector('#recipient-password')`)
    assert.equal(await run(`localStorage.getItem('stack-petals:letter-access:${letterId}')`), null)
    console.log('PASS password errors, throttling, remembered reload and revoked token on alternate route')
    await navigate('/letter-v2/claim/test-gift'); await waitFor(`!!document.querySelector('#gift-activation-code')`)
    await fill('#gift-activation-code', 'CODE-1234'); await run(`document.querySelector('.gift-studio form').requestSubmit()`)
    await waitFor(`!!document.querySelector('#gift-letter-to')`)
    await fill('#gift-letter-to', 'Recipient'); await fill('#gift-letter-message', 'A letter with love.')
    await run(`document.querySelector('.gift-studio form').requestSubmit()`)
    await waitFor(`!!document.querySelector('.little-note')`)
    await run(`document.querySelector('.gift-studio form').requestSubmit()`)
    await waitFor(`!!document.querySelector('#gift-password')`)
    await fill('#gift-password', 'two little flowers'); await fill('#gift-password-confirm', 'not the same password')
    await run(`document.querySelector('.gift-studio form').requestSubmit()`)
    await waitFor(`document.querySelector('[role=alert]')?.textContent.includes('do not match')`)
    assert.equal(published, false)
    await fill('#gift-password-confirm', 'two little flowers'); await run(`document.querySelector('.gift-studio form').requestSubmit()`)
    await waitFor(`document.body.textContent.includes('Your words. Just for them.')`)
    const publish = requests.find(r => r.path.endsWith('/create_letter_v2')).data
    assert.equal(publish.p_password, 'two little flowers'); assert.equal(publish.p_activation_code, 'CODE-1234')
    assert.equal(await run(`sessionStorage.getItem('stack-petals:letter-v2-claim')`), null)
    assert.equal(await run(`JSON.stringify({...localStorage,...sessionStorage}).includes('two little flowers')`), false)
    await run(`document.querySelector('.gift-password-settings').open=true`)
    await fill('.gift-password-settings input', 'another private phrase')
    await fill('.gift-password-settings label:nth-of-type(2) input', 'another private phrase')
    await run(`document.querySelector('.gift-password-settings form').requestSubmit()`)
    await waitFor(`document.body.textContent.includes('Password updated.')`)
    assert.equal(requests.find(r => r.path.endsWith('/change_gift_letter_password')).data.p_management_token, 'b'.repeat(64))
    console.log('PASS activation credential, password confirmation, private composer receipt and password change')
    assert.equal(errors.length, 0, JSON.stringify(errors))
    console.log('PASS no browser runtime exceptions; no live backend data accessed')
  } finally { await send('Browser.close'); ws.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
