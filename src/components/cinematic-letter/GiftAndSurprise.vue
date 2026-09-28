<template>
  <!-- 3D spinning box, 240-frame product spinner, music and surprise modal. -->
<button aria-label="Play background music" aria-pressed="false" class="music-pill" id="music-toggle" title="Play music" type="button">
<span aria-hidden="true" class="music-pill__icon">&#9835;</span>
</button>
<dialog aria-labelledby="gift-dialog-heading" class="gift-dialog" id="gift-dialog">
<div class="gift-dialog__panel gift-experience" id="gift-dialog-panel">
<button aria-label="Close gift experience" class="dialog-close" id="gift-dialog-close" type="button">&times;</button>
<span class="eyebrow gift-experience__eyebrow">THE LITTLE SURPRISE &middot; STACK PETALS</span>
<h2 id="gift-dialog-heading">Something <em>beautiful</em> inside.</h2>
<p class="gift-experience__subtitle" id="gift-experience-subtitle">The original spinning gift box, with a surprise waiting inside.</p>
<div aria-label="Spinning three dimensional gift box. Drag left and right to rotate the box, then select Open the gift to see the 360 degree product." class="gift-stage" id="gift-stage">
<div aria-hidden="true" class="gift-stage__halo"></div>
<div aria-hidden="true" class="gift-stage__shimmer">&#10022;</div>
<div aria-hidden="true" class="retro-box-plinth"></div>
<div class="gift-scene" id="gift-scene">
<div aria-hidden="true" class="gift-cube" id="gift-cube">
<div class="gift-face gift-face--front gift-wall gift-wall--front"><span>for you</span></div>
<div class="gift-face gift-face--back gift-wall gift-wall--back"><span>with love</span></div>
<div class="gift-face gift-face--right gift-wall gift-wall--right"><span>&#9825;</span></div>
<div class="gift-face gift-face--left gift-wall gift-wall--left"><span>always</span></div>
<div class="gift-face gift-face--bottom gift-wall gift-wall--bottom"><span>made with love</span></div>
<div aria-hidden="true" class="gift-interior-floor"></div>
<div aria-hidden="true" class="gift-lid3d">
<div class="gift-face gift-face--top"><span>open me</span></div>
<div class="gift-lid-skirt gift-lid-skirt--front"></div>
<div class="gift-lid-skirt gift-lid-skirt--back"></div>
<div class="gift-lid-skirt gift-lid-skirt--left"></div>
<div class="gift-lid-skirt gift-lid-skirt--right"></div>
<div class="gift-bow">
<span class="gift-bow__loop gift-bow__loop--left"></span>
<span class="gift-bow__loop gift-bow__loop--right"></span>
<span class="gift-bow__knot"></span>
<span class="gift-bow__tail gift-bow__tail--left"></span>
<span class="gift-bow__tail gift-bow__tail--right"></span>
</div>
</div>
</div>
</div>
<div class="gift-product" id="gift-product">
<div class="gift-product__halo">
</div>
<img alt="A sample illustrated flower bouquet. Replace this 240-frame preview with photos of the actual gift." decoding="async" draggable="false" height="327" id="gift-frame" width="278"/>
<span class="gift-product__sparkle gift-product__sparkle--one">&#10022;</span>
<span class="gift-product__sparkle gift-product__sparkle--two">&#10022;</span>
</div>
<div aria-hidden="true" class="gift-box-hint" id="gift-box-hint">&harr; &nbsp; Drag to spin the box &middot; open it for your surprise</div>
<div aria-hidden="true" class="gift-stage__petals" id="gift-stage-petals"></div>
<button class="gift-unseal" id="gift-unseal" type="button"><span aria-hidden="true">&#10047;</span> Open the gift <span aria-hidden="true">&nearrow;</span></button>
<div class="gift-stage__instructions" hidden="" id="gift-stage-instructions">&harr; &nbsp; Drag or swipe to rotate your product</div>
<div aria-live="off" class="gift-frame-counter" hidden="" id="gift-frame-counter"><span id="gift-current-frame">001</span><span class="gift-frame-counter__slash">/</span><span id="gift-frame-total">240</span> <span class="gift-frame-counter__label">FRAMES</span></div>
</div>
<div class="gift-product-meta" id="gift-product-meta"><span class="gift-product-meta__marker">&#10022;</span> <span id="gift-product-label">A surprise awaits inside this ribboned box</span></div>
<div class="gift-scrubber" hidden="" id="gift-scrubber">
<button aria-label="Previous product frame" class="gift-step" id="gift-prev-frame" type="button">&lsaquo;</button>
<input aria-label="Rotate product by image frame" id="gift-frame-slider" max="239" min="0" step="1" type="range" value="0"/>
<button aria-label="Next product frame" class="gift-step" id="gift-next-frame" type="button">&rsaquo;</button>
</div>
<div class="gift-dialog__actions gift-dialog__actions--new">
<button class="gift-action gift-action--soft" hidden="" id="gift-close-box" type="button">&curvearrowleft; &nbsp; Close the box</button>
<button aria-pressed="false" class="gift-action" disabled id="gift-spin-toggle" type="button">&orarr; &nbsp; Auto rotate</button>
<button class="gift-action gift-action--ghost" disabled id="gift-reset-view" type="button">&#10227;&nbsp; Reset view</button>
</div>
<details class="gift-upload" id="gift-upload">
<summary>Creator tools &middot; Replace sample with your gift photos <span aria-hidden="true">&#8994;</span></summary>
<div class="gift-upload__content">
<p>Choose your 200&ndash;300 product photos captured in order around one complete 360&deg; turn. The viewer works with JPG, PNG, AVIF or WebP.</p>
<div class="gift-upload__actions">
<label class="gift-upload__label" for="gift-folder-input">Choose a photo folder</label>
<input accept="image/*" directory id="gift-folder-input" multiple type="file" webkitdirectory/>
<label class="gift-upload__label gift-upload__label--soft" for="gift-files-input">Or select images</label>
<input accept="image/*" id="gift-files-input" multiple type="file"/>
</div>
<p class="gift-upload__status" id="gift-load-status" role="status">Local uploads are for preview only. To publish your own photos, use the included packager script or set GIFT.product360.mode to 'folder'.</p>
</div>
</details>
</div>
</dialog>
<dialog aria-labelledby="surprise-heading" class="surprise-dialog" id="surprise-dialog">
<div class="surprise-card" id="surprise-card">
<button aria-label="Close the final note" class="dialog-close" id="dialog-close" type="button">&times;</button>
<svg aria-hidden="true" class="occasion-art occasion-art--closing" viewBox="0 0 100 100"><use href="#motif-romance" id="closing-motif"></use></svg>
<span class="eyebrow">THE MOST IMPORTANT PART</span>
<h2 id="surprise-heading">I'm so glad<br>there is <em>you.</em></br></h2>
<p id="final-message">No grand occasion needed. Just a little reminder that having you in my life is a gift all on its own.</p>
<div class="surprise-card__signature" data-sender="">your favorite person</div>
<div aria-label="Stack Petals" class="surprise-brand">
<a aria-label="Visit Stack Petals online shop" class="surprise-brand__logo-link" href="https://stackoverpetals.shop/" rel="noopener noreferrer" target="_blank">
<img alt="Stack Petals logo" class="surprise-brand__logo" data-stack-petals-logo=""/>
</a>
<div class="surprise-brand__name">Stack Petals</div>
<div class="surprise-brand__tagline">Engineered with Precision, Crafted with Love.</div>
<div class="surprise-brand__actions">
<a class="surprise-brand__visit" href="https://stackoverpetals.shop/" rel="noopener noreferrer" target="_blank">Visit StackOverPetals.shop &nearrow;</a>
<button class="surprise-brand__share" id="share-shop-button" type="button">Share our shop &nearrow;</button>
</div>
<span aria-live="polite" class="share-feedback" id="shop-share-feedback" role="status"></span>
</div>
<button class="replay-button" id="replay-button" type="button">EXPERIENCE IT ALL AGAIN &olarr;</button>
</div>
</dialog>
</template>
