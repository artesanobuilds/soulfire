# Music Lab: local controlled listening

Music Lab is a separate Soulfire navigation feature. It does not alter Current, Ember or the journey. It is a comparison instrument, not a claim about health, cognition, licensing clearance or musical quality.

## Usable workflow

Select one shared instrumental brief (felt piano, beatless ambient pads/strings, restrained nylon-string acoustic), seed 101/202 and duration 30/60/90 seconds. Local generation is deliberate, offline and bounded to one process at a time. There is no cloud fallback, paid provider or automatic model installation. An unavailable model has a visible pending state and disabled generation. Existing measured files can still be played if their runtime is later unavailable.

Two model files for the same style/seed/duration enable hidden A/B labels, order swapping and identity reveal. With only ACE available, the page explicitly identifies single-model listening and says A/B is pending. Generation history can compromise blinding; this is not a randomized clinical experiment. Numeric seeds control each model separately, not equivalent latents across models. Models use eight steps and CFG 1 where meaningful; architecture, training and control semantics differ.

Each source yields a bed-only render, the same local Ember arrival/natural guidance at fixed placement and pre-normalization balance, and a three-minute loop with identical one-second equal-power crossfades. Every listening render is measured and trimmed to −21 LUFS ±0.2 LU with a conservative true-peak ceiling. Per-sample listening volume is independent, so changing it can undo the perceived match. A single native player prevents overlapping A/B, releases sources on stop/end/unmount, times out stalled loads and pauses on background/dialog interruption. Switching to Current, Ember or the journey stops Music Lab; entering Music Lab quiets other app audio without changing saved ambient preferences.

Optional user ratings cover pleasantness, distraction, artifacts, unwanted vocals, fatigue and narration intelligibility. Blank ratings stay blank. High pleasantness/intelligibility means better for the listener; high distraction/artifacts/vocals/fatigue means more of those qualities. No score, preference or winner is invented. Save requires explicit consent/action and uses only `soulfire.music-lab.ratings.v1` in localStorage. JSON export includes actual measured metadata, complete briefs, user-entered ratings and explicit preference. No private conversation or health input is used.

## Measurements and interpretation

The app records cold-process wall time, load/inference split when exposed, peak process RSS and peak MLX allocation separately. Unified-memory numbers overlap and must not be summed or described as CUDA VRAM. The Stable CLI currently combines phase timing; its separate accelerator peak is unavailable, not guessed.

FFmpeg EBU R128 measures integrated loudness, loudness range and true peak. Exported source PCM is inspected for peak amplitude, fraction at |amplitude| ≥ .999, end/start sample jump and head/tail 100-ms RMS difference. Rendered seam-adjacent sample change is a proxy, not an audible-artifact verdict. Narration and loop loudness/true peak are also measured. Browser gain does not certify ear-level dBA. Source is the upstream exported WAV, decoded into floating storage; these clipping figures describe that exported PCM, not inaccessible model latents.

Container SHA256 and decoded float32 PCM SHA256 are separate: WAV metadata can change while audio samples remain identical. Reproducibility must compare decoded PCM and the exact source/weights/runtime/settings, not just filenames or container hashes. A repeated test on this machine is evidence about this configuration, not a cross-platform guarantee.

## Runtime, storage and cancellation

`SOULFIRE_MUSIC_LAB_DIR` points to an external local folder with `runtime.json` and `samples/<UUID>/`. It must not be committed. Model sources, isolated Python environments, caches and weights are outside the app repository. The local config has no secrets, but executable/source paths are trusted operator configuration, never accepted from HTTP inputs. It records execution approval, exact source/weights revisions and the Stable terms gate. No UI button accepts legal terms or creates tokens. Production uses its existing configuration; credentials are never passed into model workers.

The first-party worker verifies the pinned Git revision, rejects dirty tracked source and checks ACE checkpoint-code equivalence. Model inference is offline, with implicit tokens disabled and a 32 GiB MLX allocation cap. An individual job has a fifteen-minute generation bound and two-minute measurement bound. Storage requires at least 50 GiB free and reserves a 2 GiB results budget. Request UUIDs support cancellation before acknowledgement; a bounded tombstone prevents late POSTs from starting abandoned work. Only the owned detached process group is killed. No unrelated server or model process is targeted. Navigation requests cancellation; a failed network cancellation is reported and the worker remains timeout-bounded.

Public audio routes accept only a known sample UUID and bed/narration/loop variant, with bounded byte ranges. No arbitrary filesystem path, remote URL or command is accepted. Same-origin localhost mutation guards and strict schemas apply. Diagnostics remain local. There are no public tunnels or Gradio launches.

## Current upstream and legal gates

Official sources inspected on 2026-10-28:

- [ACE-Step source](https://github.com/ace-step/ACE-Step-1.5), pinned `ca1e85fe9430179831e6bc6be790c332190a3866`; code MIT. [Official weights](https://huggingface.co/ACE-Step/Ace-Step1.5), pinned `19671f406d603126926c1b7e2adc169acbcade22`, MIT metadata. Selected DiT/VAE/text encoder were about 6.34 GB; the separate language model is omitted and prompt/metadata rewriting is disabled. The ARM64 runtime was installed after action-time approval; no global Python/configuration was changed.
- [Stable Audio source](https://github.com/Stability-AI/stable-audio-3), inspected revision `77e0398c26f7d22d801ec1bb036307e8b231f741`; source MIT does not make weights MIT. [Small-Music gate](https://huggingface.co/stabilityai/stable-audio-3-small-music) requires explicit conditions and profile submission. Its current License Agreement link points to [Stable Audio Open 1.0 LICENSE.md](https://huggingface.co/stabilityai/stable-audio-open-1.0/blob/main/LICENSE.md), a naming mismatch requiring review. Also linked: [Gemma terms](https://ai.google.dev/gemma/terms) and [Stability privacy policy](https://stability.ai/privacypolicy). [Current commercial policy](https://stability.ai/license) describes registration and revenue conditions; no business eligibility is assumed.
- The gate requests Name, Email, Country, Organization/Affiliation, marketing Yes/No and intended use (Research / Personal use / Creative Professional / Startup / Enterprise). Hugging Face processes the request and shares submitted information with Stability AI, the publisher. [HF gating documentation](https://huggingface.co/docs/hub/models-gated) explains default username/profile/email sharing. Nothing has been submitted or accepted by this app.
- The [official optimized MLX route](https://github.com/Stability-AI/stable-audio-3/tree/main/optimized/mlx) was inspected; its publicly downloadable optimized bundle is not treated as permission to bypass terms. Its Gradio UI defaults to public sharing, so it is not launched. Stable integration remains pending and unverified with live weights.

## Evidence and limits

See `evidence/ace-study.json` and `comparison.md` for the actual nonpersonal local study. Generated audio/weights stay out of Git. A human must listen to judge taste, unwanted vocals, distraction, artifacts, fatigue and narration intelligibility. Automated waveform inspection, generation success and muted browser decoding are not subjective auditioning. There is no Stable-versus-ACE winner until both have authorized real files and the user listens.

Final verification: production build, lint and typecheck passed; 170 unit tests and all 196 affected desktop/mobile browser checks passed without skips or flakiness. The Music Lab UI cases use clearly marked synthetic test tones, while separate real-file checks decoded and started/stopped actual ACE bed/narration/loop renders on both viewports (30/30/180 seconds). A real HTTP generation succeeded; active-worker and pre-acknowledgement cancellation were verified with no partial catalog record. Provider and microphone paths in older voice regressions remained mocked. Rendered desktop/mobile screens were visually inspected. No subjective audition or Stable generation is claimed.
