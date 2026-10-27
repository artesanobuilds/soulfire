# Ember meditation prototype

Ember is a standalone Soulfire feature beside Current and Simulations. It does not change the journey or integrate Step 11 yet. Soulfire remains the masterbrand. The accepted direction is warm inner light in a cream ceramic form, within the light app shell. The feature illustration is original SVG artwork, not the supplied concept image.

## What is implemented

Choose intention (space, attention, kindness, rest), 2–20 minutes, guidance density, natural breathing or a gentle optional invitation, stock warm voice or captions only, speech speed, voice volume, procedural warm tones/river or quiet, and sound volume. Create silently, review the entire transcript, then deliberately Begin. Pause/resume/stop, captions, elapsed progress, background interruption and a persistent Stop & ground control remain available. Rest has a non-alerting closing. This is bounded written guidance, not an open-ended model or clinical prescription.

Narration uses the existing offline Kokoro stock af_heart voice. The repository includes rendered local AAC clips, exact captions, durations and SHA256 hashes in `src/lib/ember-recording.json`; `scripts/prepare-ember-voice.py` reproduces them with the already-installed local tooling. No voice cloning, paid providers, microphone, new credentials or external user-data transmission. No subjective listening or efficacy claims. The 11 locally rendered clips total 105.2 seconds and are rearranged with explicit silence to fit the selected session, not synthesized anew from personal disclosures. The voice option is one stock voice plus captions; broader casting is future work.

`createEmberSession` distributes genuine silence between known-duration cues, with density affecting cue count. No timer-based fake speech. Native media events mark narration speaking and errors. Background sound reuses Current's Web Audio engine and is ducked under speech; settings do not imply certified ear-level loudness. Browser audio permission is required. Local voice asset failure is recoverable, retains the transcript and releases sound. Stop, changing preferences, navigation and unmount cancel asynchronous starts. Hidden tabs pause and require deliberate resume. Mobile/browser background restrictions vary.

Preferences are saved only after an explicit checkbox and Save action, to `soulfire.ember.preferences.v1` in this browser. No session history, private context, health intake, raw free text, or completed meditation record is saved. Load is silent; delete touches only Ember. Corrupt stored preferences remain unchanged and do not prevent a new practice. Storage failure is reported truthfully.

## Source and evidence boundaries

The complete supplied research is archived in `research/custom-meditation-research-library-copy.md`. It was read as design input, not verified clinical, legal or provider advice. In particular, its population breathing prescriptions, health-history screening, wearables, clinical scales, paid providers, regulatory claims and efficacy claims are not adopted. Natural breathing is the default, with no holds or forced depth. Users can keep eyes open, ignore cues, stop, orient externally and leave.

Library research `libfile_f5c7975be320819181e2a65df9c7baff`, backing `file_0000000069a881f5bba6701563223924`, filename `Custom Meditation Generator_ Research Foundation and Engineering Spec (October 2026).md`, reported 47,350 bytes / 385 lines. Supported materialization failed twice. The archived UTF-8 text was reconstructed from the complete Library read; size is also 47,350 bytes, but byte identity to the inaccessible original download is not independently verified. No source claims have been silently corrected.

Concept board `libfile_b2638ca91d7c81919659fc1a3637e2c7`, `soulfire-meditation-three-concepts.png`, third Ember panel. Supported download failed twice; Library read supplied only an asset pointer and OCR. Actual reference pixels could not be inspected on this executor. The implementation follows the explicitly approved cream ceramic / warm light / Soulfire shell direction; visual fidelity to the image remains unverified. Do not describe OCR as image inspection.

## Validation

See unit tests for reproducible schedules, density/intention behavior, no cue overlaps, bounds, strict persistence and exact narration/caption hashes. Browser tests exercise real local narration decoding/playback, cancellation, repeat stop/start, silence/timer, local asset failure, navigation, storage, reduced motion and mobile layout. Provider and microphone interactions in coexistence regressions are mocked. No new external generation service or live user microphone is tested.

The research text copy SHA256 is `55f0dc333a8c0894cba7beec187c485cb3e256787ee0151dcaa9b17e0293267b`. The rendered desktop and mobile implementation was visually inspected and fits without horizontal overflow; this does not substitute for inspecting the unavailable original concept pixels.

Final local verification: production build, lint, typecheck, 152 unit tests and all 176 affected desktop/mobile browser checks passed with no skips. A late native-play cancellation race and a deferred focus-stealing race were fixed before the final run. Additional native Web Audio smoke checks verified Current → Ember closes the prior graph and Ember Stop closes its sound graph. Browser tests decoded and played actual local Kokoro AAC; microphone/provider paths remained mocked. Clinical benefit, subjective pleasantness and comprehensive mobile OS background behavior were not evaluated.
