// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const HomePage     = () => import('@/pages/HomePage.vue')
const BouquetsPage = () => import('@/pages/BouquetsPage.vue')
const AboutPage    = () => import('@/pages/AboutPage.vue')
const ProcessPage  = () => import('@/pages/ProcessPage.vue')
const GalleryPage  = () => import('@/pages/GalleryPage.vue')
const ReviewsPage  = () => import('@/pages/ReviewsPage.vue')
const ContactPage  = () => import('@/pages/ContactPage.vue')

// Used in App.vue to determine slide direction
export const routeOrder: Record<string, number> = {
  home:     0,
  bouquets: 1,
  about:    2,
  process:  3,
  gallery:  4,
  reviews:  5,
  contact:  6,
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',         name: 'home',      component: HomePage     },
    { path: '/bouquets', name: 'bouquets',  component: BouquetsPage },
    { path: '/about',    name: 'about',     component: AboutPage    },
    { path: '/process',  name: 'process',   component: ProcessPage  },
    { path: '/gallery',  name: 'gallery',   component: GalleryPage  },
    { path: '/reviews',  name: 'reviews',   component: ReviewsPage  },
    { path: '/contact',  name: 'contact',   component: ContactPage  },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router