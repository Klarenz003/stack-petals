# Stack Petals — Vue 3 Frontend

> Vite · Vue 3 · TypeScript · Pinia · Vue Router · Vercel

For the current project-wide setup, architecture, design conventions, and
maintenance workflow, read **[stack.md](stack.md)**. The migration roadmap below
is historical; Supabase is already integrated into the application.

---

## Quick Start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # outputs to /dist
npm run type-check   # strict TypeScript checks
```

## Project Structure

```
stack-petals/
├── public/
│   └── images/          ← drop all your images here (b1-4.png, logo.png, etc.)
├── src/
│   ├── assets/
│   │   └── main.css     ← all global styles
│   ├── components/
│   │   ├── TheHeader.vue
│   │   ├── TheFooter.vue
│   │   ├── CartSidebar.vue
│   │   ├── CheckoutModal.vue
│   │   ├── BouquetPreviewModal.vue
│   │   └── ProductCard.vue
│   ├── composables/
│   │   ├── useCanvas.ts      ← circuit + petal animation
│   │   └── useFlyToCart.ts   ← add-to-cart animation
│   ├── pages/
│   │   ├── HomePage.vue
│   │   ├── BouquetsPage.vue
│   │   ├── AboutPage.vue
│   │   ├── ProcessPage.vue
│   │   ├── GalleryPage.vue
│   │   ├── ReviewsPage.vue
│   │   └── ContactPage.vue
│   ├── router/index.ts   ← Vue Router (clean URL history mode)
│   ├── stores/
│   │   ├── cart.ts       ← Pinia: cart, checkout, customer state
│   │   └── preview.ts    ← Pinia: bouquet preview modal
│   ├── types/index.ts    ← all shared TypeScript interfaces
│   ├── App.vue
│   └── main.ts
├── index.html
├── vite.config.ts
├── vercel.json           ← SPA rewrite rule
└── .env.example
```

## Adding Images

Copy all images from the original `Test/images/` folder into `public/images/`:

```
public/images/b1.png
public/images/b2.png
public/images/b3.png
public/images/b4.png
public/images/bouquet-main.png
public/images/bouquet-main1.png
public/images/cart-icon.png
public/images/crafted-icon.png
public/images/delivered-icon.png
public/images/engineered-icon.png
public/images/icon.png
public/images/logo.png
public/images/logo1.png
public/images/gcash-qr.jpg    ← add your actual QR
public/images/maya-qr.jpg     ← add your actual QR
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel — it auto-detects Vite.
3. Set build command: `npm run build`, output dir: `dist`.
4. The `vercel.json` handles SPA routing (clean URLs, no 404 on refresh).

---

## Migration Roadmap

### Phase 1 — Now (current)
- localStorage for orders and messages (same as vanilla)
- All pages and animations working

### Phase 2 — Supabase
- Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
- Replace `localStorage.setItem('sp_orders', ...)` in `src/stores/cart.ts → submitOrder()`
- Replace `localStorage.setItem('sp_messages', ...)` in `src/pages/ContactPage.vue → sendMessage()`
- Tables needed: `orders`, `messages`, `products` (Supabase Storage for payment proof images)

### Phase 3 — Node.js/Express API
- Set `VITE_API_BASE_URL` in `.env`
- Create an `src/services/api.ts` that wraps `fetch` with the base URL
- Swap the Supabase calls for `api.post('/orders', ...)` etc.
- Both stores already have `TODO` comments marking the swap points

### Admin (separate repo / subdomain)
- The admin panel is intentionally excluded from this repo
- It will live at a subdomain (e.g. `admin.stackoverpetals.shop`)
- Point it at the same Supabase project or the same Express API
