<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { supabase } from '@/supabaseClient'

interface GalleryImage {
  id: string
  image_url: string
  title: string
  caption: string
  category: string
  focal_position: 'top' | 'center' | 'bottom'
}

const fallbackImages: GalleryImage[] = Array.from({ length: 4 }, (_, index) => ({
  id: `fallback-${index + 1}`,
  image_url: `/images/b${((index + 1) % 4) + 1}.png`,
  title: `Gallery ${index + 1}`,
  caption: '',
  category: 'Crafted Flowers',
  focal_position: 'center',
}))

const galleryImages = ref<GalleryImage[]>(fallbackImages)
const loading = ref(true)
const galleryError = ref('')
const activeCategory = ref('All')
const selectedImage = ref<GalleryImage | null>(null)
const categories = computed(() => ['All', ...new Set(galleryImages.value.map(image => image.category).filter(Boolean))])
const filteredImages = computed(() => activeCategory.value === 'All'
  ? galleryImages.value
  : galleryImages.value.filter(image => image.category === activeCategory.value))
const featuredPreview = computed(() => galleryImages.value.slice(0, 3))
const selectedIndex = computed(() => selectedImage.value
  ? filteredImages.value.findIndex(image => image.id === selectedImage.value?.id)
  : -1)

async function loadGalleryImages() {
  loading.value = true
  galleryError.value = ''
  const { data, error } = await supabase
    .from('gallery_images')
    .select('id, image_url, title, caption, category, focal_position')
    .eq('featured', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    galleryError.value = 'We are showing sample gallery pieces while the featured gallery refreshes.'
  } else if (data?.length) {
    galleryImages.value = data
  }

  loading.value = false
}

function openLightbox(image: GalleryImage) {
  selectedImage.value = image
}

function closeLightbox() {
  selectedImage.value = null
}

function moveLightbox(direction: number) {
  if (!filteredImages.value.length) return
  const nextIndex = (selectedIndex.value + direction + filteredImages.value.length) % filteredImages.value.length
  selectedImage.value = filteredImages.value[nextIndex]
}

function handleKeydown(event: KeyboardEvent) {
  if (!selectedImage.value) return
  if (event.key === 'Escape') closeLightbox()
  if (event.key === 'ArrowLeft') moveLightbox(-1)
  if (event.key === 'ArrowRight') moveLightbox(1)
}

watch(selectedImage, image => {
  document.body.classList.toggle('gallery-lightbox-open', Boolean(image))
})

onMounted(() => {
  loadGalleryImages()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.classList.remove('gallery-lightbox-open')
})
</script>

<template>
  <div class="page-section">
    <div class="page-hero">
      <h1>Our <span>Gallery</span></h1>
      <p>Real handcrafted pieces, sweet details, and little moments made to be remembered.</p>
    </div>

    <section v-if="!loading && featuredPreview.length" class="gallery-featured">
      <div class="gallery-featured-copy">
        <span>Featured Moments</span>
        <h2>Crafted flowers, kept as memories.</h2>
        <p>
          A soft look at the pieces, textures, and details that make every Stack Petals gift feel personal.
        </p>
      </div>
      <div class="gallery-featured-stack" aria-hidden="true">
        <img
          v-for="image in featuredPreview"
          :key="`featured-${image.id}`"
          :src="image.image_url"
          :alt="image.title || 'Featured Stack Petals gallery image'"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>

    <div v-if="loading" class="gallery-loading">
      <span></span>
      Preparing the gallery...
    </div>

    <div v-if="!loading && galleryError" class="gallery-notice">
      <p>{{ galleryError }}</p>
      <button type="button" @click="loadGalleryImages">Try Again</button>
    </div>

    <div v-if="!loading && galleryImages.length" class="gallery-filters" role="tablist" aria-label="Gallery categories">
      <button
        v-for="category in categories"
        :key="category"
        type="button"
        role="tab"
        :aria-selected="activeCategory === category"
        :class="{ active: activeCategory === category }"
        @click="activeCategory = category"
      >
        {{ category }}
      </button>
    </div>

    <div v-if="!loading" class="gallery-grid">
      <button
        v-for="image in filteredImages"
        :key="image.id"
        class="gallery-item"
        type="button"
        :aria-label="`Open ${image.title || 'gallery image'}`"
        @click="openLightbox(image)"
      >
        <img
          :src="image.image_url"
          :alt="image.title || 'Stack Petals gallery image'"
          :style="{ objectPosition: image.focal_position || 'center' }"
          loading="lazy"
          decoding="async"
        />
        <div v-if="image.title || image.caption" class="gallery-caption">
          <strong v-if="image.title">{{ image.title }}</strong>
          <span v-if="image.caption">{{ image.caption }}</span>
        </div>
      </button>
    </div>

    <Teleport to="body">
      <Transition name="gallery-lightbox">
        <div
          v-if="selectedImage"
          class="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          :aria-label="selectedImage.title || 'Gallery image preview'"
          @click.self="closeLightbox"
        >
          <button class="gallery-lightbox-close" type="button" aria-label="Close image preview" @click="closeLightbox">&times;</button>
          <button
            v-if="filteredImages.length > 1"
            class="gallery-lightbox-nav previous"
            type="button"
            aria-label="Previous image"
            @click="moveLightbox(-1)"
          >
            &#8249;
          </button>
          <figure>
            <img :src="selectedImage.image_url" :alt="selectedImage.title || 'Stack Petals gallery image'" />
            <figcaption v-if="selectedImage.title || selectedImage.caption">
              <strong v-if="selectedImage.title">{{ selectedImage.title }}</strong>
              <span v-if="selectedImage.caption">{{ selectedImage.caption }}</span>
            </figcaption>
          </figure>
          <button
            v-if="filteredImages.length > 1"
            class="gallery-lightbox-nav next"
            type="button"
            aria-label="Next image"
            @click="moveLightbox(1)"
          >
            &#8250;
          </button>
        </div>
      </Transition>
    </Teleport>

    <div v-if="!loading && !galleryImages.length" class="gallery-empty-state">
      <h2>No featured photos yet</h2>
      <p>Once gallery photos are featured from admin, they will appear here.</p>
    </div>
  </div>
</template>
