// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { installErrorTracker, reportStorefrontError } from './services/errorTracker'
import './assets/main.css'
import './assets/storefront-studio.css'
// Import './assets/darkmode.css' when the dark theme is ready to ship.

const app = createApp(App)
installErrorTracker(app)
router.onError(error => reportStorefrontError('navigation', error))

app.use(createPinia())
app.use(router)

app.mount('#app')


// ── Security ─────────────────────────────────────────────────
// Preserve browser zoom, text selection, and standard keyboard shortcuts.
