# Current local prototype: implementation and validation

## What actually plays

Current is a standalone view beside Simulations in Soulfire's existing navigation. Soulfire keeps its global logo/wordmark; the feature uses a smaller wave emblem and a light cream/sage/gold daylight-river illustration authored as SVG. It is not integrated into any practice step.

All sound is generated locally with Web Audio. River, rain and breeze are **filtered-noise textures**, not field recordings. Warm tones use soft sine oscillators. Slow bounded gain movement adds texture; this is not a brainwave/clinical intervention or AI-composed music. No audio API, new account, paid generation service, model request or microphone is needed.

The recipe generator combines an explicit listening goal, preferred/excluded layers, texture presence, brightness, movement and a variation seed. Simple local sound-word matches such as “water” or “no rain” can affect preferences/exclusions; this is not semantic health assessment. Explicit exclusions win. Optional words influence only the local recipe/seed and are omitted from saved data. Mix titles come from a small deterministic experiential vocabulary, not private text.

Recipes include version, seed, goal, preferences/exclusions, name, layer gains/mutes, master volume, texture settings and duration. The same recipe reproduces the same parameterized mix in the same engine; audio-device sample-rate differences can change exact waveform samples. Regeneration changes the seed and sound buffer while remaining silent until Play.

## Controls and persistence

- Create/update and load are silent. Preview is 20 seconds; full mixes use a selected 1–60 minute duration. Play, pause, resume and immediate Stop are explicit controls.
- Volume and layer gains/mutes update the actual graph. Short fade-in and final two-second fade-out avoid abrupt transitions; Stop and navigation close the graph immediately rather than waiting through a long fade.
- Pausing releases sources and the AudioContext. Resume rebuilds the seeded texture at its retained elapsed offset and fades in. Tonal oscillator phase can restart; it is not a bit-perfect paused recording.
- Only checking **Keep this mix on this browser** and pressing **Save mix** persists the recipe. Saving is separate from conversation history and does not retain optional words. Up to 12 recipes are stored under `soulfire.current.mixes.v1` in unencrypted localStorage. Saved mixes can be loaded silently, edited, resaved or removed.
- Invalid/oversized stored data is left unchanged and blocks overwriting until an explicit Current-only reset. Storage failures report that saving failed; playback can still work. No unrelated storage keys are cleared.

## Lifecycle, privacy and audio coexistence

The engine owns its graph, seeded buffers, oscillators, gain/filter nodes, resume timeout and tick timer. Rapid stop/regeneration and a late browser unlock cannot revive a superseded graph. A four-second unlock timeout reports an actionable error and releases resources. Output is initially low, layer gains and master gain are bounded, transitions are smoothed and a compressor adds digital headroom. These controls do **not** certify ear-level dBA or an exposure dose; device volume and hardware still matter.

Opening Current ends voice/dictation through the existing navigation cleanup and unmounts welcome narration. The existing ambient player is paused while Current is open without changing its remembered preference. Opening another dialog pauses Current. Navigation/unmount disposes its graph; hidden/pagehide/interrupted audio pauses with explicit Resume and no automatic restart. Mutual exclusion is within this app/tab; independent tabs or other applications can still play audio.

Background playback is not guaranteed on mobile. Native mobile/Safari acceptance and subjective listening quality remain to be evaluated. The prototype does not silently restart after reload, create health scores, infer mood/diagnosis, use IP location, or send Current text/preferences to external services.

## Source locations

- `src/domain/current.ts`: bounded recipes, deterministic noise PRNG, explicit sound-word rules and saved-recipe validation.
- `src/infrastructure/current-audio.ts`: actual Web Audio graph and lifecycle.
- `src/components/CurrentPanel.tsx`: goal/preferences, editable player, saved recipes and accessible status/controls.
- `src/components/Soulfire.tsx`: standalone navigation and coexistence with existing audio activities.
- `tests/current.test.ts` and `tests/browser/current.spec.ts`: recipe/privacy validation and real synthetic browser audio tests.

## Verification

Production build, lint, typecheck and 144 unit tests passed. Current's 28 desktop/mobile browser checks cover real nonzero graph output, bounded levels and volume response, layer mute, pause/resume/stop, deterministic sound regeneration, timer/preview expiry, save/reload/delete, storage failures/corruption, denied/unavailable audio, unlock timeout and late completion, background/navigation cleanup, reduced motion, keyboard controls and voice/music coexistence. Provider calls and microphone input in coexistence tests are mocked; Current audio itself uses the browser's real audio graph and synthetic sources. No personal audio or paid call is used.

The affected existing welcome, voice, dictation, ambient-audio and navigation suites passed all 126 browser checks. Desktop/mobile captures were inspected using a shell-based image route after the local image viewer correlated with transient executor disconnections. No subjective listening, clinical benefit or comprehensive mobile-platform support is claimed.
