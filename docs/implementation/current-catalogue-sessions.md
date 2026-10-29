# Current catalogue and composed sessions — 29 October 2026

This extends the first goal-first prototype documented in `current-music.md`. That earlier report is retained as dated evidence, not the present availability limit. No clinical efficacy or subjective musical-quality result is claimed.

## What is actually available

The full eligible catalogue now has 36 distinct, real ACE-Step 1.5 Turbo pieces: two concepts for each of 18 adult source areas. All 36 are 30 seconds, generated from their individual approved concept, taste and nonclinical character briefs. The four youth/crisis concepts remain in the design archive but are ineligible for generation. A condition is not used to infer a person's musical taste, and the public flow asks for everyday goals and preferences rather than diagnosis.

`evidence/current-seed-coverage.json` records actual requests, seeds, pinned model metadata, output measurements and generation time. `current-catalogue-integrity.json` independently verifies every source WAV hash, prepared bed hash, distinct decoded-PCM hash, technical gate and two-per-area count. `current-catalogue-browser-decode.json` verifies all 36 real files decode to finite, nonzero audio in the browser. Audio remains outside Git in the established local model store. These are technically screened previews; human audition for musical adherence, unwanted voice-like artifacts and pleasantness remains necessary.

## Custom creation and selection

Advanced controls select two or three alternatives or movements, 30/60/90 seconds each, a sound palette, exclusions and a steady/gently-shift preference. The usual interface keeps these behind the desired goal and taste. A single bounded worker prepares candidates sequentially; there is an eight-minute batch deadline, cancellation, unique seeds, deduplication by PCM, actual technical rejection and honest partial-failure reporting. Compare mode sorts by measured signal/headroom fit, not a musical or wellness score. Session mode retains opening/developing/closing order. The user explicitly previews and chooses; a completed job never starts audio.

A real three-candidate session produced three distinct 90-second pieces (270 seconds unique PCM). Full evidence is in `evidence/current-real-multicandidate.json`; measured playback and resource teardown are in `evidence/current-real-session-playback.json`. New custom sessions request C major consistently as an engineering compatibility aid, not a key-specific health claim. Model conditioning remains approximate. Existing catalogue provenance remains unchanged.

## Assembly, live shaping and fallback

Up to three distinct pieces can form a saved session. Approximate key/BPM confidence and loudness continuity decide whether a short crossfade is allowed. Missing or inconsistent estimates select a gentle fade and quiet gap; unknown tempo does not silently pass. The real 270-second example has insufficient tempo confidence and correctly uses that quiet transition. The sequence loops when its chosen listening duration exceeds available music. This is scheduled reuse of actual music, not infinite composition or a guaranteed seamless continuation. Independent synchronized stems are not available.

Live volume, bounded brightness and space remain deterministic DSP. Stop does not depend on generation success. Fetch/decode deadlines, decoded-memory limits, stale-version guards, future-only scheduling, navigation/audio ownership, timer and teardown prevent overlapping or revived audio. Digital loudness/true peak are measured; browser gain cannot certify ear sound pressure.

## Persistence and privacy

Default navigation cancels a pending job. An explicit “Keep preparing when I leave Current” choice allows background work without playback; only its UUID and age are kept in sessionStorage. Terminal manifests are atomically stored locally with restrictive file permissions, strict validation and a 200-manifest limit. Reloading/revisiting restores without resubmitting. Server restart does not resurrect unfinished model processes. Local bookmarks preserve exact piece IDs, PCM hashes, order, transition and settings; missing audio is not replaced silently. Freeform feeling text is excluded from prompts and saved records.

The measured total model-result store, including earlier comparison work and the new real session, is about 1.26 GiB, below the existing 2 GiB budget; generation retains the 50 GiB free-disk floor. Model weights, generated WAVs, credentials, personal history and runtime databases are intentionally excluded from Git. No new model, paid service, Stable agreement or external health-data sharing was introduced. Music Lab remains archived in source/history rather than user navigation. Existing Current Classic, Ember, welcome and live voice remain supported.

## Validation and remaining limits

Unit tests exercise catalogue eligibility, prompt differences, technical gates, compatibility uncertainty, partial failures, duplicate PCM, pre-ack cancellation, persistence and bounded jobs. Browser tests exercise real Web Audio buffers, alternatives, assembly, exact save/reload identity, background recovery without repeat POST, timer, audio ownership, navigation, reduced motion and mobile layout. Real generated-file decoding and the actual three-piece playback are tested separately from mocked provider/job regressions. Final aggregate results are recorded in the companion validation report.

No human listener has approved all catalogue pieces, no clinical matching or treatment outcome is validated, and no completed head-to-head model comparison is implied. Objective gates cannot reliably prove no vocal leakage or correct instrumentation. Catalogue previews are short; longer sessions repeat or combine finite prepared material. New generation latency varies with hardware load and may fail; existing checked music and quiet remain available.

Final checks: 248/248 full desktop/mobile browser checks on the completion-race-fixed build; 38/38 Current desktop/mobile checks after the final loop-closure guard; 199/199 unit tests; lint with zero warnings, typecheck and production build passed.
