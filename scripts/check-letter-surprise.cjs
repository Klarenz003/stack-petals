// Vite 5183 + isolated Chrome CDP 9243. Backend requests are mocked.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path')
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
// Run with SURPRISE_MEMORY_UPLOADS=0 to verify the default special photo on restricted cards.
const memoryUploads = process.env.SURPRISE_MEMORY_UPLOADS !== '0'
;(async () => {
  const tabs = await (await fetch('http://127.0.0.1:9243/json')).json()
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }))
  let sequence = 0, publish, surprisePhoto
  const pending = new Map(), errors = []
  const send = (method, params = {}) => new Promise(resolve => { const id = ++sequence; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })) })
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data)
    if (m.id) { pending.get(m.id)?.(m); pending.delete(m.id) }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params)
    if (m.method === 'Fetch.requestPaused') {
      const r = m.params.request
      let body = []
      if (r.url.includes('/rest/v1/letters?')) body = null
      if (r.url.endsWith('/resolve_letter_v2_qr') && r.method !== 'OPTIONS') body = [{ id:'replacement-qr',product_name:'Internal replacement name',has_photo_upload:true,has_360_view:false,status:'unused',letter_id:'a1111111-1111-4111-8111-111111111111' }]
      if (r.url.endsWith('/claim_letter_v2_qr') && r.method !== 'OPTIONS') body = [{ id:'replacement-qr',status:'published',letter_id:'a1111111-1111-4111-8111-111111111111' }]
      if (r.url.endsWith('/read_private_letter') && r.method !== 'OPTIONS') {
        const data = JSON.parse(r.postData)
        body = data.p_password === 'two little flowers' ? { status: 'unlocked', letter: {
          id: 'a1111111-1111-4111-8111-111111111111', letter_v2_qr_id: 'fake-qr', order_id: null, published: true,
          requires_password: true, has_photo_upload: memoryUploads, sender: 'Someone who cares', recipient: 'Favorite person',
          message: 'A private letter', letter_theme: 'romance', memories: [], angle_photos: [], petal_messages: publish?.p_petal_messages || [],
          backgrounds: { petal_labels: publish?.p_petal_labels, petal_artworks: publish?.p_petal_artworks, final_surprise: { title: 'Our special moment', message: 'You are loved.', photo: surprisePhoto } }
        } } : { status: 'locked' }
      }
      if (r.url.endsWith('/create_letter_v2') && r.method !== 'OPTIONS') {
        publish = JSON.parse(r.postData)
        body = [{ id: 'a1111111-1111-4111-8111-111111111111', management_token: 'a'.repeat(64) }]
      }
      send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Access-Control-Allow-Headers', value: '*' }], body: Buffer.from(JSON.stringify(body)).toString('base64') })
    }
  })
  const run = async expression => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw Error(JSON.stringify(r.result.exceptionDetails)); return r.result.result.value }
  const until = async expression => { for(let i=0;i<40;i++){ if(await run(expression)) return; await delay(250) } throw Error(`Timed out: ${expression}`) }
  const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); fs.writeFileSync(path.join(process.env.TEMP, name), Buffer.from(r.result.data, 'base64')) }
  const fill = async (selector,value) => run(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}))})()`)
  const click = async selector => { await run(`document.querySelector(${JSON.stringify(selector)}).click()`); await delay(100) }
  const submit = async () => { await run("document.querySelector('.gift-studio form').requestSubmit()"); await delay(100) }
  const crop = async () => {
    const doc = await send('DOM.getDocument'), file = await send('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: 'input[type=file]' })
    await send('DOM.setFileInputFiles', { nodeId: file.result.nodeId, files: [path.resolve('public/images/keepsake-letter.png')] })
    await delay(700); await click('.memory-crop-modal .co-btn-primary'); await delay(300)
  }
  try {
    await send('Runtime.enable'); await send('Page.enable'); await send('DOM.enable')
    await send('Fetch.enable', { patterns: [{ urlPattern: '*rest/v1/*' }, { urlPattern: '*auth/v1/*' }, { urlPattern: '*functions/v1/*' }] })
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
    await send('Page.navigate', { url: 'http://127.0.0.1:5183/letter-v2/claim/replacement-test' }); await delay(1600)
    await until("document.body.textContent.includes('Your keepsake. A fresh key.')")
    assert.ok(await run("document.body.textContent.includes('Your keepsake. A fresh key.')"))
    assert.equal(await run("document.querySelectorAll('.gift-activation-next').length"),0)
    assert.equal(await run("document.body.textContent.includes('Internal replacement name')"),false)
    await fill('#gift-activation-code','NEW1-CODE'); await submit(); await delay(800)
    assert.equal(await run('location.pathname'),'/letter-v2/a1111111-1111-4111-8111-111111111111')
    assert.equal(publish,undefined)
    assert.equal(await run("sessionStorage.getItem('stack-petals:letter-v2-claim')"),null)
    await send('Page.navigate', { url: 'http://127.0.0.1:5183/letter-v2/create/not-activated' }); await delay(1600)
    assert.equal(await run("document.querySelector('fieldset').disabled"), true)
    assert.equal(publish, undefined)
    await run(`sessionStorage.setItem('stack-petals:letter-v2-claim',JSON.stringify({token:'surprise-test',qrId:'fake-qr',activationCode:'TEST-1234',has_photo_upload:${memoryUploads}}));sessionStorage.setItem('stack-petals:startup-ready:v1','ready')`)
    await send('Page.navigate', { url: 'http://127.0.0.1:5183/letter-v2/create/surprise-test' }); await delay(1100)
    await submit()
    assert.equal(await run("document.querySelectorAll('#gift-letter-to').length"), 1)
    await fill('#gift-letter-to','Favorite person'); await fill('#gift-letter-from','Your sender'); await fill('#gift-letter-message','A private test letter.')
    await shot('stack-petals-composer-step-one-mobile.png')
    await submit()
    assert.equal(await run("document.querySelectorAll('.little-note').length"), 6)
    assert.equal(await run("document.querySelector('[aria-label=\\\"Body for note 1\\\"]').value"), 'Your laughter makes the little moments feel brighter.')
    await fill('[aria-label="Body for note 1"]',' ')
    assert.equal(await run("document.querySelector('.little-note-default').textContent.includes('Suggested words will be used.')"), true)
    await click('[aria-label="Use suggested words for note 1"]')
    await fill('[aria-label="Title for note 1"]','My sunshine'); await fill('[aria-label="Body for note 1"]','You light up my day.')
    await click('[aria-label="Use Heart artwork for note 1"]')
    if (memoryUploads) await crop()
    else assert.equal(await run("document.querySelectorAll('input[type=file]').length"), 0)
    await shot('stack-petals-little-things-mobile.png')
    await submit()
    await fill('#gift-password','two little flowers'); await fill('#gift-password-confirm','two little flowers')
    await click('.gift-surprise-toggle input')
    await fill('#gift-surprise-heading','Our special moment'); await fill('#gift-surprise-message','You are loved.')
    await crop()
    surprisePhoto = await run("document.querySelector('.memory-item img').src")
    assert.equal(surprisePhoto.startsWith('data:image/jpeg'),true)
    assert.equal(await run("document.querySelectorAll('.composer-review-button').length"),0)
    assert.equal(await run("document.querySelector('.gift-surprise-live-preview h3').textContent"),'Our special moment')
    assert.equal(await run("document.querySelector('.gift-surprise-live-preview img').src"),surprisePhoto)
    await click('.composer-back')
    assert.equal(await run("document.querySelectorAll('.memory-item').length"),memoryUploads ? 1 : 0)
    assert.equal(await run("document.querySelector('[aria-label=\\\"Use Heart artwork for note 1\\\"]').getAttribute('aria-pressed')"),'true')
    await click('.composer-back')
    assert.equal(await run("document.querySelector('#gift-letter-message').value"),'A private test letter.')
    await submit(); await submit()
    assert.equal(await run("document.querySelector('.memory-item img').src"),surprisePhoto)
    assert.equal(await run("document.querySelector('#gift-password').value"),'two little flowers')
    assert.equal(await run('document.documentElement.scrollWidth <= window.innerWidth'),true)
    await shot('stack-petals-composer-step-three-mobile.png')
    await submit(); await delay(500)
    assert.equal(publish.p_surprise.message, 'You are loved.')
    assert.equal(publish.p_surprise.photo, surprisePhoto)
    if (!memoryUploads) assert.deepEqual(publish.p_memories, [])
    assert.equal(publish.p_petal_labels[0], 'My sunshine')
    assert.equal(publish.p_petal_messages[0], 'You light up my day.')
    assert.equal(publish.p_petal_artworks[0], 3)
    assert.equal(await run("document.querySelector('#share-letter-password').type"), 'password')
    assert.equal(await run("JSON.stringify({...localStorage,...sessionStorage}).includes('two little flowers')"), false)
    await run(`window.copiedPassword='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedPassword=text}}});document.querySelector('.password-share-actions button').click()`)
    await delay(50)
    assert.equal(await run('window.copiedPassword'), 'two little flowers')
    await run(`window.sharedPassword='';Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.sharedPassword=data.text||'';window.savedPassword=data.files?await data.files[0].text():''}});Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});document.querySelector('.password-share-actions button:nth-child(2)').click()`)
    await delay(50)
    assert.equal(await run("window.sharedPassword.includes('two little flowers')"), true)
    assert.equal(await run("window.sharedPassword.includes('https://')"), false)
    await run("document.querySelector('.password-share-actions button:nth-child(3)').click()"); await delay(50)
    assert.equal(await run("window.savedPassword.includes('two little flowers')"), true)
    assert.equal(await run('document.documentElement.scrollWidth <= window.innerWidth'), true)
    await shot('stack-petals-password-sharing-mobile.png')
    await run("document.querySelector('.password-share-clear').click()"); await delay(50)
    assert.equal(await run("document.querySelectorAll('#share-letter-password').length"), 0)
    await send('Page.navigate', { url: 'http://127.0.0.1:5183/letter-v2/a1111111-1111-4111-8111-111111111111' }); await delay(700)
    assert.equal(await run("document.querySelectorAll('.personal-surprise').length"), 0)
    await run("const e=document.querySelector('#recipient-password');e.value='two little flowers';e.dispatchEvent(new Event('input',{bubbles:true}))")
    await delay(50); await run("document.querySelector('form').requestSubmit()"); await delay(750)
    assert.equal(await run("document.querySelectorAll('.personal-surprise').length"), 1)
    assert.equal(await run("document.querySelector('.reason-card__label').textContent"), 'My sunshine')
    assert.equal(await run("document.querySelector('#reason-1').textContent"), 'You light up my day.')
    assert.equal(await run("document.querySelector('.reason-card__icon path').getAttribute('d').startsWith('M50 82')"), true)
    assert.equal(await run("getComputedStyle(document.querySelector('.gift-showcase')).display"), 'none')
    await run("document.querySelector('.personal-surprise button').click()"); await delay(700)
    assert.equal(await run("document.querySelector('.personal-surprise-photo img').src"), surprisePhoto)
    assert.equal(errors.length, 0)
    console.log('PASS renewed-card activation opens existing letter without composer; three steps, private password copy/share/save/clear, no password storage, mobile, defaults and recipient reveal')
  } finally { await send('Browser.close'); ws.close() }
})().catch(e => { console.error(e); process.exitCode = 1 })
