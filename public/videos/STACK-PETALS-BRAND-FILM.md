# Stack Petals — Where Code Meets Blooms

30-second portrait motion-graphics brand film, created with the repository's floral
brand assets, procedural Canvas animation, existing memory/360° clips, and an
original synthesized instrumental. No customer data or third-party audio samples.

- `stack-petals-brand-film.mp4`: 1080 × 1920 portrait; H.264 video and AAC audio.
- `stack-petals-brand-film-poster.png`: closing brand frame.
- `stack-petals-brand-film.html`: editable animation source and interactive preview.

Open `/videos/stack-petals-brand-film.mp4` on the development server to watch the
export, or `/videos/stack-petals-brand-film.html` to play the source with sound.
The QR animation contains brand text, not a live customer gift link.

## Timeline

0–5: circuit stems bloom into the floral brand mark.
5–12: handcrafted bouquet detail, ribbon motion, phone scanning a QR keepsake.
12–23: animated envelope, memory cards, soundtrack waveform, existing 360° clip.
23–30: floral identity and “A little gift. A lasting feeling.”

## Re-render

Start Vite and headless Chrome with `--autoplay-policy=no-user-gesture-required`
and `--remote-debugging-port=9243`, then run:

```sh
node scripts/render-brand-film.mjs preview
node scripts/render-brand-film.mjs render
node scripts/render-brand-film.mjs verify
```

The renderer defaults to Vite port 5181. Set `FILM_BASE_URL` for a different port.
Each command closes the Chrome instance after completion. Rendering needs a
Chromium version supporting MP4 MediaRecorder. Google Fonts are loaded before
rendering; the source includes Georgia/Arial fallback fonts. Preview stills go
to the system temporary directory. Existing exports are never overwritten.

No website pages are changed to embed or autoplay the film.
