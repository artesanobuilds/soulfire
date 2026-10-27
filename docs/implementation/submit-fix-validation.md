# Explicit submit after dictation — October 24, 2026

Source: `/Users/miguelalvarado/Coding/soulfire`. Preview: http://127.0.0.1:3100.

## Reproduction and fix

A long synthetic draft made the conversation textarea grow without a height limit, pushing the submit control below the viewport (observed near y=1475 on a desktop-height 800px window and beyond y=2600 on mobile). The control existed but was difficult to discover.

Conversation editors now have a bounded, internally scrollable height. Their explicit send action sits immediately below the draft and optional memory choice, before secondary voice controls. The opening action says **Send & find a practice**. A completed transcript announces **Draft ready**, focuses the editable conversation draft and brings its action into view. Private practice dictation instead announces that it remains private; it is never sent automatically. Private reflection and action textareas retain their existing expanding behavior.

The button explains empty, checking, disconnected and active-voice states rather than leaving an unexplained disabled action. Control/Command+Enter deliberately sends a conversation draft; ordinary Enter adds a newline. Tab reaches the send control. The existing request lock prevents duplicates, and failed/canceled generation restores the draft.

No microphone permission or provider credential settings changed. There is no new AI-processing consent gate: pressing Send remains the explicit submission, with its OpenAI processing disclosure beside it. Microphone consent remains separate. No actual user dictation or personal ambient audio was used in testing.

## Checks

- ESLint, TypeScript and 58 unit tests passed.
- 44 focused desktop/mobile browser checks passed with synthetic audio and intercepted provider responses.
- New cases verify Stop → processing → editable review → explicit submission; fully visible send control after long dictation, including 390×450; exactly one request for repeated keyboard submission; ordinary newline behavior; keyboard Tab/Enter; failed generation and canceled microphone consent preserving text; connection-check/unconfigured states retaining the draft.
- Existing tests verify recording cancellation, permission denial, stale transcription, private-field dictation without model submission, voice interruption and the full practice loop.
- Credential-free and authoritative production builds passed. The updated production preview is running on port 3100. **8/8 targeted production checks passed** for long dictation, keyboard/error/configuration states and private-field dictation.
- **100/100 full isolated desktop/mobile browser tests passed**. The complete report is retained locally at `docs/implementation/evidence/submit-full-browser-results.json`.

## Evidence and limitations

Synthetic screenshots are in `docs/design/submit-review/`. Before screenshots show the original long editor; after screenshots show the final explicit review/send action. The mobile after screenshot intentionally uses a shorter 450px viewport. These are isolated browser sessions, not the user's active Chrome window.

The supplied screenshot `libfile_63d18141040881918bc8a34205a7b39c` was resolved through Library, but its supported transfer helper returned `download failed`. No local pixels were obtained. Diagnosis therefore rests on independently reproduced behavior and inspected synthetic screenshots, not an assertion about unseen screenshot details. No private screenshot is copied into the review artifact.

Physical microphone, real mobile keyboard/OS behavior and paid model/voice round trips were not exercised. Existing key setup is preserved. No push, deployment or logging was enabled.

## Changed files

Implementation: `src/components/Soulfire.tsx`, `app/globals.css`. Tests: `tests/browser/dictation.spec.ts`, `flows.spec.ts`, `architecture.spec.ts`, `voice.spec.ts`. The existing broader architecture and dictation work is preserved. Logging integration analysis is separately documented in `conversation-logging-integration-map.md`; it is read-only analysis, not an implemented feature.
