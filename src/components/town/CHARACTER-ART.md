# Town SVG actors

The active renderer is now `TownChibiCharacter.vue`: SVG crop viewports around
the user-approved generated PNG (`chibi-poses-approved.png`), not vector tracing.
Generated holding/diagonal poses retain their original detail and transparency.
Verified cardinal walk/run frames still come from the cleaned original atlas.
Missing rear holding poses use a rear-facing body with an occluded SVG prop;
they do not show a front-facing holding sprite while travelling away.

Breathing is foot-anchored and all animation stops with `motion=false` or the
system reduced-motion preference. This concept sheet is not a complete
frame-by-frame walk/run animation atlas. `townApprovedArt.ts` documents selection
and crop boundaries. The prior code-native drawing remains below as a retained
alternative, but is not selected by `TownActor.vue`.

`TownPixelCharacter.vue` draws the game actors as transparent, code-native pixel
SVGs. Cardinal, profile, front-diagonal and rear-diagonal views share a palette
but have separate face visibility and projection. Left views mirror right views.
`TownHeldItem.vue` provides reusable laptop, bouquet, letter and watering-can SVGs.
Arms, hands and props move together; back views occlude the item behind the body.

Idle motion affects the upper body only, leaving the feet and world coordinates
fixed. Eyes blink occasionally. Walking alternates the legs; sprinting increases
the cadence. `motion=false` and the system reduced-motion preference disable all
actor animation. The world disables actor motion when paused or under a dialog.

The original PNG atlas remains available for portraits, props and legacy sprite
previews; it has not been overwritten or deleted.
