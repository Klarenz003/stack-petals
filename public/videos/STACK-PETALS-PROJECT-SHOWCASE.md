# Stack Petals project showcase

A 60-second portrait showcase planned from [stack.md](../../stack.md): the actual
customer-facing website, personalized letter experience, and Stack Petals Town.

## Deliverables

- `stack-petals-project-showcase.mp4`: 1080 x 1920, H.264 video with AAC instrumental audio.
- `stack-petals-project-showcase-poster.png`: closing brand frame.
- `stack-petals-project-showcase.html`: editable animation and interactive preview.
- `showcase-assets/`: captured storefront screenshots and a real Town gameplay clip.

The film uses animated screen captures, existing photo-memory/360 clips, native
Canvas motion, and an original synthesized soundtrack. It is not a recording of
every feature operating against a production backend and is not a deployment check.

## Storyboard

| Time | Sequence |
| --- | --- |
| 0-6s | Floral identity and the code-meets-blooms concept |
| 6-12s | Actual homepage, website identity and digital keepsake introduction |
| 12-18s | Product collection and gift bag |
| 18-24s | Checkout and letter theme/bouquet selection |
| 24-30s | The actual cinematic letter invitation |
| 30-36s | Chapter 2 and existing photo-memory clip |
| 36-42s | Music waveform and existing 360 bouquet clip |
| 42-55s | Real Town gameplay, companions and held-item activities |
| 55-60s | Brand finale: A little gift. A lasting feeling. |

## Capture safety

[capture-project-showcase.mjs](../../scripts/capture-project-showcase.mjs) uses a
dedicated Chrome profile and synthetic products/checkout values. It intercepts
Supabase REST, Edge function and storage requests. No real orders are submitted;
no admin, investor, payment proof or customer records are captured. Product names,
prices and cart values shown in the showcase are demo fixtures, not live inventory.
The cinematic letter uses the repository's local test route.

The capture script clears storage only in its browser session. Always use a
dedicated profile; do not point it at your normal logged-in browser.

## Reproduce

Start Vite on port 5181, or set `FILM_BASE_URL` to its actual address. Start a
dedicated Chrome instance with:

```text
--headless=new
--disable-gpu
--disable-background-timer-throttling
--disable-backgrounding-occluded-windows
--disable-renderer-backgrounding
--autoplay-policy=no-user-gesture-required
--remote-debugging-port=9243
--user-data-dir=<a dedicated temporary profile>
```

Then run:

```sh
node scripts/capture-project-showcase.mjs
node scripts/render-brand-film.mjs preview --showcase
node scripts/render-brand-film.mjs render --showcase
node scripts/render-brand-film.mjs verify --showcase
```

Each command closes its dedicated Chrome instance, so relaunch it between commands.
The capture step regenerates its demo screenshots/clip. Preview frames go to the
system temporary directory; the closing poster is written beside the MP4. Rendering
refuses to overwrite an existing final export. Preserve previous versions before
producing a new one.

The showcase HTML shares the original brand film's drawing toolkit. Keep
`stack-petals-brand-film.html` available beside it. Final MP4 playback is independent
of the HTML sources and external fonts. No application pages are changed to embed,
autoplay, or promote the showcase automatically.
