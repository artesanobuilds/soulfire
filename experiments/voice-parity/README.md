# Voice quality baseline (prepared 2026-11-04)

Completed run: [2026-11-05 results](../../docs/implementation/voice-parity-baseline-20261105.md). The approved pilot completed within its dedicated cap; instruction matching passed, quality parity remains open, and the vault-inspired comparison is paused. Earlier preparation/gating instructions below are retained for reproducibility.

Status: offline preparation executed; executable adapters and a bounded subset are now available in [PILOT.md](PILOT.md); **zero new provider calls and no quality/parity result**. Separate clone/branch `experiment/voice-parity-baseline`, starting at `a73e1b15ced1958fc6d33277fddd8731027ca376`. The original checkout's uncommitted 1500ms VAD edit and vault-inspired candidate are untouched. No credentials or environment files copied. No deployment, merge or running-app changes.

## Reproduce offline preparation

From the repository root, with installed project dependencies:

```sh
env -u OPENAI_MODEL node_modules/.bin/vite-node experiments/voice-parity/capture.ts /tmp/instructions-capture.json
python3 experiments/voice-parity/study.py prepare /tmp/new-voice-study /tmp/instructions-capture.json --synthesize --kokoro-home /path/to/local/kokoro-home
python3 -m unittest discover -s experiments/voice-parity -p 'test_*.py'
```

Use a fresh output directory. `capture.ts` invokes the actual production request builder with an injected offline transport; it never invokes a provider. `--synthesize --kokoro-home` uses the existing offline Kokoro model (af_heart) and writes 24kHz mono PCM WAV fixtures; its home must contain venv, kokoro_say.py and cached model/voices. Without that option, macOS Samantha is available as a fallback but must pass the same duration/energy gate. These are controlled synthetic speech, not microphone evidence. The manifest freezes source hashes, exact instructions, source revision, contexts, tools, schema (inside captured production request), fixtures, model defaults and run IDs. Source defaults are not runtime attestations. Any partial preparation remains preserved; prepare refuses overwriting it.

Private study output is outside Git at `../voice-baseline-kokoro-private/`. Keep raw recordings, provider IDs, account details, transcripts and personal scenarios outside Git. The scenarios checked into this folder are independently fictional; no third-party story or vault excerpts are included. Do not import private prior outputs into this study as new matched evidence. The initial Samantha preparation returned zero-frame files despite process success; the failed directory `../voice-baseline-private/` is explicitly invalid and retained for audit. A waveform duration/energy gate now rejects such files.

## Conditions and causal boundaries

Eight one-turn scenarios, three repeats, five arms: 120 planned units. Four reasoning arms produce 96 generations; 24 TTS units reuse the exact matched-text answer without a second reasoning call. Randomized per-case/repeat arm order; TTS always waits for its dependency. Case history is empty, memory disabled, tools absent, language plain, practice title empty. Greetings are excluded from the controlled semantic baseline, with no greeting history sent. A later product-path test must include normal startup behavior separately.

| Arm | Input and instructions | Contract / budget | Interpretation |
|---|---|---|---|
| production-text | Actual Responses builder; source-default Sol | Strict production conversation schema, 2200 output tokens | Current source product reference, not frozen running server |
| matched-text | Same shared + spoken-delivery instructions as native | Raw text; Sol, 900 tokens | Removes production delivery/schema confound; experimental adapter still needed |
| native-text | Exact scenario text as a user text item; same matched instructions | Native gpt-realtime audio, 900 tokens | Bypasses input audio/endpointing; retains native generation/audio output |
| native-audio | Same recorded WAV for all repeats; same matched instructions | Native gpt-realtime audio, 900 tokens | Full recording manually committed, automatic VAD disabled in isolated harness |
| text-tts | Exact matched-text answer, no rewriting | Local TTS playback, no reasoning | Alternative architecture; end-to-end latency includes complete text + synthesis/playback |

Native-text vs native-audio narrows input modality differences but parallel ASR is diagnostic, not a view into native reasoning. Matched-text vs native-text still changes model, API, output modality, reasoning compute and token semantics; **it cannot isolate pure model causality**. Equal token caps do not equal compute or spoken length. Production-text vs matched-text measures a bundle of prompt/schema changes. No claim that a native model accepts text-only output with identical semantics is assumed.

All model aliases, effective server settings, reasoning defaults, response status, usage and schemas must be captured at execution. No inferred snapshot identity. Maintain separate source, request, effective-session and response hashes. Provider adapters are implemented and offline-verified in the separate bounded pilot; they are **not paid-tested**. The offline manifest does not certify that requests reached provider settings.

## Turn-taking and capture gate

