# Real OpenAI validation — October 23, 2026

The main project is `/Users/miguelalvarado/Coding/soulfire`. Its local production build is served at http://127.0.0.1:3100. The user supplied an existing key in `.env.local` and explicitly authorized one paid synthetic check. No account/billing/credential creation or public deployment was performed.

## Actual request

One request through the production browser UI and `/api/companion` succeeded with HTTP 200. The server called the official `https://api.openai.com/v1/responses` endpoint with `store:false`. Requested model: gpt-4.1-mini. Actual returned model: **gpt-4.1-mini-2025-04-14**. A provider response ID was received and preserved only in the local diagnostic receipt. The validated exercise was rendered under YOUR PERSONALIZED PRACTICE, with editable situation-specific cards and no fallback/example banner. Browser-to-provider direct calls: zero.

Input was solely a fictional two-minute paper-airplane presentation scenario. No saved practice, private journal, microphone audio or personal information was sent. End-to-end synthetic browser check took about 3.6 seconds; this single result is not a latency benchmark.

## Credential checks

- `.env.local` exists, is ignored/untracked, and has filesystem mode 0600.
- `.env.example` contains a blank key field, and no NEXT_PUBLIC credential was configured.
- No actual-key matches or plausible OpenAI secret candidates were found in reachable local Git history before use.
- No actual-key matches were found in tracked working files, public assets or production client bundles.
- Existing routes retain bounded inputs, localhost/origin enforcement, timeouts, sanitized errors and no-store response headers. Provider credentials are server-side authorization headers only.
- No secret was printed, logged, captured, backed up or committed by this work. Provider retention is separate; store:false is not a promise of zero retention.

## Checks

Typecheck and ESLint pass. 45 unit tests pass. Production build passes. 70 desktop/mobile browser tests pass against a separate credential-free localhost server so regressions cannot make paid calls. Ordinary model/transcription/Realtime success paths in that suite are simulations. The one explicitly gated smoke request is the real provider acceptance evidence.

The current UI retains the selected zen landscape, motion pause/reduced-motion support, Kokoro introduction, music and ducking, correct Play/Replay labels, and explicit saved-practice behavior. See ../design/live-ai-review/README.md and evidence/live-openai-validation.json.

## Remaining limits

Cloud transcription, Realtime speech, physical microphone/speaker round trips, real-device Safari/phone behavior, broader model/safety evaluations and clinical effectiveness remain unverified. Microphone use still requires explicit user/browser consent. This is a local self-help prototype, not a public service or professional-care replacement.
