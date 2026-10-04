# soulfire · Proof of Concept One

A local, responsive practice prototype based on the repository vision and selected sage-and-gold design. The complete interaction loop and real OpenAI integrations are implemented. **Live model, cloud transcription and physical voice round trips still require an authorized API key and microphone consent; they have not been verified in this workspace.** Labeled examples are available without a key. This is not a public pilot or clinical product.

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

On this Mac, tooling stalled in filesystem access beneath Documents. The exact runtime copy at `/tmp/soulfire-poc-one` worked. Canonical source is `/Users/miguelalvarado/Documents/Codex/2026-10-02/task-4/soulfire`. To run the already-prepared copy:

```sh
cd /tmp/soulfire-poc-one
npm run dev
```

The temporary copy is disposable. Preserve edits in the canonical checkout. A clean checkout outside the Documents tree is another option on a machine with the same watcher issue.

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
- Optional plain-text note download, no automatic saving, session clearing.
- Twelve-step map with a bounded first slice (1, 3, 10, 11); later exercises explicitly marked.
- Editable dictation into the conversation or selected private reflection/action field. Audio is processed before text submission, disclosed explicitly.
- Live WebRTC voice with transcript continuity, event deduplication, interrupt, microphone mute, speaker mute, end, disconnection recovery and ten-minute cap. Current practice title and submitted conversation are context; unsent/private fields are excluded. End voice then choose “Shape a practice from our conversation” to generate a validated exercise.

## Privacy and support boundaries

No accounts, database, analytics, automatic local storage or application content logging. Private drafts are browser-memory only and clear on reload. Downloaded notes are unencrypted files chosen by the user. Submitted text and audio go to OpenAI; provider processing/retention is separate from app storage. `store:false` is not a zero-retention guarantee.

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

Live provider evaluation and physical microphone/speaker testing until authorized setup; real iOS/Android/Safari/background/keyboard testing; full reviewed exercises for the other eight steps; accounts and encrypted persistence; reminders; native apps; external messaging; retrieval over the unverified research dossier; public deployment and clinical efficacy claims. The alternative UI brainstorm is deliberately deferred until the core milestone is complete or parent explicitly authorizes the exploration.

## API references checked

- [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Realtime WebRTC unified interface](https://developers.openai.com/api/docs/guides/voice-webrtc?voice-api=realtime)
- [File transcription](https://developers.openai.com/api/docs/guides/speech-to-text)
- [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini)
