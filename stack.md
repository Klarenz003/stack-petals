# Stack Petals project guide

Where Code Meets Blooms. A little gift. A lasting feeling.

Last reviewed: 2026-10-04.

This is the main guide for the **stack-petals customer website repository**.
It documents the code, assets, design conventions, and maintenance workflow.
It is not application code or an automatically enforced agent instruction file.
Update it when the project changes; the linked source files remain authoritative.

## Project boundaries

- This repository contains the customer storefront, checkout, personalized letter
  experiences, gift-code flows, and Stack Petals Town demo.
- The admin application is a separate repository, `Admin_StackOverPetal`.
- The investor portal is a separate repository, `Investor_Portal(StackPetals)`.
- Pushing this repository does not push or deploy those other applications.
- Supabase configuration, applied migrations, deployed functions, and hosting
  configuration are separate from the frontend Git commit.

## Technology

Vue 3, TypeScript, Vite, Pinia, and Vue Router power the frontend. Supabase
provides the backend client, RPCs, and related services. The project also uses
GSAP, Anime.js, Phosphor Icons, QRCode, and Vitest. See [package.json](package.json)
for the installed dependencies and commands.

## Local development

Install the dependencies with `npm ci` when using the committed lockfile. Copy
[.env.example](.env.example) to a local `.env` and provide the required values.

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL; required by the frontend client |
| `VITE_SUPABASE_ANON_KEY` | Browser-safe Supabase anon key; required by the client |
| `VITE_API_BASE_URL` | Optional configuration listed in the environment template |
| `VITE_DONATION_URL` | Optional donation URL listed in the environment template |

The Supabase client throws if its URL or anon key is missing. A local frontend
still needs a correctly configured backend for data-dependent features.
Do not copy real credentials into examples or documentation.

```sh
npm run dev
npm run type-check
npm test
npm run build
npm run preview
```

On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.
Vite normally starts on port 5173; use the URL it prints if that port is occupied.
The production build goes into `dist/`.

## Repository map

| Location | Responsibility |
| --- | --- |
| [src/main.ts](src/main.ts) | App bootstrapping, Pinia, router, global CSS imports |
| [src/App.vue](src/App.vue) | Storefront shell, shared overlays and code-pattern preference |
| [src/router/index.ts](src/router/index.ts) | Routes, lazy page loading, page scroll behavior |
| `src/pages/` | Storefront, order lookup, letters, gift flows, Town demo |
| `src/components/` | Reusable UI, checkout, photo uploads, letters and Town actors |
| `src/stores/` | Cart, products, market and product-preview state |
| `src/composables/` | Shared interaction, animation and preference behavior |
| `src/services/` | Order lookup and theme resolution |
| `src/themes/` | Letter theme definitions |
| `src/types/` | Shared TypeScript models |
| `src/utils/` | Letter, image and game helpers; colocated tests |
| `src/assets/` | Storefront, checkout, letter and Town styles |
| `public/images/` | Public brand, product, letter and Town artwork |
| `public/audio/` | Public audio assets, including the Town soundtrack |
| `public/videos/` | Letter clips and the rendered brand film |
| `scripts/` | Asset inspection, soundtrack generation and film rendering |
| `supabase/migrations/` | Versioned database changes |
| `supabase/functions/` | Edge functions and their setup instructions |

## Routes

| Route | Experience |
| --- | --- |
| `/` | Homepage and interactive bouquet/phone demonstration |
| `/products` | Searchable and filterable collection |
| `/bouquets` | Redirect to `/products` |
| `/about`, `/process` | Brand story and gift process |
| `/gallery`, `/reviews`, `/contact` | Customer-facing information pages |
| `/track`, `/receipt` | Customer order and receipt lookup |
| `/letter/:id` | Personalized letter experience |
| `/gift/claim/:token`, `/gift/create/:token` | Gift claim and composer flows |
| `/letter-v2/claim/:token`, `/letter-v2/create/:token` | V2 gift claim and composer flows |
| `/letter-v2/:id` | V2 letter experience |
| `/letter-test` | Letter experience testing page |
| `/town-preview` | Stack Petals Town demo |

Letter, gift, and Town routes use `hideNav` route metadata. The router currently
includes the demo/testing routes; do not assume they are access-controlled simply
because they are not in navigation.

## Core features and ownership

### Storefront, cart and checkout

[ProductCard.vue](src/components/ProductCard.vue) owns the product card markup.
[products.ts](src/stores/products.ts) loads storefront products through Supabase,
including pricing and 360-view capability data. [cart.ts](src/stores/cart.ts)
contains cart and checkout behavior, stock reservation handling, checkout recovery,
and order submission logic.

Use [CartSidebar.vue](src/components/CartSidebar.vue) for the gift-bag drawer and
[CheckoutModal.vue](src/components/CheckoutModal.vue) for checkout. Keep long cart
lists scrollable without overlapping the subtotal or action buttons.
[CatalogSortMenu.vue](src/components/CatalogSortMenu.vue) provides the themed sort
control. [CheckoutBouquetSelector.vue](src/components/CheckoutBouquetSelector.vue)
is the entry point for bouquet selection in the 360 experience.

### Letters and gift codes

Start with [LetterPage.vue](src/pages/LetterPage.vue),
[LetterV2Page.vue](src/pages/LetterV2Page.vue), the gift pages in `src/pages/`, and
[StackPetalsLetterExperience.vue](src/components/StackPetalsLetterExperience.vue).
Use the shared [MemoryPhotoUpload.vue](src/components/MemoryPhotoUpload.vue) for
memory-photo uploading/cropping and [GiftQrHeader.vue](src/components/GiftQrHeader.vue)
for the gift header treatment.

