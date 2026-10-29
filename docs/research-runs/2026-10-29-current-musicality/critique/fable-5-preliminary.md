# Preliminary musical-composition critique — Soulfire Current (ACE-Step 1.5 Turbo)

I read the six requested sources (the two evidence files live under `docs/implementation/evidence/`, not `evidence/`) and verified the conditioning path read-only in the pinned upstream checkout at `/Users/miguelalvarado/Documents/Codex/2026-10-26/task-2/music-models/ace-step-source` (revision `ca1e85f…`, matching the evidence manifests). I have not heard any audio; everything below about sound is marked hypothesis.

## TL;DR

The most likely cause of "odd notes and chord progressions" is a stack of three conditioning choices, each verifiable in upstream source: **(1) the adapter runs turbo with `shift=1.0` while upstream explicitly says the one parameter you must set for turbo is `shift=3.0`; (2) the prompt is a 480–505-character negation-heavy prose paragraph, while the model's caption channel is a tag-style soft conditioner with no CFG and no negative-prompt mechanism on turbo; (3) all harmonic/tempo control is soft text (`# Metas` block appended after the caption), the 36-piece catalogue gets no key request at all, and session "movements" are three independent seeds with no audio-level continuity.** A bounded matched-seed A/B on the installed turbo model can test each factor separately.

## Observations (verified in code/evidence, not heard)

**How conditioning actually works.** With `thinking=False` and all `use_cot_*` off (`scripts/run-music-model.py:33`), the LM path is skipped entirely (`inference.py` `use_lm` logic). The caption, BPM, key, time signature and duration are serialized into one text prompt — `# Instruction / # Caption / # Metas` (`constants.py:160`, `metadata_utils.py`) — tokenized with `max_length=256` (`conditioning_text.py:131`) and fed to the text encoder. So "C major" and "bpm 64" are *suggestions in prose*, not constraints. The current prompts (~170–200 tokens including instruction and metas) fit under 256, but the metas block sits last, nearest the truncation cliff.

**No CFG on turbo.** The pipeline force-overrides `guidance_scale` to 1.0 for turbo (`generate_music.py:312`) — guidance is baked into distillation. There is no knob to increase prompt adherence and no negative-prompt mechanism. The adapter's seven negations per prompt ("No drums… No vocals… no abrupt changes… not a treatment protocol") rely on the text encoder understanding negation, which such encoders do poorly; each negated noun ("drums", "vocals", "bright metallic sounds") is also a weak positive attractor in the embedding.

**`shift=1.0` contradicts upstream turbo guidance.** `docs/en/INFERENCE.md:354-362` in the pinned checkout: `guidance_scale` is auto-corrected for turbo, but `shift` is **not**, and "the only timestep/guidance parameter you need to set manually for turbo is `shift=3.0`." The adapter hardcodes `shift=1.0` (`run-music-model.py:33`), confirmed in every evidence record (`"shift": 1`). With 8 steps, a wrong timestep schedule plausibly degrades fine structure — note articulation, voice-leading clarity, harmonic definition.

**Inconsistent and partial metadata.** Catalogue pieces (`conceptId` set) get **no key request** (`requested_key=''`, `run-music-model.py:10`); only custom sessions get "C major". BPM is fixed at 64 for piano/acoustic regardless of intent ("lift" and "focus" also get 64) and omitted for ambient. Time signature is never set (`N/A`). The 90-second session pieces came back with `estimatedBpm: null` and tempo confidence 0.18–0.34, and key confidence 0.17–0.48 despite the C-major request — the soft conditioning is at best weakly honored (observation about the measured estimates, not about audibility).

**Sessions have no musical continuity mechanism.** "Opening / developing / closing" differ only by one prompt sentence and use three unrelated seeds. Nothing conditions a movement on the previous movement's audio. Upstream *does* offer mechanisms the adapter doesn't use: `reference_audio` (style transfer at low `audio_cover_strength`) and the `complete`/`extend` task types. So inter-segment key/tempo/motif coherence is luck; the system's own compatibility gate already concluded tempo confidence was insufficient and fell back to a quiet gap.

**Prompt monoculture.** Across all six intents, ~6 of 7 sentences of the prompt are identical boilerplate; intents differ by a single sentence, and all of them ask for the same thing in different words (sparse, gentle, restrained, no build). The 36 catalogue briefs add one near-duplicated "character" sentence. Taste diversity therefore rests almost entirely on the three palette phrases and the seed.

