// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

// Lazy-loaded page components
const HomePage     = () => import('@/pages/HomePage.vue')
const BouquetsPage = () => import('@/pages/BouquetsPage.vue')
const AboutPage    = () => import('@/pages/AboutPage.vue')
const ProcessPage  = () => import('@/pages/ProcessPage.vue')
const GalleryPage  = () => import('@/pages/GalleryPage.vue')
const ReviewsPage  = () => import('@/pages/ReviewsPage.vue')
const ContactPage  = () => import('@/pages/ContactPage.vue')

const router = createRouter({
  // Use createWebHistory for clean URLs (Vercel supports this natively)
  // Add a vercel.json rewrite rule: { "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',          name: 'home',      component: HomePage     },
    { path: '/bouquets',  name: 'bouquets',  component: BouquetsPage },
    { path: '/about',     name: 'about',     component: AboutPage    },
    { path: '/process',   name: 'process',   component: ProcessPage  },
    { path: '/gallery',   name: 'gallery',   component: GalleryPage  },
    { path: '/reviews',   name: 'reviews',   component: ReviewsPage  },
    { path: '/contact',   name: 'contact',   component: ContactPage  },
    // Catch-all → redirect to home
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
