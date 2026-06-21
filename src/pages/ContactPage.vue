<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ContactInfo } from '@/types'

const submitted = ref(false)
const form = ref({ name: '', email: '', subject: '', message: '' })

const info: ContactInfo[] = [
  { icon: '📍', label: 'Address',       value: 'Taytay, Rizal, Philippines' },
  { icon: '📧', label: 'Email',          value: 'hello@stackpetals.com'                 },
  { icon: '📱', label: 'Phone / Viber',  value: '+63 962 270 3704'                      },
  { icon: '🕐', label: 'Business Hours', value: 'Mon–Sat, 8:00 AM – 7:00 PM'            },
]

const formValid = computed(() =>
  !!(form.value.name && form.value.email && form.value.message)
)

/**
 * sendMessage: currently persists to localStorage.
 * TODO: Replace with an API call to your Node.js/Express backend, e.g.:
 *   await api.post('/messages', form.value)
 */
function sendMessage() {
  if (!formValid.value) return

  const msgs = JSON.parse(localStorage.getItem('sp_messages') || '[]')
  msgs.unshift({
    id:        `MSG-${Date.now()}`,
    createdAt: new Date().toISOString(),
    name:      form.value.name,
    email:     form.value.email,
    subject:   form.value.subject,
    message:   form.value.message,
    read:      false,
  })
  localStorage.setItem('sp_messages', JSON.stringify(msgs))

  submitted.value = true
  form.value = { name: '', email: '', subject: '', message: '' }
}
</script>

<template>
  <div class="page-section">
    <div class="page-hero">
      <h1>Get in <span>Touch</span></h1>
      <p>We'd love to hear from you. Send us a message and we'll get back to you soon.</p>
    </div>

    <div class="contact-grid">
      <!-- Contact info -->
      <div class="contact-info">
        <h2>Contact Info</h2>
        <div v-for="item in info" :key="item.label" class="contact-item">
          <span class="contact-icon">{{ item.icon }}</span>
          <div>
            <strong>{{ item.label }}</strong>
            <p>{{ item.value }}</p>
          </div>
        </div>

        <h2 style="margin-top:40px">Follow Us</h2>
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
          <div class="co-form">
            <label>Name
              <input v-model="form.name" type="text" placeholder="Your name" />
            </label>
            <label>Email
              <input v-model="form.email" type="email" placeholder="your@email.com" />
            </label>
            <label>Subject
              <input v-model="form.subject" type="text" placeholder="What's this about?" />
            </label>
            <label>Message
              <textarea v-model="form.message" rows="5" placeholder="Write your message here..."></textarea>
            </label>
          </div>
          <button
            class="co-btn-primary"
            style="width:100%;margin-top:16px"
            @click="sendMessage"
            :disabled="!formValid"
          >
            Send Message 🌸
          </button>
        </div>

        <div v-else class="contact-success">
          <div style="font-size:48px">🌷</div>
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
