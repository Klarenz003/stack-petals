<template>
  <footer class="studio-footer">
    <div class="studio-footer-top">
      <div class="studio-footer-story"><span class="studio-eyebrow">Thoughtfully made. Beautifully connected.</span><h2>A little gift.<br />A lasting feeling.</h2><p>Handcrafted flowers with a personal digital keepsake. Made for the moments you want to hold onto.</p><RouterLink to="/products">Find something meaningful <span aria-hidden="true">↗</span></RouterLink></div>
      <nav aria-label="Explore"><h3>Explore</h3><RouterLink to="/products">The collection</RouterLink><RouterLink to="/about">Our story</RouterLink><RouterLink to="/process">The experience</RouterLink><RouterLink to="/gallery">In the studio</RouterLink></nav>
      <nav aria-label="Customer care"><h3>Here to help</h3><RouterLink to="/track">Track your order</RouterLink><RouterLink to="/receipt">Find your receipt</RouterLink><RouterLink to="/contact">Contact us</RouterLink><a href="mailto:stack.petals@gmail.com">Say hello by email ↗</a></nav>
    </div>
    <div class="studio-footer-bottom"><RouterLink class="studio-footer-wordmark" to="/">Stack Petals</RouterLink><p>© {{ new Date().getFullYear() }} Stack Petals. Where Code Meets Blooms.</p><span>Made with care, down to the last petal.</span></div>
  </footer>
</template>
