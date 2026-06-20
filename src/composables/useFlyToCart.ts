// src/composables/useFlyToCart.ts

export function useFlyToCart() {
  function flyToCart(event: MouseEvent) {
    const btn = event?.currentTarget as HTMLElement | null
    const cartBtn = document.querySelector('.cart-btn') as HTMLElement | null
    if (!btn || !cartBtn) return

    const srcRect  = btn.getBoundingClientRect()
    const destRect = cartBtn.getBoundingClientRect()

    const petal = document.createElement('div')
    petal.style.cssText = `
      position:fixed; pointer-events:none; z-index:9999;
      width:22px; height:36px; border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;
      background:rgba(216,165,167,0.9);
      box-shadow:0 2px 8px rgba(216,165,167,0.4);
      left:${srcRect.left + srcRect.width / 2}px;
      top:${srcRect.top + srcRect.height / 2}px;
      transform:translate(-50%,-50%);
    `
    document.body.appendChild(petal)

    const startX = srcRect.left + srcRect.width  / 2
    const startY = srcRect.top  + srcRect.height / 2
    const endX   = destRect.left + destRect.width  / 2
    const endY   = destRect.top  + destRect.height / 2
    const dx = endX - startX
    const dy = endY - startY
    const duration = 650
    const start = performance.now()

    const animate = (now: number) => {
      const p    = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      const x    = startX + dx * ease
      const y    = startY + dy * ease - Math.sin(p * Math.PI) * 120
      const alpha = p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1

      petal.style.left      = `${x}px`
      petal.style.top       = `${y}px`
      petal.style.opacity   = String(alpha)
      petal.style.transform = `translate(-50%,-50%) rotate(${p * 360}deg) scale(${1 - p * 0.5})`

      if (p < 1) {
        requestAnimationFrame(animate)
      } else {
        petal.remove()
        cartBtn.classList.add('cart-bounce')
        cartBtn.addEventListener('animationend', () => cartBtn.classList.remove('cart-bounce'), { once: true })
      }
    }
    requestAnimationFrame(animate)
  }

  return { flyToCart }
}
