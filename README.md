# soulfire · Proof of Concept One

A local, responsive practice prototype based on the repository vision and selected sage-and-gold design. The complete interaction loop and real OpenAI integrations are implemented. **Real text generation was verified on October 23, 2026 with one synthetic request to OpenAI, rendered as an editable personalized practice. Cloud transcription and physical voice round trips remain unverified and require microphone consent.** Labeled examples are available without a key. This is not a public pilot or clinical product.

**Taking over the project? Start with [the agent handoff](AGENT_HANDOFF.md).**

- [Product context](docs/context/README.md)
- [Product strategy](docs/strategy/product-strategy.md)
- [Prototype journeys](docs/strategy/prototype-use-cases.md)
- [Research](docs/research/README.md)
- [Design archive](docs/design/README.md)

## Run locally

Requires Node 22+ and npm. In this directory:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3100. Production: `npm run build`, then `npm start` (stop the dev server first). Do not run dev and build against the same `.next` directory simultaneously.

The authoritative project on this Mac is `/Users/miguelalvarado/Coding/soulfire`, including Git history, the existing GitHub remote and all latest uncommitted prototype edits:

```sh
cd /Users/miguelalvarado/Coding/soulfire
npm run dev
```

The preview remains http://127.0.0.1:3100. Earlier Documents and `/tmp` copies are recoverable historical copies, not the active source. The `soulfire-immersive-20261022` sibling under the old workspace contains revision archives and review artifacts. The migration itself did not publish changes; the completed prototype batch is tracked in this repository.

## Connect the real companion safely

Use an **existing authorized OpenAI API key**. Do not paste it into chat, source code, browser input, test fixtures or a commit. In the directory where the server runs, copy `.env.example` to `.env.local`, enter the key using a local editor, and restart the server. `.env.local` is Git-ignored. Alternatively, supply `OPENAI_API_KEY` through your approved local secret/environment mechanism. Never use a `NEXT_PUBLIC_` key. No credentials or billing arrangements are created by this project.

Defaults (configurable server-side):

- `OPENAI_MODEL=gpt-4.1-mini`: Responses API, strict structured output, runtime validation, `store:false`.
- `OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe`: recorded audio → editable draft.
- `OPENAI_REALTIME_MODEL=gpt-realtime`: WebRTC speech input/output, `marin` AI voice, transcription and voice interruption.

These are implementation baselines, not a claim of optimal model quality, account access or evaluated latency. Provider errors are surfaced without substituting canned AI replies. The setup indicator is beside every composer and voice control.

For microphone use, choose Dictate or Live voice, read the disclosure, then explicitly allow the browser microphone. Use localhost or HTTPS. Browser/OS permission is separate. Text remains usable on denial. No microphone permission was granted to this project during automated testing.

## Implemented experience

- Invitation with four starting situations and revisable language preference.
- Real model endpoint that proposes a principle and personalized specification using trusted sort, reflection and choice components. The UI never executes model HTML, code or tool URLs.
- Acceptance, protective planning, small care and careful repair examples, clearly labeled as examples.
- Editable/movable/removable/addable thought cards; choice controls; optional responses; user-written next action.
- Quiet timer (1, 2, 5 minutes), pause/reset, stop/grounding and skip. Microphone/playback disconnected for quiet.
- Reflection review with **unchecked-by-default, per-answer sharing**. Only chosen answers are included in the reflection request.
- Optional plain-text note download and opt-in saved practice on this browser, with explicit removal and confirmation before starting fresh.
- Twelve-step map with a bounded first slice (1, 3, 10, 11); later exercises explicitly marked.
- Editable dictation into the conversation or selected private reflection/action field. Audio is processed before text submission, disclosed explicitly.
- Live WebRTC voice with transcript continuity, event deduplication, interrupt, microphone mute, speaker mute, end, disconnection recovery and ten-minute cap. Current practice title and submitted conversation are context; unsent/private fields are excluded. End voice then choose “Shape a practice from our conversation” to generate a validated exercise.

## Privacy and support boundaries

