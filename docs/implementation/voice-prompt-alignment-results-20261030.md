# Paired native voice prompt results — 2026-10-30

> Historical experiment record. See [integrated status](integrated-discernment-20261030.md) for subsequent model selection, integration and current limitations.

The candidate gave more direct practical help while the old prompt mostly offered exercises. **Factuality is not fully solved:** the candidate's availability draft asserts information the user did not supply. All testing remains isolated; production code, the running app, model defaults and VAD are unchanged.

## Completed design and fidelity

Ten native-WebRTC sessions finished: five baseline, five candidate. Each arm returned ten guide replies plus five welcomes. All **20 guide replies completed**, with **zero cap truncations, disconnects or retries**. Both fresh arms used the same 900-token ceiling, model alias `gpt-realtime`, voice `marin`, transcriber `gpt-4o-mini-transcribe`, effective VAD and exact same synthetic input WAVs/clock. Effective session assertions and source/build/fixture hashes passed. These are actual browser audio exchanges, not text probes or a WebSocket proxy.

Arm order alternated by case. The candidate bundle updates shared factuality/agency/safety principles and voice delivery together. It cannot identify which individual sentence caused an effect. The prior 600-token baseline is contextual only; quality and timing comparisons below use the fresh matched 900-token control. Model alias did not expose a separately dated underlying version. One sample per case/arm and model-aware implementing-agent review limit generalization; no clinical efficacy claim is made.

## Observed guidance

| Case | Fresh baseline | Candidate and residual limitations |
| --- | --- | --- |
| Already disclosed; unknown perceptions | Twice asks to try an exercise instead of answering what would justify follow-up. | Identifies stated disclosure and unknown interpretation; gives a concrete stopping/reopening condition. “Just internal worry” can sound minimizing; emotional resonance is not established. |
| Actual incorrect misconduct record | Repeatedly asks to explore feelings/facts before shaping a step. | Recognizes the wrong record and supplies: “I was laid off, not dismissed for misconduct. Please update the record.” No invented layoff reason. |
| Relevant layoff fact omitted | Supports a short note and says to state it was a layoff, but repeatedly asks to begin drafting. | Provides brief wording directly. Initial “You stated the fact: it was a layoff” ambiguously refers to what was told to the companion versus the recruiter; the second reply states only the missing fact. This needs precision review. |
| Explicit secular preference | Remains secular; proposes a checking limit and another exercise rather than a concrete event-based stopping decision. | Remains secular and proposes pausing checks until actual clarification requests or feedback. No arbitrary calendar/adviser round. |
| Availability due by 4 pm | Initially centers an exercise; eventually advises confirming availability. | Prioritizes the actual duty immediately, but then drafts “Confirming I'm available as requested” without known days/times or confirmation of actual availability. **Factual-grounding failure remains.** Use a spoken placeholder or ask for the needed fact; this was not silently corrected/retested. |

The candidate permits factual correction and adding a missing fact, so success was not defined as “do not send.” Neither arm introduced a named layoff cause in this fresh comparison; the historical restructuring/performance errors must not be counted as failures in this control. The treatment clearly changes directness, but this small experiment does not demonstrate universal factual improvement. Explicit voluntary reflection/curiosity was not elicited, so its preservation remains unassessed. No assumed hidden-wound diagnosis was observed.

## Measured audio performance

| Measure, n=10 guide replies per arm | Baseline | Candidate |
| --- | --- | --- |
| End-input to first received non-silent audio, median | 1.125 s | 1.350 s |
| Range | 1.039–1.735 s | 1.042–1.763 s |
| Guide transcript words, median (range) | 56 (45–109) | 46 (24–69) |
| Detected received-audio duration, median | 18.124 s | 16.015 s |
| Complete replies / capped replies | 10 / 0 | 10 / 0 |

The candidate's group median onset is about **225 ms higher**. Across matched case/turn pairs, the median signed difference is +1 ms, with a range of −284 to +715 ms; these small, uneven samples do not establish latency invariance or a statistically reliable regression. Report both rather than selecting the more favorable statistic. The candidate still began audio around the historical 1.235-second neighborhood, but no guarantee of preserved responsiveness is warranted.

The measure is scheduled last non-silent injected sample to first sustained non-silent decoded received audio, on the client monotonic clock with 10 ms polling and 1,024-sample RMS windows. It is not first spoken word, physical loudspeaker latency, full-answer completion or pure model compute. Output duration is a separate signal; shorter replies do not establish that a person felt better helped. No physical microphone or subjective listening benchmark was run.

Both arms used identical compressed-pause input and post-utterance silence; natural-pause endpointing remains a separate stage. Native ASR produced 22 word edits/476 source words for baseline and 20/476 for candidate under simple punctuation/case-insensitive comparison. These include name/spelling/number-format differences. The omitted-fact ASR preserved “I did not explain that it was a layoff,” so the candidate's source-attribution ambiguity is not explained by a dropped ASR negation. The deadline/unknown availability distinction also remained in ASR. ASR is a parallel diagnostic, not the serial text input to native audio reasoning.

## Cost, state and evidence

Stage conservative reservations: **$3.9780835467**, below the $4.25 stage ceiling. All prior failed/uncertain obligations remain reserved at **$4.69569828**. Combined reservations are **$8.6737818267**, below the approved $9 cumulative ceiling; remaining conservative headroom is about $0.3262. No extra trials were run.

Known realtime token-usage-derived estimates are $0.497884 for baseline and $0.4594848 for candidate, **$0.9573688** total. Parallel transcription is separately billed and excluded from that estimate; its allowance remains reserved. These are rate-book estimates from returned usage, not invoices or billing-ledger facts. All 30 current response usage events were available. Cache/load variation and small samples prevent production cost/latency extrapolation.

Local evidence root:

`~/Library/Application Support/soulfire-voice-prompt-alignment-20261030/`

- `summary.json`: per-arm metrics, paired timing differences, response statuses, exact ASR/guide text and residual review notes.
- `transcripts.md`: readable source/ASR/guide transcripts.
- `paired-run/<case>-<arm>/result.json`, `received-audio.webm`, `guide-turn-1.wav`, `guide-turn-2.wav`: actual session/protocol/timing/usage evidence and native received audio.
- `paired-run/ledger.json`, `run-status.json`, `results-manifest.json`: completed state, reservation trace and hashes.
- Frozen prompts, plan, session patches, runner and nine passing offline isolation/budget checks remain available.

Both browser and analysis processes have finished; no blocker or pending paid generation remains. Production-source and compiled-route hashes remain unchanged. No deployment, restart, default switch, public publication, account change or outreach occurred.

## Interpretation

This supports a voice-specific delivery layer with shared principles: direct help improved under the same native model and transport. It does not show that prompt changes eliminate factual errors, that all individual clauses are necessary, or that the candidate is ready for unattended production use. Before promotion, address unknown factual slots and clarify speaker/source attribution; preserve optional, user-chosen reflection and legitimate communication choices. Natural-pause turn-taking remains separate, as planned. No further tuning or paid tests were performed after these results.
