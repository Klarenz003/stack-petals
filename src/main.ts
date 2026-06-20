// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')


// ── Security ─────────────────────────────────────────────────
document.addEventListener('contextmenu', e => e.preventDefault())
document.addEventListener('selectstart', e => e.preventDefault())
document.addEventListener('dragstart',   e => e.preventDefault())

document.addEventListener('keydown', e => {
  if (e.key === 'F12')                                          { e.preventDefault(); return }
  if (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)){ e.preventDefault(); return }
  if (e.ctrlKey && ['U','S','A'].includes(e.key))              { e.preventDefault() }
})

// Disable Ctrl+scroll zoom (desktop)
document.addEventListener('wheel', e => {
  if (e.ctrlKey) e.preventDefault()
}, { passive: false })

// Disable pinch-to-zoom (mobile/trackpad)
document.addEventListener('touchmove', e => {
  if ((e as TouchEvent).touches.length > 1) e.preventDefault()
}, { passive: false })