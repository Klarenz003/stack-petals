<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ContactInfo } from '@/types'
import { supabase } from '@/supabaseClient'

const submitted = ref(false)
const form = ref({ name: '', email: '', subject: '', message: '' })
const submitError = ref('')
const pickupMapUrl = 'https://www.google.com/maps/search/?api=1&query=Evasco%20Family%2C%20Santa%20Ana%2C%20Taytay%20Rizal'

const info: ContactInfo[] = [
  { icon: '📍', label: 'Pickup Area', value: 'Santa Ana, Taytay, Rizal' },
  { icon: '📧', label: 'Email', value: 'stack.petals@gmail.com' },
  { icon: '📱', label: 'Phone', value: '+63 962 270 3704' },
  { icon: '🕐', label: 'Business Hours', value: 'Mon-Sat, 8:00 AM - 7:00 PM' },
]

const supportCards = [
  {
    title: 'Order Concerns',
    text: 'For payment proof, delivery date, pre-order, or receipt questions.',
  },
  {
    title: 'Pickup Guidance',
    text: 'Choose pickup during checkout and use our location link when you are ready to visit.',
  },
  {
    title: 'Custom Requests',
    text: 'Tell us your preferred color, occasion, or message idea before placing an order.',
  },
]

const formValid = computed(() =>
  !!(form.value.name && form.value.email && form.value.message && !emailError.value)
)

async function sendMessage() {
  if (!formValid.value) return
  submitError.value = ''

  const { error } = await supabase.from('messages').insert({
    name:    form.value.name,
    email:   form.value.email,
    subject: form.value.subject,
    message: form.value.message,
  })

  if (error) {
    console.error('Failed to send message:', error.message)
    submitError.value = 'We could not send your message right now. Please try again or contact us on Facebook.'
    return
  }

  submitted.value = true
  form.value = { name: '', email: '', subject: '', message: '' }
}

const emailError = ref('')

function validateEmail() {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.value.email) {
    emailError.value = ''
    return
  }
  emailError.value = pattern.test(form.value.email)
    ? ''
    : 'Please enter a valid email address'
}
</script>

<template>
  <div class="page-section">
    <div class="page-hero">
      <h1>Get in <span>Touch</span></h1>
      <p>Questions about orders, pickup, custom designs, or the QR letter experience? We are here to help.</p>
    </div>

    <div class="contact-support-row">
      <article v-for="card in supportCards" :key="card.title" class="contact-support-card">
        <h2>{{ card.title }}</h2>
        <p>{{ card.text }}</p>
      </article>
    </div>

    <div class="contact-grid">
      <!-- Contact info -->
      <div class="contact-info">
        <h2>Contact Details</h2>
        <div v-for="item in info" :key="item.label" class="contact-item">
          <span class="contact-icon">{{ item.icon }}</span>
          <div>
            <strong>{{ item.label }}</strong>
            <p>{{ item.value }}</p>
          </div>
        </div>

        <div class="pickup-contact-card">
          <span>Pickup Location</span>
          <strong>Stack Petals pickup is around Santa Ana, Taytay, Rizal.</strong>
          <p>Open the location in Google Maps before pickup so you can plan your route.</p>
          <a :href="pickupMapUrl" target="_blank" rel="noopener">Open Google Maps</a>
        </div>

        <h2 class="contact-follow-heading">Follow Us</h2>
        <div class="social-links">
          <a href="https://www.facebook.com/StackOverPetals" class="social-btn">Facebook</a>
          <!-- <a href="#" class="social-btn">Instagram</a> -->
          <!-- <a href="#" class="social-btn">TikTok</a> -->
        </div>
      </div>

      <!-- Contact form -->
      <div class="contact-form">
        <div v-if="!submitted">
          <h2>Send a Message</h2>
          <p class="contact-form-hint">For order concerns, include your order reference so we can help faster.</p>
          <div class="co-form">
            <label>Name
              <input v-model="form.name" type="text" placeholder="Your name" />
            </label>
            <label>Email
              <input v-model="form.email" type="email" placeholder="your@email.com" @input="validateEmail" @blur="validateEmail"/>
              <small class="field-error" v-if="emailError">{{ emailError }}</small>
            </label>
            <label>Subject
              <input v-model="form.subject" type="text" placeholder="What's this about?" />
            </label>
            <label>Message
              <textarea v-model="form.message" rows="5" placeholder="Write your message here..."></textarea>
            </label>
          </div>
          <p v-if="submitError" class="field-error contact-submit-error">{{ submitError }}</p>
          <button
            class="co-btn-primary"
            style="width:100%;margin-top:16px"
            @click="sendMessage"
            :disabled="!formValid"
          >
            Send Message
          </button>
        </div>

        <div v-else class="contact-success">
          <div class="contact-success-mark">Sent</div>
          <h2>Message Sent!</h2>
          <p>Thank you for reaching out! We'll get back to you within 24 hours.</p>
          <button class="co-btn-outline" style="margin-top:20px" @click="submitted = false">
            Send Another
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
