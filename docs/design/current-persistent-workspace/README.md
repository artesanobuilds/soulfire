# Current: persistent catalogue and creation workspace

29 October 2026. Miguel selected Option A and explicitly approved implementation, including prominent creation entry points. This supersedes the earlier design-only status; the original A/B concept boards remain historical design records.

Desktop uses a catalogue/creation workspace beside a persistent selected-player panel. “Explore Currents” and “Create for me” are first-class workspace buttons; “Create something new” is the first catalogue card. Goal-first creation retains its existing bounded candidate-generation backend. Optional feeling text, exclusions and advanced settings stay in a disclosure; the primary create action appears before that disclosure. The player remains available during creation, browsing and job review. A job-return banner preserves progress/cancel/review access across workspace views; it never invents progress percentages or starts audio automatically.

Mobile retains a fixed selected-player dock with explicit Play/Pause, Stop and Shape sound. Shape opens a modal sheet with the same underlying controls, keyboard containment, Escape/Done dismissal, focus return and body-scroll locking. Browser history restores workspace/sheet state. Switching workspace does not remount the audio engine. Choosing a different piece still stops the previous one deliberately; unrelated navigation and voice interruptions retain existing cleanup behavior.

The ae359199 catalogue/audio revision is preserved byte-for-byte. Miguel reported this revision sounded substantially better; that is subjective listening approval, not clinical efficacy. No new music generation or model change is part of this layout task.

Original research/ratings and model archives remain intact. Publication was separately approved after explicit disclosure that artesanobuilds/soulfire is public. Runtime WAVs, weights/caches, credentials, configuration and private sessions remain excluded from Git.

## Review and reproducibility

`desktop-explore.png`, `desktop-create.png`, `mobile-explore.png`, `mobile-create.png` and `mobile-shape.png` are screenshots of the actual implementation, not the earlier concept boards. Their first-viewport layout is checked at 1440×1000, 390×844 and 360×640 in `layout-checks.json`. Shorter mobile windows intentionally scroll within the sheet; Stop stays near its top. `audio-preservation.json` verifies all 36 active master/bed hashes against the approved revision and quantifies runtime files outside Git.

From the repository root, with a separately launched local test server:

```
SOULFIRE_TEST_URL=http://127.0.0.1:3198 node docs/design/current-persistent-workspace/src/render.mjs
SOULFIRE_TEST_URL=http://127.0.0.1:3198 node docs/design/current-persistent-workspace/src/verify-layout.mjs
```

These scripts use fresh browser contexts, no microphone, no model generation, and no private browser profile. Chrome's sandbox remains enabled. Browser tests use synthetic input/output and mocked provider responses; the unchanged audio pipeline's actual-generation evidence remains in the prior listening-feedback run.