Preserve these product requirements when changing letter flows:

- Checkout previews should reflect the customer's actual entered content and choices.
- Select only one purchased bouquet for a letter's 360-view experience.
- Treat product eligibility and uploaded 360 assets as separate conditions.
- For standalone letters, do not show an empty 360 viewer when no assets exist.
- Preserve the original theme's established bouquet treatment.
- Keep composer defaults, including Chapter 2, consistent with the relevant schema.

These are maintenance requirements, not a claim that every theme and backend
configuration has been verified. Test the affected flows after changes.

### Stack Petals Town

[TownPreviewPage.vue](src/pages/TownPreviewPage.vue), `src/components/town/`,
`src/utils/town*.ts`, and the Town CSS files contain the demo. Preserve directional
walking/running, diagonal movement, held-item poses, idle motion and pet positioning.
Keep sprite frames clipped so the full atlas cannot flash during pose changes.

Read the existing art notes before changing sprite mappings:

- [Character art](src/components/town/CHARACTER-ART.md)
- [Approved art](public/images/town/APPROVED-ART.md)
- [Sprite notes](public/images/town/SPRITE-NOTES.md)

## Visual and interaction conventions

Keep the cream, blush, and sage palette, editorial serif headings, readable body
text, rounded surfaces, generous spacing, and handcrafted floral identity.
Check contrast in normal, hover, focus, selected, and disabled states.

- **Pixel art:** Town characters, game world and approved sprite assets.
- **Phosphor Icons:** Interface controls, HUD, navigation and status indicators.
- **Brand assets:** Existing floral identity and artwork; preserve their proportions.
- **Motion:** GSAP or the existing animation mechanisms where appropriate.
- **Layout:** Responsive CSS; keep content clear of fixed controls and overlays.

Do not use Unicode emoji as UI icons or particles. Phosphor exports in this
project use the `Ph` prefix, for example `PhFlower`, `PhHeart`, and `PhArrowRight`.
Use `duotone` for primary UI, `regular` for small navigation, `fill` for selected
or completed states, and `bold` for important actions.

Current styling order matters: [main.css](src/assets/main.css) loads before
[storefront-studio.css](src/assets/storefront-studio.css). Inspect both files and
component styles before adding overrides. Avoid broad selectors that accidentally
change letter, Town, cart, or modal layouts. `darkmode.css` is not imported by
`src/main.ts`; its existence does not mean dark mode is enabled.

### Responsive behavior and accessibility

- Check at least 320, 390, 768 and 1440 pixel widths, plus a short landscape viewport.
- Keep the homepage phone dock clear of the bouquet and its drag instruction.
- Mobile navigation must remain visible after scrolling and restore page scrolling
  when closed; support Escape and keyboard focus behavior.
- On phones up to 700px wide, the code-pattern toggle lives in the navigation menu.
  Wider screens retain the bottom-left floating toggle.
- Preserve reduced-motion behavior, readable text, keyboard access and browser zoom.
- Do not hide overflowing content merely to remove a visible scrollbar.

## Brand film and audio

The brand film lives at `public/videos/stack-petals-brand-film.mp4`, with its
editable HTML source and poster beside it. See
[the film guide](public/videos/STACK-PETALS-BRAND-FILM.md) and
[render-brand-film.mjs](scripts/render-brand-film.mjs) for rendering instructions.
The film QR graphic contains brand text, not a live gift token.

The 60-second project showcase uses this guide as its storyboard reference. It
combines actual customer-facing screen captures with Town gameplay, demo checkout
data, existing memory/360 clips, and original music. See
[the showcase guide](public/videos/STACK-PETALS-PROJECT-SHOWCASE.md) for the timeline,
capture safeguards, and reproduction steps. It lives at
`public/videos/stack-petals-project-showcase.mp4` and does not confirm production
backend behavior or deployment status.

The Town soundtrack generator is
[generate-town-soundtrack.mjs](scripts/generate-town-soundtrack.mjs).
Do not overwrite approved generated assets without preserving a recoverable copy.

## Backend, security and deployment

Supabase Edge functions include `send-order-email`, `stack-petals-chat`, and
`create-investor-access`. Inspect each function's code/setup instructions before
deploying it. Never put a service-role key or private API key in `VITE_*` variables:
Vite exposes those values to the browser. Enforce data access on the backend.

Apply database migrations deliberately, in order, to the intended Supabase project.
Committing a migration does not apply it. Do not edit already-applied migration
history to make a new schema change; add a new migration instead.

Frontend hosting is documented for Vercel: build with `npm run build`, output
directory `dist`, and configure the required environment variables.
[vercel.json](vercel.json) provides SPA rewrites. Verify nested routes and static
video URLs after deployment. A successful Git push is not confirmation that a
hosting deployment or admin application is live.

Real keys must not appear in examples, Markdown, source files, or committed history.
An exposed key must be revoked/rotated at its provider; removing it from Git does
not deactivate it. Local history-recovery references can still contain old secrets:
never publish a recovery branch or push all refs without reviewing them.

## Change and release checklist

1. Inspect existing changes; preserve unrelated work and approved assets.
2. Make focused changes in the relevant feature and update this guide when needed.
3. Run type checks, the relevant tests, and the production build.
4. Check the affected pages on phones and desktop, including interactive states.
5. Check previews against actual form values and backend asset availability.
6. Review the diff for accidental data, credentials, or unnecessary large files.
7. Commit and push only when requested; confirm the intended repository and branch.
8. Verify deployment separately from Git and backend migration/function changes.

The most recent full test run before this documentation update passed 91 tests
across 27 files. This is a snapshot, not a guarantee about future changes.
