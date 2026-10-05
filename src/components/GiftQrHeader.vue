<script setup lang="ts">
import { PhFlowerTulip, PhCheck } from '@phosphor-icons/vue'
defineProps<{ composing?: boolean; reading?: boolean }>()
</script>

<template>
  <header class="gift-studio-header">
    <div class="gift-studio-brand">
      <span class="gift-studio-emblem" aria-hidden="true"><PhFlowerTulip :size="25" weight="light" /></span>
      <div><span class="gift-studio-brand-name">Stack Petals</span><small>A gift, made personal.</small></div>
      <span v-if="!reading" class="gift-studio-step-count">{{ composing ? '02' : '01' }} <span>/ 02</span></span>
    </div>
    <ol v-if="!reading" class="gift-studio-progress" aria-label="Your gift letter progress">
      <li :class="{ 'is-current': !composing, 'is-done': composing }" :aria-current="!composing ? 'step' : undefined"><span><PhCheck v-if="composing" :size="13" weight="bold" /><template v-else>1</template></span>Activate your gift</li>
      <li :class="{ 'is-current': composing }" :aria-current="composing ? 'step' : undefined"><span>2</span>Make it personal</li>
    </ol>
  </header>
</template>
