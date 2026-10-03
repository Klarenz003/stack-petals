<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref } from 'vue'
import { PhX, PhTrash, PhArrowRight, PhFlower, PhQrCode, PhMinus, PhPlus } from '@phosphor-icons/vue'
import { useDialogFocus } from '@/composables/useDialogFocus'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
const panel = ref<HTMLElement | null>(null)
useDialogFocus(panel, () => cart.cartOpen, () => { cart.cartOpen = false })
</script>

<template>
  <div v-if="cart.cartOpen" class="cart-overlay" @click.self="cart.cartOpen = false">
    <div ref="panel" class="cart-panel cart-studio" role="dialog" aria-modal="true" aria-labelledby="studio-cart-title" tabindex="-1">
      <button class="close-btn" aria-label="Close cart" @click="cart.cartOpen = false"><PhX :size="18" /></button>
      <header class="gift-bag-header">
        <span class="gift-bag-emblem"><img src="/images/cart-icon.png" alt="" width="38" height="38" aria-hidden="true" /></span>
        <span class="gift-bag-eyebrow">Thoughtfully chosen. Beautifully given.</span>
        <h2 id="studio-cart-title">Your gift bag<span>.</span></h2>
        <p>{{ cart.cartItems.length ? 'A little collection of meaningful gestures.' : 'Something meaningful starts here.' }}</p>
      </header>

      <div v-if="cart.cartItems.length === 0" class="cart-empty-state">
        <div class="gift-bag-empty-art" aria-hidden="true"><PhFlower :size="58" weight="duotone" /><span><img src="/images/cart-icon.png" alt="" width="27" height="27" /></span></div>
        <span class="gift-bag-eyebrow">Room for something lovely</span>
        <h3>Your cart is waiting to bloom.</h3>
        <p>Choose a handcrafted piece and add the QR letter experience during checkout.</p>
        <RouterLink class="cart-empty-link" to="/products" @click="cart.cartOpen = false">
          Explore the collection <PhArrowRight :size="17" aria-hidden="true" />
        </RouterLink>
      </div>

      <div v-if="cart.cartItems.length > 0" class="cart-items-list">
        <div v-for="(item, index) in cart.cartItems" :key="item.name" class="cart-item">
          <img :src="item.image" :alt="item.name" />
          <div class="cart-item-info">
            <div class="cart-item-name">{{ item.name }}</div>
            <div v-if="item.preOrder" class="cart-preorder-label">Pre-order - 3-5 days prep</div>
            <div class="cart-item-price" :class="{ sale: item.salePrice }">
              <span v-if="item.salePrice" class="sale-price">{{ item.salePrice }}</span>
              <span :class="{ 'original-price': item.salePrice }">{{ item.salePrice ? item.originalPrice : item.price }}</span>
            </div>
            <div class="qty-controls">
              <button :aria-label="`Decrease quantity of ${item.name}`" @click="cart.updateQuantity(index, -1)"><PhMinus :size="13" weight="bold" aria-hidden="true" /></button>
              <span>{{ item.quantity }}</span>
              <button :aria-label="`Increase quantity of ${item.name}`" @click="cart.updateQuantity(index, 1)"><PhPlus :size="13" weight="bold" aria-hidden="true" /></button>
            </div>
          </div>
          <button class="remove-btn" :aria-label="`Remove ${item.name}`" @click="cart.removeFromCart(index)"><PhTrash :size="17" /></button>
        </div>
      </div>

      <div v-if="cart.cartItems.length > 0" class="cart-footer">
        <div class="cart-total">
          <span>Item subtotal</span>
          <strong>{{ cart.cartSubtotal }}</strong>
        </div>
        <p class="cart-checkout-note">Pickup or delivery fee is finalized during checkout.</p>
        <button class="checkout-btn" @click="cart.openCheckout()">
          Continue to checkout <PhArrowRight :size="18" aria-hidden="true" />
        </button>
        <button class="gift-bag-continue" type="button" @click="cart.cartOpen = false">Keep exploring</button>
      </div>
      <div class="gift-bag-keepsake"><PhQrCode :size="22" weight="duotone" aria-hidden="true" /><div><strong>More than flowers.</strong><span>Add a personal QR letter during checkout.</span></div></div>
    </div>
  </div>
</template>

