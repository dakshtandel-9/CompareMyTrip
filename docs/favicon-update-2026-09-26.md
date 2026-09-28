# Favicon update

Replaced the embedded wordmark favicon with the yellow cloud-and-plane mark
from the supplied reference. The outside background and airplane cutout use
alpha transparency. The website header/footer logos and page content were not
changed. Deployment remains manual.

## Assets

- `src/app/icon.png`: 512 × 512 transparent favicon.
- `src/app/favicon.ico`: transparent 16, 32 and 48 pixel browser variants.
- `public/icons/cloud-plane-192.png` and `cloud-plane-512.png`: manifest icons.
- Removed the obsolete `src/app/icon.svg`; updated only icon entries in the manifest.

## Verification

Production build and manifest lint passed. Confirmed PNG transparency in the
outer background and airplane cutout, zero visible white pixels, and alpha in
all ICO sizes. Built homepage references the new PNG and ICO, not the old SVG.

## Image-edit provenance

Mode: built-in image generation/editing tool. PNG downscaling and ICO packaging
preserve the generated alpha channel.

Final edit prompt:

> Clean this favicon artwork. Preserve exactly its current cloud and airplane silhouette, position and transparent canvas. Remove every yellow speck and fragment INSIDE the airplane-shaped transparent hole, making that entire plane and its curved trail one continuous completely transparent cutout. Remove tiny stray pixels just outside the cloud. Flatten all remaining yellow pixels to uniform solid #FFC400 without shading or texture. Smooth antialiased edges. This is flat brand artwork: no gradient, no glow, no shadow, no outline, no white or black background. Keep real RGBA alpha transparency outside the cloud AND in the full airplane cutout. Return a square transparent PNG.
