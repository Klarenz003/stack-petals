// Vite on 5183 + isolated Chrome CDP on 9243. Real IndexedDB; mocked backend.
const assert = require('node:assert/strict')
const path = require('node:path')
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
;(async () => {
  const tabs = await (await fetch('http://127.0.0.1:9243/json')).json()
  const ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }))
  let id = 0, failPublish = false
  const pending = new Map(), errors = [], publishes = []
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id; pending.set(key, { resolve, reject }); ws.send(JSON.stringify({ id: key, method, params }))
  })
  ws.addEventListener('message', event => {
    const m = JSON.parse(event.data)
    if (m.id) { const p = pending.get(m.id); m.error ? p?.reject(Error(JSON.stringify(m.error))) : p?.resolve(m); pending.delete(m.id) }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params)
    if (m.method === 'Page.javascriptDialogOpening') void send('Page.handleJavaScriptDialog', { accept: true })
    if (m.method !== 'Fetch.requestPaused') return
    const request = m.params.request, url = new URL(request.url)
    let body = [], code = 200
    if (request.method !== 'OPTIONS') {
      const data = request.postData ? JSON.parse(request.postData) : {}
      if (url.pathname.endsWith('/resolve_letter_v2_qr') || url.pathname.endsWith('/claim_letter_v2_qr')) {
        body = [{ id: `qr-${data.p_public_token}`, status: 'claimed', has_photo_upload: true, has_360_view: false, letter_id: null }]
      }
      if (url.pathname.endsWith('/create_letter_v2')) {
        publishes.push(data)
        if (failPublish) { code = 400; body = { code: 'P0001', message: 'Simulated publish failure' } }
        else body = [{ id: 'a1111111-1111-4111-8111-111111111111', management_token: 'b'.repeat(64) }]
      }
    }
    void send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: code,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' },
        { name: 'Access-Control-Allow-Headers', value: '*' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' }],
      body: Buffer.from(JSON.stringify(body)).toString('base64') })
  })
  const run = async expression => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true })
    if (r.result.exceptionDetails) throw Error(JSON.stringify(r.result.exceptionDetails))
    return r.result.result.value
  }
  const until = async expression => {
    for (let n = 0; n < 100; n++) { if (await run(expression)) return; await delay(100) }
    throw Error(`Timed out: ${expression}; page: ${await run('document.body.innerText.slice(-1800)')}`)
  }
  const navigate = async route => { await send('Page.navigate', { url: `http://127.0.0.1:5183${route}` }); await delay(350) }
  const fill = (selector, value) => run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}))})()`)
  const click = selector => run(`document.querySelector(${JSON.stringify(selector)}).click()`)
  const submit = () => run(`document.querySelector('.gift-studio form').requestSubmit()`)
  const saved = () => until(`document.querySelector('.composer-draft-status')?.textContent === 'Draft saved on this device.'`)
  const read = token => run(`(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('stack-petals:letter-drafts',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});try{return await new Promise((resolve,reject)=>{const r=db.transaction('drafts').objectStore('drafts').get(${JSON.stringify(token)});r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}finally{db.close()}})()`)
  const activate = async token => {
    await navigate(`/letter-v2/claim/${token}`); await until(`!!document.querySelector('#gift-activation-code')`)
    await fill('#gift-activation-code', 'DRAF-1234'); await submit()
    await until(`location.pathname === '/letter-v2/create/${token}' && !document.querySelector('.gift-studio-fields').disabled`)
  }
  const crop = async () => {
    const doc = await send('DOM.getDocument')
    const node = await send('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: 'input[type=file]' })
    await send('DOM.setFileInputFiles', { nodeId: node.result.nodeId, files: [path.resolve('public/images/keepsake-letter.png')] })
    await until(`!!document.querySelector('.memory-crop-modal .co-btn-primary:not(:disabled)')`)
    await click('.memory-crop-modal .co-btn-primary')
    await until(`!document.querySelector('.memory-crop-modal') && !!document.querySelector('.memory-item img')`)
  }
  try {
    await send('Runtime.enable'); await send('Page.enable'); await send('DOM.enable')
    await send('Fetch.enable', { patterns: [{ urlPattern: '*rest/v1/*' }, { urlPattern: '*functions/v1/*' }, { urlPattern: '*auth/v1/*' }] })
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `sessionStorage.setItem('stack-petals:startup-ready:v1','ready')` })
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
    await activate('draft-a')
    await fill('#gift-letter-from', 'Draft sender'); await fill('#gift-letter-to', 'Draft recipient')
    await fill('#gift-letter-message', 'A letter that survives coming back later.')
    await click('.gift-studio-themes button:nth-child(5)'); await submit()
    await until(`!!document.querySelector('.little-note')`)
    await fill('[aria-label="Title for note 1"]', 'My sunshine')
    await fill('[aria-label="Body for note 1"]', 'You light up my day.')
    await click('[aria-label="Use Heart artwork for note 1"]'); await crop()
    const memoryPhoto = await run(`document.querySelector('.memory-item img').src`)
    await submit(); await until(`!!document.querySelector('#gift-password')`)
    await click('.gift-surprise-toggle input')
    await fill('#gift-surprise-heading', 'Our moment'); await fill('#gift-surprise-message', 'A saved surprise.')
    await crop()
    const surprisePhoto = await run(`document.querySelector('.memory-item img').src`)
    await fill('#gift-password', 'rose'); await fill('#gift-password-confirm', 'rose'); await saved()
    const original = await read('draft-a')
    assert.equal(original.content.step, 3); assert.equal(original.content.theme, 'friendship')
    assert.deepEqual(original.content.memories, [memoryPhoto]); assert.deepEqual(original.content.surprisePhotos, [surprisePhoto])
    assert.equal(original.content.petalTitles[0], 'My sunshine'); assert.equal(original.content.petalArtworks[0], 3)
    assert.equal(original.expiresAt - original.savedAt, 7 * 86400000)
    assert.equal(JSON.stringify(original).includes('DRAF-1234'), false)
    assert.equal(JSON.stringify(original).includes('rose'), false)
    assert.equal(JSON.stringify(original).includes('managementToken'), false)
    console.log('PASS real IndexedDB saves all composer fields, cropped photos and step; no password or activation credential')

    await send('Page.reload')
    await until(`document.querySelector('.composer-draft-status')?.textContent.includes('restored')`)
    assert.equal(await run(`document.querySelector('#gift-password').value`), '')
    assert.equal(await run(`document.querySelector('#gift-surprise-message').value`), 'A saved surprise.')
    assert.equal(await run(`document.querySelector('.memory-item img').src`), surprisePhoto)
    await click('.composer-steps li:nth-child(1) button')
    assert.equal(await run(`document.querySelector('#gift-letter-message').value`), original.content.message)
    assert.equal(await run(`document.querySelector('#gift-letter-from').value`), 'Draft sender')
    assert.equal(await run(`document.querySelector('#gift-letter-to').value`), 'Draft recipient')
    await click('.composer-steps li:nth-child(2) button')
    assert.equal(await run(`document.querySelector('[aria-label="Title for note 1"]').value`), 'My sunshine')
    assert.equal(await run(`document.querySelector('.memory-item img').src`), memoryPhoto)
    await click('.composer-steps li:nth-child(3) button'); await saved()
    await run(`sessionStorage.removeItem('stack-petals:letter-v2-claim')`)
    await send('Page.reload'); await until(`!!document.querySelector('.gift-studio-fields:disabled')`)
    assert.equal(await run(`document.querySelector('#gift-letter-message').value`), '')
    await activate('draft-a'); await until(`!!document.querySelector('#gift-surprise-message')`)
    assert.equal(await run(`document.querySelector('#gift-surprise-message').value`), 'A saved surprise.')
    console.log('PASS reload restores the exact draft, passwords remain blank, and returning after tab-session loss still requires activation')

    await activate('draft-b')
    assert.equal(await run(`document.querySelector('#gift-letter-message').value`), '')
    await fill('#gift-letter-to', 'Another recipient'); await fill('#gift-letter-message', 'A separate letter.'); await saved()
    const otherDraft = await read('draft-b')
    assert.equal(otherDraft.content.message, 'A separate letter.')
    assert.equal((await read('draft-a')).content.message, original.content.message)
    await activate('draft-a'); await until(`!!document.querySelector('#gift-password')`)
    await fill('#gift-password', 'rose'); await fill('#gift-password-confirm', 'rose')
    failPublish = true; await submit()
    await until(`document.querySelector('.gift-studio-error')?.textContent.includes('publish')`)
    assert.equal((await read('draft-a')).content.message, original.content.message)
    failPublish = false; await submit()
    await until(`document.body.textContent.includes('Your words. Just for them.')`)
    assert.equal(await read('draft-a'), null); assert.ok(await read('draft-b'))
    assert.equal(publishes.at(-1).p_surprise.photo, surprisePhoto)
    console.log('PASS drafts stay separate per QR; failed publishing keeps the draft and successful publishing removes only that card’s draft')

    await activate('draft-b')
    await click('.composer-draft-actions button'); await click('.composer-draft-actions button:last-child')
    assert.ok(await read('draft-b')) // Cancel is non-destructive.
    await fill('#gift-letter-message', 'Pending changes just before deletion')
    await click('.composer-draft-actions button'); await click('.composer-draft-actions button:first-of-type')
    await until(`document.querySelector('.composer-draft-status')?.textContent.includes('deleted')`)
    assert.equal(await run(`document.querySelector('#gift-letter-message').value`), '')
    await delay(400); assert.equal(await read('draft-b'), null)
    await run(`window.originalDraftPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put = function(){throw new DOMException('Simulated quota failure','QuotaExceededError')}`)
    await fill('#gift-letter-message', 'Keep writing despite full storage')
    await until(`document.querySelector('.composer-draft [role=alert]')?.textContent.includes('could not be saved')`)
    assert.equal(await read('draft-b'), null)
    assert.equal(await run(`document.querySelector('.gift-studio-fields').disabled`), false)
    await run(`IDBObjectStore.prototype.put=window.originalDraftPut`)
    await click('.composer-draft-actions button:first-child'); await saved()
    console.log('PASS discard confirmation, deletion/write-race protection and honest quota-failure warning')

    // Avoid the intentional unsaved-change navigation prompt for this failure test.
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `Object.defineProperty(window,'indexedDB',{configurable:true,get(){throw new DOMException('blocked','SecurityError')}})` })
    await send('Page.navigate', { url: 'http://127.0.0.1:5183/letter-v2/create/draft-b' })
    await until(`document.querySelector('.composer-draft [role=alert]')?.textContent.includes('unavailable')`)
    assert.equal(await run(`document.querySelector('.gift-studio-fields').disabled`), false)
    assert.equal(await run(`document.documentElement.scrollWidth <= innerWidth + 1`), true)
    assert.equal(errors.length, 0, JSON.stringify(errors))
    console.log('PASS blocked browser storage still permits composing; mobile layout has no overflow; no runtime exceptions')
  } finally { await send('Browser.close').catch(() => {}); ws.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
