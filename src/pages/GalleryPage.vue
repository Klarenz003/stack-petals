<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from '@/supabaseClient'

interface GalleryImage {
  id: string
  image_url: string
  title: string
  caption: string
}

const fallbackImages: GalleryImage[] = Array.from({ length: 4 }, (_, index) => ({
  id: `fallback-${index + 1}`,
  image_url: `/images/b${((index + 1) % 4) + 1}.png`,
  title: `Gallery ${index + 1}`,
  caption: '',
}))

const galleryImages = ref<GalleryImage[]>(fallbackImages)
const loading = ref(true)

async function loadGalleryImages() {
  loading.value = true
  const { data, error } = await supabase
    .from('gallery_images')
    .select('id, image_url, title, caption')
    .eq('featured', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (!error && data?.length) {
    galleryImages.value = data
  }

  loading.value = false
}

onMounted(loadGalleryImages)
</script>

<template>
  <div class="page-section">
    <div class="page-hero">
      <h1>Our <span>Gallery</span></h1>
      <p>A handcrafted moment worth remembering.</p>
    </div>

    <div v-if="loading" class="gallery-loading">Preparing the gallery...</div>

    <div v-else class="gallery-grid">
      <div v-for="image in galleryImages" :key="image.id" class="gallery-item">
        <img :src="image.image_url" :alt="image.title || 'Stack Petals gallery image'" loading="lazy" decoding="async" />
        <div v-if="image.title || image.caption" class="gallery-caption">
          <strong v-if="image.title">{{ image.title }}</strong>
          <span v-if="image.caption">{{ image.caption }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
