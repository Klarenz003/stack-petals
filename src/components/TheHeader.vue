<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <header>
    <div class="logo" @click="router.push('/')">
      <img src="/images/logo.png" alt="Stack Petals" />
    </div>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/bouquets">Bouquets</RouterLink>
      <RouterLink to="/about">About</RouterLink>
      <RouterLink to="/process">Process</RouterLink>
      <RouterLink to="/gallery">Gallery</RouterLink>
      <RouterLink to="/reviews">Reviews</RouterLink>
      <RouterLink to="/contact">Contact</RouterLink>
    </nav>
  </header>
</template>
