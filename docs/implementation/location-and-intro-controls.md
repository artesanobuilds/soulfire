# Main project location and introduction controls — October 23, 2026

Authoritative working tree: `/Users/miguelalvarado/Coding/soulfire`.
Preview: http://127.0.0.1:3100.
Origin fetch/push URL: https://github.com/artesanobuilds/soulfire.git.
Branch: main. HEAD: d2bfd9782534b3d2876a299e28ddbb04b36dd44e.
Latest prototype changes remain uncommitted. No GitHub push, new repository, deployment or credential change.

## Migration

The old canonical checkout under Documents was clean. Its HEAD and all refs matched the complete working runtime checkout. Reading a canonical documentation file stalled the initial copy; only that identified copy process was stopped. The partial copy was preserved in the old backup folder. Migration then used the complete runtime source and Git metadata, validating 210 files including Git byte-for-byte before location documentation updates. Git fsck --full passed. The one canonical-only historical standalone gallery was copied separately. Current dependencies are actual files in this main project, not symlinks into /tmp.

All latest code, design/audio assets, uncommitted changes and the existing GitHub mapping are retained. Original Quiet Ember files and generation notes from the durable backup are copied under assets/audio-originals, with hashes verified; the regeneration script now uses that project-relative location. Kokoro generation still uses the existing shared local tooling under /Users/miguelalvarado/Coding/AI-native/tts; playback needs only the included AAC file.

Port 3100 listener PID 37798 was verified with cwd /Users/miguelalvarado/Coding/soulfire and HTTP 200. The old runtime server was stopped before starting this one. The browser origin is unchanged, so existing browser-local answers/preferences remain associated with the same URL. No user browser storage was inspected, cleared or migrated. Server log: /tmp/soulfire-coding-dev-20261023.log. Restart when stopped: cd /Users/miguelalvarado/Coding/soulfire && npm run dev.

Retained recovery locations, not active source:
- /Users/miguelalvarado/Documents/Codex/2026-10-02/task-4/soulfire
- /tmp/soulfire-resume-20261022
- /Users/miguelalvarado/Documents/Codex/2026-10-02/task-4/soulfire-immersive-20261022 (revision archives, original reviews, and preserved partial copy)
The first two contain MOVED-TO-CODING.txt pointers. No destructive cleanup performed.

## Introduction behavior

Play introduction sits beside Begin journey. Replay is based on a separate soulfire.introduction.played.v1 browser flag set only by a successful playing event; merely visiting, beginning, skipping or a failed attempt never sets it. Older ambiguous arrival-completion flags remain intact and do not imply playback. Pause/resume remains available during the current visit. The visible Introduction transcript panel is removed; optional synchronized captions and a screen-reader-only text equivalent remain. Existing Kokoro af_heart audio, music ducking, sun/water motion, and return/resume behavior are preserved.

## Final checks in the new main location

- TypeScript: passed.
- ESLint: passed, no warnings.
- Unit tests: 45 passed.
- Production build: passed in the new project before starting its dev server.
- Isolated Mac Chrome browser suite: 70 passed, zero failed/skipped/flaky; desktop 1440x1000 and mobile 390x844. This includes clean/legacy/returning arrival, skip and begin without playback, successful partial/completed playback and reload, failed playback, adjacent buttons, absent transcript panel, captions, interruptions, saved answers and complete practice flow.
- Actual render screenshots checked on desktop/mobile. Self-contained gallery: docs/design/intro-controls-review/index.html.
- Git integrity and remote/root checks passed. The ambient regeneration path was syntax-checked and its original inputs verified; audio was not regenerated or changed.

The initial pre-migration run had one timing-sensitive test assumption: a rapid double-click interrupted playback before its first playing event. The test now accepts Play or Resume at that point, then verifies actual playback before asserting Replay. Final suite passes.

Current provider readiness: configured:false. Live AI, cloud dictation and physical microphone/provider round trips remain unconfigured and untested. Browser success tests for provider/voice transport use simulations. Local audio decoding/playback was tested silently; no new direct listening or physical-phone/Safari claim. No control of the user's active Chrome window.
