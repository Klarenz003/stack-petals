# One last surprise

Gift QR composers can optionally add an 80-character title, a 600-character final
note and one cropped photo (only when the QR permits photo uploads).
Recipients unfold the card at the end of
the letter without a second password prompt. Skipped surprises do not render a
placeholder gift card for Gift QR letters.

Photo bytes stay inline in letters.backgrounds.final_surprise, not in public
storage. Existing letter password/RLS and remembered-browser authorization protect
the whole object. The secure publishing overload validates photo format and size,
capability and text limits, then delegates to the existing password-protected RPC.
Old publishing clients remain compatible.

Apply supabase/migrations/202610060001_letter_final_surprise.sql after the private
gift letters migration, then 202610060002_letter_note_customization.sql before
deploying the new frontend. No live migration was
applied by this local implementation. Existing published letters are unchanged.

The composer has three steps on the same route: Your letter (theme and words),
The little things (notes and optional memories), and The finishing touch
(optional surprise and password). Back/Continue retains
all fields in memory, including cropped photos and icon selections. Passwords
are not persisted to draft storage. A browser refresh still clears this draft.

After publishing or changing the password, the sender can copy it, use the native
share sheet, or save a private text file. On file-sharing-capable phones Save
password opens a file share/save sheet; other browsers download a .txt file.
Share text contains no QR URL or activation/composer credentials. The password
is retained only in component memory until clearing or leaving the page, never
in receipt storage or a URL. The sender is warned that saved files and clipboard
copies contain the readable password. After a refresh, use the composer password
change flow if the sender did not save it. No server-side password recovery.

Chapter two also supports six editable titles (36 characters), body notes (60
characters) and Sun/Flower/Sparkles/Heart/Smile/Care artwork choices, matching
checkout. Six complete note messages are prefilled; blank bodies fall back to the
same suggested words. Each card offers Use suggested words to restore its body
without changing the title or artwork. Empty titles use the existing defaults. Labels and
artwork selections are stored in the protected letter backgrounds metadata.

Checks: npm test; npm run build; scripts/check-private-letter-db.cjs with isolated
embedded-postgres dependencies; scripts/check-letter-surprise.cjs with Vite on
5183 and isolated Chrome CDP on 9243. Browser checks mock backend requests.

Temporary demo pages, sample passwords and full-letter preview controls have been
removed. Only the inline surprise-card preview remains: it uses the actual title,
message and photo after a final note is entered, with no sample content.
The actual composer is /letter-v2/create/:token after card activation.
Checkout previews and unrelated Town features are unchanged.
