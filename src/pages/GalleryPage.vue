<template>
  <div class="page-section">
    <div class="page-hero">
      <h1>Our <span>Gallery</span></h1>
      <p>A bloom for every moment.</p>
    </div>
    <div class="gallery-grid">
      <div v-for="n in 4" :key="n" class="gallery-item">
        <img :src="`/images/b${(n % 4) + 1}.png`" :alt="`Gallery ${n}`" />
      </div>
    </div>
  </div>
</template>