First run a no-provider local peer/audio loopback with the intended capture pipeline; reject a harness with zero received energy. Prior standalone capture failed even while data-channel output completed. Do not spend retries diagnosing that again.

For controlled native input: await effective session acknowledgement; disable auto turn creation in the isolated harness, submit full frozen audio, commit once, then request one response. Record submitted bytes/duration and closing-qualification presence in parallel ASR. Preserve exact ASR and discrepancies. Assert one user turn, no early response, returned audio energy, completed output and matching configuration. A failed/incomplete/capped attempt is a delivery failure, never repaired or quality-scored as complete.

Run **natural turn detection separately**: same recordings with pauses spanning 200, 660, 1500 and 2000ms, source-default versus proposed 1500ms. Do not silently promote 1500ms into the semantic baseline. Record early responses, missed final clauses, interruptions and end-of-turn delay. Longer silence trades latency for completeness and does not solve every natural pause.

## Masked evaluation and presentation

After capturing outputs, normalize only answer envelopes (extract message or native transcript); retain exact wording and original raw file/hash. Provide `records.json` with run_id, status, answer, effective_config_verified, full_turn_verified and timing. The verifier flags must come from protocol checks and human transcript review, not defaults. Preserve every attempt, including uncertain billing and incomplete output. No automatic retries.

```sh
python3 experiments/voice-parity/study.py blind /tmp/new-voice-study /tmp/records.json /tmp/new-review
python3 experiments/voice-parity/study.py report /tmp/new-review /tmp/ratings.json
```

Give reviewers only review.json and ratings-template.json; withhold PRIVATE-key.json, provider traces and latency until scoring closes. Two independent reviewers should rate all outputs before unblinding and retain disagreements. Wording can reveal a condition, so masking is imperfect. Repeats and multiple ratings are dependent; report scenario-level paired results and delivery counts, not independent-sample significance.

Rubric: 0 = material failure, 1 = partly useful / material omission, 2 = meets criterion. Score factual grounding, absence of unsupported assumptions, decision usefulness and actionability with exact evidence. Scenario checks are reviewer-only, never in model input. Missing data is unassessed; `report` refuses incomplete scores. Its means are descriptive rating counts, not independent conversation pass rates. Record autonomy, secular preference and safety issues as veto notes. Held-out cases are fixed now and must remain unused for tuning the later candidate.

Presentation is a separate listening pass, using received native audio and actual exact-text TTS playback: intelligibility, warmth, interruptions, appropriate question count, and cognitive burden. Ordinary target: 2–4 sentences, roughly 30–60 spoken words, one next action, no spoken JSON/markdown or forced exercise offer. Safety support may exceed this. Measure word count and duration without treating brevity as factuality. Do not silently shorten answers to win latency.

Use the same monotonic clock definitions for both audio paths: final input sample -> first sustained returned audio, final input sample -> final audio, and text request -> full answer. Capture VAD wait separately. Report medians/ranges per scenario/arm; never compare native first audio to text full completion as model speed. Physical listening/microphone latency remains unmeasured by synthetic loopback.

## Budget gate and later convergence

Latest located private ledger: 2026-11-02, $18.2540549467 cumulative conservative reservations under a historical $30 cap; $11.7459450533 arithmetic remainder. Reservations are not invoices or blanket authority for new work. Historical attempts and uncertain charges stay reserved. No new cost was incurred here; proposed new paid ceiling **$5.00 total**, contingent on explicit authorization and a verified rate/reservation worksheet that fits it. This is a proposed hard cap, **not an estimate that 96 generations fit $5**. If the full design does not fit, preregister a smaller pilot before generation.

Before paid execution, obtain: current official prices/model availability and authorized account; per-arm input text/audio limits and context growth; output audio token/duration bounds; ASR separate charges; cache premiums; cancellation/timeout contingencies; finite attempt count; and current ledger owner confirmation that no concurrent experiment has consumed this allowance. Reserve each worst-case request before transport, persist the reservation, stop before exceeding the authorized cap, and retain reservations for missing usage. No rolling retries or implicit reuse of historical authorization. Without those facts, an exact trustworthy total cannot yet be calculated. Paid execution remains blocked on this gate; implemented adapters are described in PILOT.md.

After baseline and coordination with the vault implementation owner, freeze old and candidate instruction snapshots (no vault retrieval at runtime). Cross old/candidate x text/native voice with the same presentation constraints, fixtures and paired repeats; include held-out cases without retuning. A common budget/ledger owner must allocate spend across both tracks. Never read or modify the candidate checkout without coordination. Evaluate text-TTS as its own architecture, not an instruction effect. Decide a practical noninferiority margin before the confirmatory evaluation; three repeats on eight scenarios can guide a pilot, not establish broad parity.