No accounts, database, analytics, or application content logging. Browser local storage remembers introduction completion and sound/motion preferences. Private drafts are memory-only by default. “Keep this practice on this device” explicitly enables unencrypted browser storage of the current practice answers and position; anyone using that browser can resume it. Uncheck to remove the saved copy. Conversations and reflection-sharing selections are never persisted. Downloaded notes are unencrypted files chosen by the user. Submitted text and audio go to OpenAI; provider processing/retention is separate from app storage. `store:false` is not a zero-retention guarantee.

Always-available pause/skip/grounding/support controls are outside model control. Narrow deterministic checks interrupt explicit immediate-harm, dangerous-withdrawal and no-contact/abuse requests with labeled safety notices. They are a backstop, **not a comprehensive clinical classifier**; voice also uses model instructions, and support remains accessible. Qualified review and live safety evaluation are required before an external pilot.

The server enforces localhost origins, bounded input, a simple per-process request limit, bounded provider calls and sanitized errors. This is intentionally local-only. Public deployment would need authentication, production abuse/spend controls, distributed limits, deployment security and privacy/safety review. Do not expose this server publicly.

## Validate

```sh
npm run typecheck
npm run lint
npm test
npm run build
# Start the app in another terminal before browser tests:
npm run test:e2e
```

Browser tests default to installed Mac Chrome on macOS. Set `CHROME_PATH` for another Chrome/Chromium executable. On Linux, install Playwright Chromium with `npx playwright install chromium` before tests; the standard bundled browser is used. They cover 1440px desktop and 390px mobile; **model/media success paths are simulations**, never evidence of a live provider round trip. See [validation](docs/implementation/validation.md) for actual results and remaining gates.

Design captures: [review gallery](docs/design/review/index.html). Decisions: [design log](docs/design/decisions.md). Scope: [implementation plan](docs/implementation/proof-of-concept-one.md).

## Deferred

Broader live-provider evaluation and physical microphone/speaker testing; real iOS/Android/Safari/background/keyboard testing; full reviewed exercises for the other eight steps; accounts and encrypted persistence; reminders; native apps; external messaging; retrieval over the unverified research dossier; public deployment and clinical efficacy claims. The alternative UI brainstorm is deliberately deferred until the core milestone is complete or parent explicitly authorizes the exploration.

## API references checked

- [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Realtime WebRTC unified interface](https://developers.openai.com/api/docs/guides/voice-webrtc?voice-api=realtime)
- [File transcription](https://developers.openai.com/api/docs/guides/speech-to-text)
- [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini)

## Arrival and returning visits

The first visit offers an optional roughly 25-second local narration, optional captions and immediate entry, in the same moving landscape. Music ducks during narration and keeps its player and position when the journey starts. Returning-visit state is remembered after deliberate entry/skip or completed playback. A separate playback flag is recorded only when the browser reports actual playback; visiting, beginning, skipping and failed play attempts never enable the Replay label. Earlier ambiguous completion flags are preserved but do not imply playback. The visible transcript panel is removed; captions and a screen-reader-only text equivalent remain. Returning visitors can replay it, resume an opted-in saved practice, or confirm clearing before starting fresh. OS reduced motion and remembered motion/sound preferences remain in effect.

Narration is synthesized locally with the existing Kokoro-82M / kokoro-onnx pipeline and English `af_heart` voice used for the PTO introduction. Speed 0.84 with deliberate pauses yields 23.45 seconds. No post-synthesis time stretching is used. The rejected Samantha recording is archived, not served. It needs no provider, credentials, microphone or network beyond this local server. Audio provenance and timing are in `public/audio/welcome-introduction.json`; the selected source WAV is in `assets/voice/`. Automated tests verify decoding and playback state in silent isolated Chrome; subjective voice quality and real-device speaker output still need human audition.

## Verified real OpenAI connection

The local production build was tested through its actual UI using one synthetic, non-personal paper-airplane presentation scenario. OpenAI returned `gpt-4.1-mini-2025-04-14`, the app validated the exercise specification and rendered the personalized practice without fallback. See [live validation](docs/implementation/live-ai-validation.md). The private API key stays in ignored `.env.local`; it is not needed or included in this repository.

The opt-in `node scripts/smoke-live-companion.mjs --allow-one-paid-request` performs one real request and can incur API charges. Ordinary regression tests use an unconfigured local server and simulated provider/media transports. Do not use personal journal data for smoke tests.
