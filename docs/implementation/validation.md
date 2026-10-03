# Proof of Concept One checkpoint — validation

Date: October 3, 2026 UTC. Canonical repository: `/Users/miguelalvarado/Documents/Codex/2026-10-02/task-4/soulfire`; based on main `8d3c23e`, local branch `codex/proof-of-concept-one`. No push, PR or deployment.

**Status: implementation checkpoint, not full POC acceptance.** The real model/audio gate is blocked by absent `OPENAI_API_KEY`; no microphone approval was requested or granted for physical testing. No secrets created, exposed or committed. The final alternative UI exploration is deferred.

## Passed

- TypeScript `tsc --noEmit`.
- ESLint, zero errors and zero warnings on final application/test source.
- Vitest: **43/43**: 13 schema/API tests and 30 narrow deterministic backstop cases. These are not live model evaluations.
- Next.js **15.5.27 production build**, all 8 generated routes. Main route 43.8 kB, first-load JS 146 kB. Server started successfully in 299 ms on localhost.
- Playwright **20/20 against the production build**. Desktop 1440×1000 and mobile 390×844: full private loop, edit/move/add/remove cards, pause/return, timer start/pause/reset, grounding/skip, review and download screen, twelve-step map, distinct journeys and decline, selected-only sharing, cancellation/retry draft retention, microphone denial, editable private-field dictation, live transcript deduplication/interrupt/mutes/cleanup, explicit danger transcript stop.
- Additional actual production HTTP regression checks: **2/2** passed (desktop/mobile projects), with status 200/configured=false, text and voice endpoints 503/unconfigured, foreign Origin 403. These make no provider calls. Evidence JSON is in `evidence/browser-results.json` (20 cases) and `evidence/http-results.json` (2 cases).
- Review refinements: connection indicator at composer/voice; filled textareas fully visible at **390×450**; dialog initial focus, forward/reverse Tab loop, Escape restoration to the opening button.
- Modal capture investigation: actual active element was “Close dialog” inside the modal before and after capture on both widths; skip link was not focused. Full-page capture included the offscreen fixed element above a scrolled viewport. Modal images now capture only the viewport; unfocused skip link is transparent but remains keyboard-accessible.
- 30 actual browser screenshot files in the design review gallery. Three pairs of loading/error/denial screenshots are explicitly labeled simulations.

Browser provider/media success paths use simulated responses, fake media tracks and protocol events. **They do not prove a live model, speech recognizer, speaker, WebRTC service or physical microphone works.** No synthetic answer is substituted for the actual API in the app.

## Integration defect found and corrected

A real production HTTP smoke test caught a Host/origin mismatch: Next normalized the internal request URL to localhost while the browser used 127.0.0.1. The guard now validates a strictly local Host header before comparing Origin to that actual host. A regression test covers normalization and malicious Host rejection. Cross-origin requests still return 403.

## Tooling issue resolved for this checkpoint

Next/Vitest stalled in filesystem access under the Mac Documents directory. A stack sample showed a filesystem watcher blocked in `open()`. An isolated `/tmp/soulfire-poc-one` runtime copy resolved startup/tests; a separate `/tmp/soulfire-poc-build` copy kept production builds independent of the dev server. Canonical files remain in the task checkout. Runtime copies are disposable.

## Blocked / untested

- Actual OpenAI Responses personalization, quality, latency and account/model availability.
- Actual cloud transcription, edited-dictation submission and Realtime speech-in/spoken-response round trips.
- Physical microphone/speaker, interruptions during real playback, actual permission/settings recovery.
- Real iOS/Android/Safari software keyboard, screen lock, background audio, device removal and network transition behavior. Viewport simulation is only layout testing.
- Live 30-scenario model/safety evaluation and qualified sensitive-flow review. See [live checklist](live-evaluation.md).

## Exact remaining setup

An authorized person should configure an existing OpenAI key **locally in the directory where the server runs**, using ignored `.env.local` or an approved environment/secret mechanism. `.env.example` lists names and defaults. Never paste a key in chat or use `NEXT_PUBLIC_`. Restart the server, check the adjacent connection indicator, then execute the live checklist with explicit microphone consent. Do not publish this unauthenticated localhost prototype.

## Deliverables

- [Launch and secure setup](../../README.md).
- [Linked design gallery](../design/review/index.html), with desktop/mobile PNGs.
- Self-contained `soulfire-design-review.html` in Library, same identity through review revisions.
- Portable source archive, excluding secrets, dependencies, build/cache directories and Git internals. No publication used for transfer.
