# Arrival and returning visits — October 22, 2026

Implemented in /tmp/soulfire-resume-20261022, served on http://127.0.0.1:3100.

## Behavior

- One-line purpose, optional introduction, immediate Begin/Skip, three visual moments, captions and full transcript.
- Existing landscape DOM and one ambient player survive entry. Narration stops; ambient volume fades back. Music is ducked to 22% of chosen volume while narration is audible.
- Only explicit entry/skip or completed playback marks the introduction done. Reload alone does not. Returning users can replay without clearing storage.
- Welcome back reveals no private answers. Resume restores saved practice/position. Start new and replacement of an edited/saved practice from the map require confirmation.
- Explicit Keep this practice on this device opt-in enables unencrypted browser storage. Uncheck removes only that saved copy and retains in-memory answers. Existing saved records are read without deletion or migration. Invalid data is not rendered or deleted. Conversations and sharing consent are not persisted. No existing user browser/profile was inspected or cleared.
- Explicit sound mute, volume, track and motion preferences persist. Reduced motion wins. Modal opening, hidden tab and leaving arrival stop narration. Device-storage failure retains current answers and shows an error.

## Voice replacement

The user rejected Samantha. The current served file is public/audio/welcome-kokoro-heart.m4a, generated with the already installed local Kokoro-82M/onnx pipeline and af_heart, the English voice used for PTO. Generic preset voice, no cloning. The original approved script is unchanged. Synthesis speed 0.84 plus pauses; 23.4465 seconds. No post-synthesis stretching. No PTO assets modified, new downloads, credentials or paid service.

Reproduction: scripts/prepare-welcome-voice.py, using /Users/miguelalvarado/Coding/AI-native/tts/venv/bin/python. Metadata and segment cues: public/audio/welcome-introduction.json. WAV source, faster initial candidate and rejected Samantha are preserved under docs/design/arrival-review/audio-source; only Kokoro is served by the app.

## Verified on final code and Kokoro asset

- TypeScript: passed.
- ESLint: passed, zero warnings.
- Vitest: 45/45 passed (schema/agent, safety and saved-practice validation).
- Playwright: 64/64 passed, 1440x1000 desktop and 390x844 mobile, independent headless Chrome with output muted. No control of the user's current Chrome window.
- Production build: passed in /tmp/soulfire-immersive-build, separate from the live dev server.
- Real local Kokoro AAC: decodes, plays, pauses, mutes, seeks captions, completes and replays in Chrome. Audio PCM is finite; zero clipped samples, decoded peak -3.026 dBFS. Exact measurements in evidence/welcome-audio-qc.json.
- Tests include begin/skip mid-narration, rapid clicks, modal/navigation/visibility interruption, music duck/restore with no source restart, captions and transcript, error fallback, keyboard entry, reduced motion, intro completion, returning resume/new confirmation, private landing, restored cards/fields/reflection/action, save removal/failure, sound preferences, existing practice-to-quiet-to-reflection-to-action flow, autoplay failures, repeated actions and simulated voice interruption.
- Current /api/status: configured:false. Port 3100 responds.

## Remaining limits

No direct listening assessment or real speaker/phone/Safari evaluation was performed. The user should audition Hear the introduction or Replay introduction. Local decoding and playback-state tests do not prove subjective warmth/naturalness. No installed recognizer or cached Whisper model was found in checked locations; none was downloaded. Provider/model, cloud transcription and physical microphone round trips remain unverified and unconfigured. Existing tests for those success paths use simulations.

No public deployment, push, credential change, microphone access or PTO edit.

## Review

The self-contained docs/design/arrival-review/index.html embeds before/after desktop/mobile screenshots and the new audio audition; moving this file cannot break image paths. Captures use reduced motion for deterministic stills; separate browser tests verify actual motion.
