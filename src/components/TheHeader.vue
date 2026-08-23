<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)

const closeMenu = () => {
  menuOpen.value = false
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeMenu()
}

watch(menuOpen, (isOpen) => {
  document.documentElement.classList.toggle('site-menu-open', isOpen)
})

watch(
  () => route.fullPath,
  closeMenu,
)

onMounted(() => window.addEventListener('keydown', handleEscape))

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape)
  document.documentElement.classList.remove('site-menu-open')
})
</script>

<template>
  <header class="site-header">
    <div class="logo" @click="router.push('/')">
      <img src="/images/logo.png" alt="Stack Petals" />
    </div>

    <button
      class="nav-toggle"
      :class="{ open: menuOpen }"
      type="button"
      :aria-expanded="menuOpen"
      aria-controls="site-navigation"
      aria-label="Toggle navigation"
      @click="menuOpen = !menuOpen"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <nav id="site-navigation" :class="{ open: menuOpen }" aria-label="Primary navigation">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/products">Shop</RouterLink>
      <RouterLink to="/about">About</RouterLink>
      <RouterLink to="/process">Process</RouterLink>
      <RouterLink to="/gallery">Gallery</RouterLink>
      <RouterLink to="/reviews">Reviews</RouterLink>
      <RouterLink to="/track">Track Order</RouterLink>
      <RouterLink to="/contact">Contact</RouterLink>
    </nav>

    <button
      v-if="menuOpen"
      class="site-nav-backdrop"
      type="button"
      aria-label="Close navigation"
      @click="closeMenu"
    ></button>
  </header>
</template>
