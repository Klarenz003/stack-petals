<script setup lang="ts">
import { PhCode } from '@phosphor-icons/vue'

withDefaults(defineProps<{ modelValue: boolean; inline?: boolean }>(), { inline: false })
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <button type="button" class="code-pattern-toggle" :class="{ 'is-enabled': modelValue, 'is-inline': inline }" role="switch" aria-label="Code patterns" :aria-checked="modelValue" :title="modelValue ? 'Turn off decorative code patterns' : 'Turn on decorative code patterns'" @click="emit('update:modelValue', !modelValue)">
    <PhCode :size="19" weight="duotone" aria-hidden="true" />
    <span class="code-toggle-copy" aria-hidden="true"><span>Code patterns</span><small>{{ modelValue ? 'Programmer mode · on' : 'Quiet mode · off' }}</small></span>
    <span class="code-toggle-track" aria-hidden="true"><span></span></span>
  </button>
</template>

<style scoped>
.code-pattern-toggle { position:fixed; left:24px; bottom:max(26px,env(safe-area-inset-bottom)); z-index:900; display:flex; align-items:center; gap:12px; min-height:52px; padding:10px 14px; border:1px solid #e1d2c8; border-radius:17px; background:#fffcf8f5; color:#7a6b60; box-shadow:0 5px 20px #57483814; font-family:inherit; cursor:pointer; transition:background .2s,border-color .2s,box-shadow .2s; }
.code-pattern-toggle.is-enabled { border-color:#c5d6bc; color:#4c6d55; }
.code-pattern-toggle:hover { background:#fffdf8; border-color:#8fa685; box-shadow:0 8px 25px #57483820; }
.code-pattern-toggle:focus-visible { outline:2px solid #496b56; outline-offset:4px; }
.code-toggle-copy { display:flex; flex-direction:column; align-items:flex-start; gap:4px; }
.code-toggle-copy > span { font-family:'Fira Code','Courier New',monospace; font-size:10px; font-weight:600; line-height:1.3; }
.code-toggle-copy small { font-size:9px; line-height:1.3; color:#796c60; }
.code-toggle-track { position:relative; display:block; width:29px; height:17px; border-radius:99px; background:#d3c5b9; flex:none; transition:background .2s; }
.code-toggle-track > span { position:absolute; top:3px; left:3px; width:11px; height:11px; border-radius:50%; background:#fffcf8; box-shadow:0 1px 2px #392d2520; transition:transform .2s; }
.is-enabled .code-toggle-track { background:#5c8065; }
.is-enabled .code-toggle-track > span { transform:translateX(12px); }
.code-pattern-toggle.is-inline { position:static; width:100%; z-index:auto; min-height:57px; padding:13px 15px; box-shadow:none; border-radius:14px; }
.is-inline .code-toggle-copy { flex:1; }
@media(max-width:700px) { .code-pattern-toggle:not(.is-inline) { display:none; } }
@media(prefers-reduced-motion:reduce) { .code-pattern-toggle,.code-toggle-track,.code-toggle-track > span { transition:none; } }
@media print { .code-pattern-toggle { display:none; } }
</style>
