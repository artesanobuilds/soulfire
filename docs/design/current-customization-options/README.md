# Current customization options: two concepts (not shipped)

29 October 2026. **These are design concepts only.** No app layout change is authorized. Nothing here plays audio, calls a provider or uses the microphone.

## Problem

In the shipped Current page (see [current-music-review](../current-music-review/)), the selected Current's **Shape now** controls (Play, Volume, Brightness, Space) sit below the starter shelf. That's about 2,000 px down on desktop and further on mobile. People choose a piece and can't see that they can shape it.

Both concepts keep the approved Soulfire brand: ivory/paper backgrounds, sage/deep green, gold accents, Georgia headings with Arial body text, and the native river landscape (a static copy of `src/components/CurrentLandscape.tsx`). Piece names come from the real catalogue (`Evening Shore / Horizon`, `Off the Clock`, `A Moment for Me`, `Steady Shore`, `In My Own Words`, `A Quiet Place`).

## Concept A: catalogue + persistent selected player

- **Desktop (1440×1000):** a two-column grid. The left column holds the compact heading, goal chips and a two-up card catalogue. The right column has a sticky **selected-player panel** with river art, the name, Play/Stop, progress, the Volume/Brightness/Space sliders, listening time, the quiet-gap toggle, Save, and movements behind a disclosure. The selected card gets a "Selected" tag and a connector line to the panel.
- **Mobile (390×844):** the list scrolls under a fixed **player dock** showing the thumbnail, name and a round Play button, plus a full-width **"Shape sound · Volume · Brightness · Space"** button. That button opens a **bottom sheet** (`concept-a.html#sheet`) with every shaping control and a Done button.
- **Strengths:** you can browse and shape at the same time, comparing pieces without losing your settings. It's closest to today's structure (shelf plus Shape now card, just moved), so it's the cheaper build. The selected state is always visible.
- **Tradeoffs:** the desktop page is denser and the hero art shrinks to the panel header. On mobile the shaping controls are one tap away, not visible immediately. The dock takes about 130 px of the screen while browsing. The sticky panel needs care at short window heights (it should scroll internally below about 900 px).

## Concept B: focused "Now shaping" view

- **Desktop (1440×1000):** selecting a Current opens a calm single-purpose view. A return bar comes first (**Change Current**, a `Current / Wind down / Now shaping` breadcrumb, and previous/next neighbours). Below it is a large river scene with the name, a big Play button, a progress line and movement chips, next to a **Shape now** panel. That panel has larger Volume/Brightness/Space sliders with endpoint labels (Softer/Fuller, Warmer/Brighter, Close/Open), plus listening time, the quiet-gap toggle, Save and Edit movements.
- **Mobile (390×844):** **Change Current**, the art with the name and Play, and all three sliders fit on the first screen. Catalogue cards get an explicit **Shape** button (`concept-b.html#catalogue`) so the next step is obvious.
- **Strengths:** the controls are the most discoverable, because every primary control is visible right away on both sizes. It's emotionally strongest, since the river art becomes the "room" you're in. The sliders are easier to understand.
- **Tradeoffs:** it adds a view or route and back-navigation state (scroll position, selected goal). Comparing pieces means going back or using the neighbour arrows. The art is reused twice, which risks a heavier page, and the build is bigger.

## Recommendation

**Concept B for discoverability**, which is the problem we were asked to solve. It's the only option where Play and all three sliders appear in the first viewport on mobile without a tap. It should keep two parts of A: the neighbour arrows for comparing pieces, and a small dock-style "Now shaping: … ›" chip on the catalogue so a returning listener can get back to their Current.

Choose **A** if comparing pieces side by side while listening matters more than first-glance discoverability, or if build cost is the constraint.

## Files

- `src/concept-a.html`, `src/concept-b.html`: editable, responsive static HTML/CSS (open directly in a browser and resize to 390 px).
- `src/shared.css`: tokens mirrored from `app/globals.css`, plus concept styles.
- `src/river.svg`: static native SVG river art. No paid or external assets.
- `src/board.html`: concept board layout (`?c=a` or `?c=b`).
- `src/render.mjs`: renders the frames (1440×1000 and 390×844 at 2×) and both boards with Playwright and the system Chrome. It also writes `checks.json`, which for each frame records horizontal overflow (scrollWidth vs viewport, plus any element past the edges) and whether each primary control is fully inside the first viewport.
- Outputs once rendered: `concept-a-board.png`, `concept-b-board.png`, `src/frames/*.png`, `checks.json`.

Render from the repo root:

```
node docs/design/current-customization-options/src/render.mjs
```

## Verification status

Rendered and visually reviewed on 29 October 2026. All six desktop/mobile frames passed no-overflow and required-control first-viewport checks (`checks.json`). Option A mobile intentionally requires one visible Shape sound tap; the opened sheet was checked separately. Both full concept boards were inspected. Chrome ran with its browser sandbox enabled and without the self-XSS bypass flag. The earlier authoring-session restriction was resolved with this safer configuration; no browser security was disabled. No app layout was implemented or runtime restarted for these concepts.
