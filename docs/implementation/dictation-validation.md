# Dictation listening UX — October 24, 2026

Authoritative source: `/Users/miguelalvarado/Coding/soulfire`, based on `e69d974`. Local preview: http://127.0.0.1:3100. This batch remains uncommitted and unpushed; it does not change credentials or provider integration.

## Behavior

- Consent is unchanged in purpose: audio goes to OpenAI only after an explicit Stop, for transcription into an editable draft. Merely selecting a private destination does not send its contents.
- Microphone setup has a separate waiting state and Cancel. Listening appears only on MediaRecorder's actual start event. Permission denial or recorder startup failure never displays capture activity.
- A Web Audio analyser measures the microphone signal locally, without routing it to speakers. Fifteen bars follow its amplitude; silence settles to a flat baseline. No interim text appears. Unsupported or suspended Web Audio has a static fallback, and recording remains available.
- Stop releases capture tracks immediately, removes the waveform, and displays “Transcribing · microphone off…” while final data is processed. Final recognized text is appended once to the existing editable destination, without submitting it to the companion.
- Discard, navigation, hiding/leaving the page, unmount, recording errors, and device disconnection release capture. Canceled or stale sessions cannot insert late text. A late permission grant after cancellation releases its stream immediately.
- Removed the previous one-minute automatic stop/upload. Recording ends on explicit Stop or Discard. The existing server upload limit still applies: recordings exceeding 7 MB are discarded locally with an error, without uploading.
- Motion pause and reduced-motion preference keep a static listening indicator. They do not stop recording. Music retains its existing voice interruption behavior.

## Passed

- ESLint, TypeScript, and `git diff --check`.
- Vitest: 45/45 unit tests.
- Playwright: 88/88 tests against an isolated credential-free server, desktop 1440×1000 and mobile 390×844. This includes 18 new dictation cases and all previous arrival, saved-answer, music, motion, practice, privacy and simulated live-voice regressions.
- Real browser Web Audio and MediaRecorder driven by a synthetic oscillator: waveform responds to changing amplitude, capture remains active past the previous minute limit, Stop releases tracks and analyser before the mocked transcript response, and existing text remains unchanged until final text arrives.
- Delayed permission/cancel, permission denial, recorder startup failure, discard/restart, simulated device disconnection, navigation/pagehide cleanup, canceled processing, transcription error/retry, empty recognized text, reduced motion and motion pause.
- Next.js production build passed. The rebuilt production preview passed six additional focused desktop/mobile tests for waveform/Stop/final text, delayed permission cancellation, discard/disconnection/navigation.
- Production `/` and `/api/status` returned HTTP 200; status reports AI configured. Server working directory verified as the authoritative source above. `.env.local` remains ignored and untracked.

The initial targeted run had two test-selector failures (home is a button, not a link). The selector was corrected; both projects passed in the full suite and production checks.

## Evidence and limits

- [Desktop listening state — synthetic audio](../design/dictation-review/listening-synthetic-desktop.png)
- [Mobile listening state — synthetic audio](../design/dictation-review/listening-synthetic-mobile.png)
- Local ignored full browser report: `docs/implementation/evidence/dictation-browser-results.json`.
- Browser tests used isolated muted Chrome, synthetic audio, and intercepted provider responses. No user Chrome window, physical microphone, personal ambient audio, or paid API request was used.
- Actual microphone permission/hardware behavior, cloud recognition quality/latency, live voice round trips, and real Safari/iOS/Android devices remain untested. The earlier successful live text request is separate evidence; it does not validate speech recognition.

## Changed implementation

`src/components/VoiceControls.tsx`, new `src/components/DictationWaveform.tsx`, `src/components/Soulfire.tsx`, `app/globals.css`, new `tests/browser/dictation.spec.ts`, updated recorder mock in `tests/browser/voice.spec.ts`, README, this note and the two screenshots. No provider route or key configuration changed.
