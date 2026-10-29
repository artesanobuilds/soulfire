# Current music prototype - 29 October 2026

## User flow

Open Current next to Simulations. Choose a desired direction and optional sound taste, then select a real measured piece to Shape now or Create a new Current. New compositions use the installed offline ACE-Step 1.5 Turbo runtime, a bounded structured recipe and one cancellable worker. No health history, diagnosis or raw feeling note enters the model prompt. Goal, taste, exclusions and steady/gently-shift preferences actually change that prompt. Music requests are approximate, not guaranteed or therapeutic.

Shape now provides deliberate play, pause/resume, Stop/quiet, duration, volume, brightness and space. An always-reachable playback strip provides Stop while scrolling. Browser audio unlock, fetch/decode timeout, stale callbacks, navigation, dialog/background interruptions, timer expiration and unmount release audio ownership. Existing voice/dictation/intro/Ember/ambient coordination is preserved. Current never autoplays a newly generated or saved piece.

New procedural native SVG river artwork follows the approved light ivory/sage/gold direction and Soulfire masterbrand. Layered banks, water reflections, fine reeds and cloud/light movement are code-native original artwork. Movement obeys global motion pause, page visibility and reduced motion; it does not falsely represent an audio measurement.

## Actual availability and quality boundaries

The real local store contains six distinct existing style/seed briefs (soft piano, sustained textures, restrained acoustic; two seeds each), plus a newly generated 30-second focus candidate. Reproducibility repeats are deduplicated. The forty named research catalogue entries are not falsely shown as playable. The small real bank is reusable across everyday goals based on preference; it does not provide validated clinical matching or two clinically validated tracks per problem area.

The new focus candidate is recorded in `evidence/current-real-generation.json`: 30 seconds, no detected PCM clipping, matched -21 LUFS and -4 dBTP. Model load plus inference took 21.55 seconds on this run; subsequent audio preparation adds time. The UI says the complete process can take a few minutes. This single run is not a p95 promise. Actual local child cancellation returned cancelled and published no sample record (`evidence/current-real-cancellation.json`).

Current rejects candidates outside its duration, normalized loudness, peak and excessive-clipping gates before publication. All files must parse the existing strict sample schema. The player separately checks decoding and duration. Musical adherence, vocal-like artifacts, subjective pleasantness and seamlessness still require human listening; measured does not mean clinically validated. The UI invites preview and choice rather than certifying those qualities. The generator does not implement a vocal classifier, independent stems, biomarkers or automatic health adaptation.

The player schedules one-second amplitude crossfades between repeated copies of the chosen PCM candidate, with a gentle entrance and final fade. This is a repeat scheduler, not infinite neural generation or independently composed multisegment sessions. Different instruments/melodies require a new asynchronous candidate. The space control adds bounded deterministic convolution; it is not stem separation. No browser level can certify ear SPL.

## Persistence and compatibility

Generated audio and structured requests remain in the existing app-local model store, capped by the existing disk/sample budgets. No new paid service, model download or Stable agreement is used. Save Current explicitly adds a browser-local v2 bookmark with sample UUID, actual PCM hash, name and chosen settings. The feeling note is excluded. Missing/changed audio is not silently replaced. Corrupt bookmark storage is left untouched; a full 20-entry shelf requires removal before another save. Deleting a bookmark does not delete its generated audio from the app store.

Classic soundscapes retain the existing v1 namespace and schema. No old recipe or personal practice data is migrated. Music Lab infrastructure and evidence remain in source/history, but the comparison panel is no longer exposed in navigation. No Step 11 or other journey integration was added.

## Test isolation

Mutating memory/history/simulation suites now require the explicit `SOULFIRE_TEST_ISOLATED=1` flag rather than assuming that port 3101 implies a safe store. The server must be launched without a provider key and with a fresh `SOULFIRE_DATA_DIR`; tests also assert configured=false. This avoids disturbing any unrelated service on 3101. The existing fictional Kokoro fixture helper accepts isolated data/output paths, and uses an in-process mock with zero paid requests.

See final validation evidence beside this file for exact results. Automated browser output is muted; no real microphone or personal voice session was used, and no subjective audio or clinical outcome claim is made.

Final checks: 183 unit tests; typecheck/lint/build passed. The full isolated browser run passed 237/238 with no skips; its remaining rapid-introduction reflow race received a narrow source fix, followed by 60/60 final affected arrival/Current desktop/mobile checks, including a new deterministic regression. Earlier test-driver selector ambiguity and visible-page autoplay preconditions were corrected without changing the intended assertions or bypassing browser audio permission. No unresolved failure remains in the checked affected suites.