<style scoped>
.cart-panel.cart-studio { position:relative; width:min(430px,100%); height:100dvh; max-height:100dvh; overflow:hidden; gap:16px; padding:22px 22px max(20px,env(safe-area-inset-bottom)); box-sizing:border-box; background:linear-gradient(160deg,#fffcf8,#fcf3ed); }
.cart-studio .close-btn { position:absolute; top:24px; right:24px; min-width:40px; min-height:40px; background:#fffcf8; border-color:#e5d5cc; color:#806b63; }
.gift-bag-header { flex:none; padding-bottom:16px; border-bottom:1px solid #e6d8d0; }
.gift-bag-emblem { display:grid; place-items:center; width:40px; height:40px; margin-bottom:12px; border-radius:13px; border:1px solid #dce5d6; background:#edf3e9; color:#5f8872; }
.gift-bag-emblem img { width:32px; height:32px; }
.gift-bag-emblem img,.gift-bag-empty-art img { display:block; object-fit:contain; border-radius:8px; }
.gift-bag-eyebrow { display:block; color:#9b6f77; font-size:9px; font-weight:600; line-height:1.6; letter-spacing:.1em; text-transform:uppercase; }
.cart-studio .gift-bag-header h2 { margin:6px 0; color:#453f37; font-size:36px; letter-spacing:-.035em; }
.gift-bag-header h2 span { color:#b77a83; }
.gift-bag-header p { margin:0; color:#817269; font-size:11px; line-height:1.7; }
.cart-studio .cart-empty-state { flex:1; min-height:0; overflow-y:auto; align-items:center; justify-content:center; padding:24px 18px; margin:0; gap:12px; text-align:center; border:1px solid #eadbd3; background:radial-gradient(ellipse at 50% 25%,#eef3e8,transparent 60%),#fffaf6; border-radius:22px; }
.cart-empty-state > * { flex-shrink:0; }
.gift-bag-empty-art { position:relative; display:grid; place-items:center; flex:none; width:86px; height:86px; margin-bottom:8px; border-radius:50%; border:1px solid #d9e3d3; background:#edf3e6; color:#759276; box-shadow:0 0 0 6px #f4f6ef; }
.gift-bag-empty-art > svg { width:46px; height:46px; }
.cart-studio .gift-bag-empty-art span { position:absolute; bottom:0; right:-3px; display:grid; place-items:center; width:40px; height:40px; border:3px solid #fffaf6; border-radius:14px; background:#f6e3e3; color:#ad7982; }
.cart-studio .cart-empty-state > .gift-bag-eyebrow { color:#9b6f77; font-size:9px; }
.cart-studio .cart-empty-state h3 { max-width:260px; margin:0; color:#453f37; font-size:29px; line-height:1.12; font-weight:500; letter-spacing:-.025em; }
.cart-studio .cart-empty-state p { max-width:280px; margin:0; font-size:12px; line-height:1.8; color:#796e64; }
.cart-studio .cart-empty-link { min-height:46px; gap:12px; margin-top:7px; padding:0 20px; font-size:12px; font-weight:500; border:1px solid #50745c; box-shadow:0 5px 14px #3d5a4710; }
.cart-studio .cart-items-list { display:flex; flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; flex-direction:column; gap:10px; padding:3px 5px 8px 2px; scrollbar-width:thin; scrollbar-color:#d4a1a4 transparent; -webkit-overflow-scrolling:touch; }
.cart-studio .cart-item { position:relative; flex:none; padding:13px; gap:12px; background:#fffcf8; border-color:#e7d8cf; border-radius:16px; }
.cart-studio .cart-item img { flex:none; width:60px; height:76px; border:1px solid #eadfd6; background:#f5ece3; }
.cart-studio .cart-item-name { padding-right:16px; color:#4d463d; font-size:21px; line-height:1.15; }
.cart-studio .qty-controls { display:flex; align-items:center; margin-top:9px; border-color:#e1d5c9; background:#faf5ee; }
.cart-studio .qty-controls button { display:grid; place-items:center; min-height:36px; min-width:36px; color:#577960; }
.cart-studio .qty-controls button:hover { background:#e9f0e4; }
.cart-studio .remove-btn { position:absolute; right:8px; top:8px; color:#b38187; }
.cart-studio .remove-btn:hover { background:#faeae8; border-radius:9px; color:#955661; }
.cart-studio .cart-footer { position:static; bottom:auto; flex:none; padding:16px; margin:0; border:1px solid #dce3d2; border-radius:18px; background:linear-gradient(140deg,#f2f6ed,#eaf0e4); }
.cart-studio .cart-total { gap:10px; }
.cart-studio .cart-total > span { font-size:12px; color:#62735b; }
.cart-studio .cart-total strong { color:#45634b; font-size:27px; }
.cart-studio .cart-checkout-note { margin:9px 0 12px; color:#747564; font-size:10px; line-height:1.6; }
.cart-studio .checkout-btn { min-height:44px; padding:11px 18px; font-size:12px; }
.gift-bag-continue { display:block; margin:8px auto 0; padding:4px 8px; border:0; background:none; color:#5a765e; font-size:11px; cursor:pointer; text-decoration:underline; text-underline-offset:4px; }
.gift-bag-keepsake { display:flex; flex:none; align-items:center; gap:12px; padding:0 5px; color:#b77a83; }
.gift-bag-keepsake > svg { flex:none; }
.gift-bag-keepsake div { display:flex; flex-direction:column; gap:3px; }
.gift-bag-keepsake strong { color:#6a6057; font-size:11px; font-weight:500; }
.gift-bag-keepsake span { color:#89786d; font-size:10px; line-height:1.5; }
.cart-studio :is(button,a):focus-visible { outline:2px solid #5f8872; outline-offset:3px; }
@media(max-width:480px) { .cart-panel.cart-studio { padding:18px 18px max(16px,env(safe-area-inset-bottom)); gap:13px; } .cart-studio .close-btn { top:18px; right:18px; } .cart-studio .gift-bag-header h2 { font-size:33px; } .cart-studio .cart-empty-state { padding:22px 15px; } .cart-studio .cart-item-name { font-size:20px; } }
@media(max-height:700px) { .gift-bag-emblem { margin-bottom:8px; width:34px; height:34px; } .gift-bag-emblem img { width:28px; height:28px; } .gift-bag-header { padding-bottom:12px; } .cart-studio .gift-bag-header h2 { font-size:30px; } .cart-studio .cart-empty-state { justify-content:flex-start; padding:20px 16px; } .cart-studio .cart-footer { padding:13px; } .gift-bag-keepsake strong { display:none; } }
@media(max-height:480px) { .cart-panel.cart-studio { overflow-y:auto; overscroll-behavior:contain; } .cart-studio .cart-items-list { flex:none; overflow:visible; } .cart-studio .cart-empty-state { flex:none; overflow:visible; } }
</style>
