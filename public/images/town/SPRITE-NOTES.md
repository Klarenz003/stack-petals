# Transparent game atlas

`sprite-atlas-clean.png` is the game-ready transparent variant of the supplied
`sprite-atlas.png`. The original is retained unchanged.

Created with the built-in image editing tool. Prompt: remove panel backgrounds,
labels, borders and floor shadows; preserve pixel-art characters, pets, props,
white clothing and fur; output a transparent 1536 × 1024 PNG.

The edit shifted some artwork, so production crop coordinates were measured
again from alpha bounds rather than reusing the original illustration's grid.
Characters use a stable foot-aligned viewport. Right movement mirrors the left
profile. No multiply blending is used to conceal backgrounds.

Run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/list-town-sprite-bounds.ps1`
on Windows to inspect connected alpha bounds if the atlas is replaced.