**One measured tension with the brief.** The 90-second pieces show loudness range 10.5–12.2 LU while every prompt requests "soft even dynamics." That is a wide measured dynamic range for ostensibly even music (again: a meter reading, not a listening claim).

## Hypotheses (testable, unheard)

1. **H1 — timestep schedule:** `shift=3.0` at 8 steps yields cleaner harmony/articulation than the current `shift=1.0`. Highest prior; it's the one documented turbo mis-setting.
2. **H2 — caption style:** a short, positive-only, tag-style caption ("solo felt piano, slow, sparse, warm, calm, C major, 64 bpm, consonant, instrumental") produces more idiomatic progressions than the 500-char prose with 7 negations and the policy sentence ("A musical preference request, not a treatment protocol" is pure in-band noise to the encoder and should be dropped from the caption regardless).
3. **H3 — missing metadata:** explicit keyscale on catalogue seeds and an explicit time signature improve tonal stability (key confidence is currently 0.17–0.48).
4. **H4 — session incoherence:** perceived oddness partly comes from segment boundaries, since movements are harmonically unrelated; `reference_audio`/`complete` conditioning would help. (Hard to test without listening; flag for the audio manifest.)
5. **H5 — sameness:** catalogue pieces cluster perceptually because conditioning is near-identical; only seeds differ.

## Proposed bounded matched-seed experiment (installed ACE-Step 1.5 Turbo only)

Factorial is unnecessary; run three two-arm comparisons, **same seeds in both arms**, 30 s each, existing offline runtime, existing metric pipeline, no new models or packages:

- **E1 (shift):** 6 seeds × {shift 1.0, shift 3.0}, current prompts unchanged. 12 renders.
- **E2 (caption):** 6 seeds × {current prose prompt, short positive tag caption with key/bpm folded in}, shift held at the E1 winner. 12 renders.
- **E3 (metadata):** 6 catalogue seeds × {current no-key, keyscale "C Major" + timesignature "4"}. 12 renders.

36 renders ≈ 36 × ~20 s end-to-end ≈ 12–15 minutes of generation, roughly 0.6 GiB of WAV before cleanup — inside the existing 2 GiB store budget and 8-minute-batch pattern if split into three batches. Record the same metrics (key/tempo confidence, LRA, onset rate, spectral centroid, chroma) as directional evidence only; the deciding measure is **blind paired listening by Miguel** (randomized A/B per seed, "which sounds more musically coherent / which would you keep"). Note one protocol caveat: with a changed caption or metas, the same integer seed does not mean "same piece, one variable changed" — the latent noise is the same but the trajectory differs; matched seeds only remove seed luck *across* arms, they don't create minimal pairs.

## Constraints, tradeoffs, limitations

- **No adherence knob exists on turbo.** CFG is fixed at 1.0 by design. If tag captions + shift=3.0 are insufficient, the remaining levers are the LM caption-rewrite path (`use_cot_caption=True` — currently off, adds latency and an LM dependency) or the non-turbo base model (not installed/approved here; out of scope by your constraint).
- **Soft conditioning ceiling.** Key/BPM will remain requests, not guarantees; "C major" as an assembly-compatibility aid is only probabilistically honored (current evidence suggests weakly).
- **Tradeoff on negations:** dropping "No vocals / no percussion" from the caption loses the only avoidance signal the system has; the safer edit is to keep one short negation ("instrumental, no vocals, no drums") and rely on the existing technical gates (onset rate, centroid) plus audition for leakage, rather than six.
- **shift=3.0 is a provenance change:** all 36 catalogue hashes and the pinned `generationSettings` would no longer describe new output; the catalogue would need regeneration or a dual-provenance record.
- **Listening limitations:** I analyzed prompts, code paths and summary metrics only. Chroma/key/tempo estimators at confidence 0.2–0.5 cannot establish what a listener hears; LRA says nothing about *which* notes are odd; none of the above confirms vocal leakage, instrumentation accuracy, or pleasantness. All H1–H5 remain hypotheses until the source-linked audio/MIDI manifest arrives and a human audition is done. No clinical claim is made or implied by any of this.