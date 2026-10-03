// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const HomePage     = () => import('@/pages/HomePage.vue')
const BouquetsPage = () => import('@/pages/BouquetsPage.vue')
const AboutPage    = () => import('@/pages/AboutPage.vue')
const ProcessPage  = () => import('@/pages/ProcessPage.vue')
const GalleryPage  = () => import('@/pages/GalleryPage.vue')
const ReviewsPage  = () => import('@/pages/ReviewsPage.vue')
const ContactPage  = () => import('@/pages/ContactPage.vue')
const TrackOrderPage = () => import('@/pages/TrackOrderPage.vue')
const ReceiptPage = () => import('@/pages/ReceiptPage.vue')
const LetterExperienceTestPage = () => import('@/pages/LetterExperienceTestPage.vue')
const GiftClaimPage = () => import('@/pages/GiftClaimPage.vue')

// Used in App.vue to determine slide direction
export const routeOrder: Record<string, number> = {
  home:     0,
  products: 1,
  about:    2,
  process:  3,
  gallery:  4,
  reviews:  5,
  track:    6,
  receipt:  7,
  contact:  8,
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',         name: 'home',      component: HomePage     },
    { path: '/products', name: 'products',  component: BouquetsPage },
    { path: '/bouquets', redirect: '/products' },
    { path: '/about',    name: 'about',     component: AboutPage    },
    { path: '/process',  name: 'process',   component: ProcessPage  },
    { path: '/gallery',  name: 'gallery',   component: GalleryPage  },
    { path: '/reviews',  name: 'reviews',   component: ReviewsPage  },
    { path: '/track',    name: 'track',     component: TrackOrderPage },
    { path: '/receipt',  name: 'receipt',   component: ReceiptPage },
    { path: '/contact',  name: 'contact',   component: ContactPage  },
    { path: '/town-preview', name: 'town-preview', component: () => import('@/pages/TownPreviewPage.vue'), meta: { hideNav: true } },
    { path: '/letter/:id', name: 'letter', component: () => import('@/pages/LetterPage.vue'), meta: { hideNav: true } },
    { path: '/letter-test', name: 'letter-test', component: LetterExperienceTestPage, meta: { hideNav: true } },
    { path: '/gift/claim/:token', name: 'gift-claim', component: GiftClaimPage, meta: { hideNav: true } },
    { path: '/gift/create/:token', name: 'gift-create', component: () => import('@/pages/GiftLetterCreatePage.vue'), meta: { hideNav: true } },
    { path: '/letter-v2/claim/:token', name: 'letter-v2-claim', component: () => import('@/pages/LetterV2ClaimPage.vue'), meta: { hideNav: true } },
    { path: '/letter-v2/create/:token', name: 'letter-v2-create', component: () => import('@/pages/LetterV2CreatePage.vue'), meta: { hideNav: true } },
    { path: '/letter-v2/:id', name: 'letter-v2', component: () => import('@/pages/LetterV2Page.vue'), meta: { hideNav: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
