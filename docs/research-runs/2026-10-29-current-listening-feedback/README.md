# Current: listener-informed catalogue replacement · 29 October 2026

Miguel requested new pieces, replacing the active originals. This run preserves source audio and research history without keeping inferior versions on the starter shelf. Application implementation and activation evidence are separate from musical-quality judgments.

## Research provenance

`raw/current-musicality-my-ratings.json` is the unchanged 15,886-byte upload, Library `libfile_c9730009bad88191bf25d29ed57b81a5`, SHA-256 `896ea6aa5152a00552254b8060981372963eaaa236afefc469c3d9d0601eabf7`. `mapped-ratings.json` resolves each blind display label through the embedded manifest. Null ratings are missing. Artifacts scale is 1 least distracting, 5 most distracting, verified against the original listening-page builder.

Preferred variants: In My Own Words C→original/shift1; Begin Again B→revised/shift1; Gentle Company A→revised/shift3; First Light B→revised/shift1; Familiar Afternoon C→revised/shift1; In the Meantime C→revised/shift3. Revised captions won five of six explicit preferences; shift was palette-dependent, not a universal winner. Progression and palette were generally strong; phrasing and endings were the primary weakness.

## Cause and response

`boundary-audit.json` compares 61 original/study sources with their normalized listening beds. Frame counts agree and amplitude envelopes track closely. Abrupt drops around 24–26 seconds already occur in model source audio. The original applet uses native audio playback, not a 25-second truncating envelope. Normalization did not create the problem. Long quiet tails were also present in the generated source.

The response is fresh 60-second generation with bounded mid-register palettes, longer note releases, repeated motifs, phrase-development and resolved-ending requests. These are conditioning requests, not guaranteed note-level control. Profiles follow the actual palette-specific preferences; other concepts use documented design hypotheses. No model, clinical outcome or global harmony winner is claimed.

72 fresh seed candidates were generated with the existing pinned ACE-Step 1.5 Turbo runtime; two per 36 eligible concepts. Four youth/crisis-ineligible concepts remain unavailable. One candidate per eligible concept is selected using transparent technical/boundary criteria, not a supposed musical-quality score. Selected playable duration is about 54–60 seconds. These are stereo compositions, **not independent stems**.

The finishing stage preserves the raw WAV, removes only terminal low-activity padding, applies a gradual 3–4-second release and checks post-fade quiet-tail length. Internal rests followed by music remain intact. Interior PCM outside fades is independently compared to raw PCM. This is an acoustic fade, not proof of a composed cadence. `draft-master-v1/` preserves the first mastering iteration; v2 bounded residual post-fade silence without any new model generation.

## Evidence and limits

- `rebuild-audio-verification.json`: all 72 real files, distinct PCM, hash/provenance checks, unchanged originals and interior PCM.
- `late-release-audit.json`: independent terminal-cliff and quiet-tail audit. Final maximum quiet tail approximately 1.23 seconds; no remaining flagged cliffs/long tails.
- `conditioning-token-budget.json`: all captions fit the actual model token budget.
- `real-catalogue-playback.json`: 36 actual bed files decoded; piano/ambient/acoustic play/pause/resume/Stop, exact archived bookmark lookup, desktop/mobile checks, no page errors or leaked audio contexts. Physical output muted; no microphone or human audition.
- 212 unit tests, 7 finisher tests and full 252 desktop/mobile browser checks passed. Production build, lint and typecheck passed.
- `catalogue-transcription-manifest.json`: all 72 final-master Basic Pitch transcriptions. Mixed-polyphonic inferred notes are not original scores, isolated voices or reliable note-edit instructions. Detector activations are not probabilities; MIDI 120 BPM is a transport grid, not measured tempo. Prior 61 original/study transcriptions remain in the earlier musicality run.
- `future-generation-proof.json`: a real additional custom generation through the local API proves the asynchronous path, separate from mocked tests.

`fable-pipeline-review.md` and `opus-catalogue-review.md` preserve requested BB model reviews under Soulfire project `proj_kf7hfprckp`: Fable 5 `claude-fable-5`, thread `thr_dpbiz7sugq`; Opus 5.5 `claude-opus-5-5`, thread `thr_q34egsutvd`. Their final review snapshots preceded completion of the two named QA artifacts and activation. Those operational observations were accurate at review time; they are not evidence that later QA never ran. Their caution about selection versus musicality and fade versus cadence remains valid. Activation occurs only with the original app stopped, avoiding a visible mixed catalogue while files are installed before the final atomic manifest.

## Reversible catalogue and saved references

A versioned policy retires the old 49 inventory records from active recommendations, including old comparison/development/custom records. Their files are not deleted; explicit saved UUID+PCM-hash references still resolve to the exact old audio, with an earlier-version notice. New custom generations remain active. The original policy/inventory is snapshotted before activation. Rejected new candidates remain staged for review. Missing/incomplete policy data fails safely instead of silently substituting another composition.

Weights, caches, runtime configuration, source/bed WAVs and private session databases remain outside Git. The bounded 6 GiB generated-result budget and 50 GiB free-disk floor can intentionally reject additional generations when full; rejected candidates consume space and must not be silently deleted to evade this bound.

## Listening review

`http://localhost:3197/refined/` offers six before/after pairs: Miguel's explicitly preferred earlier variant versus a brand-new selected composition. Both use the same measured playback loudness. Ending-preview seeks into the actual final 12 seconds. These are different compositions, not controlled note edits. One player, deliberate start, accessible Stop, no autoplay or external transmission. `listening-pairs.json` records exact lineage; `listening-page-qa.json` records actual playback verification.

Human audition is still needed to judge whether the new harmony, note choices, phrasing and fades are enjoyable. Objective checks cannot certify that improvement. No therapeutic efficacy claims, diagnostic personalization or genuine-stem claims are made. The unchosen Current customization layout concepts remain unimplemented.
