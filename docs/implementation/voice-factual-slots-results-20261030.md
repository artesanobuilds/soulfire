# Isolated factual-slot voice test — 2026-10-30

> Historical experiment record. See [integrated status](integrated-discernment-20261030.md) for subsequent model selection, integration and current limitations.

The candidate did **not** fix the targeted factual errors. Do not promote it on this evidence. Production source, compiled build, model, VAD and running app were unchanged.

Ten isolated WebRTC sessions finished: five control and five candidate, eight guide replies per arm plus ten welcomes. Control was the previous isolated voice candidate v1, not the older compiled production prompt. The sole prompt change strengthened unknown-value and speaker/audience handling for drafts. Matched recordings, `gpt-realtime` alias, `marin`, transcription model, VAD and 900-token cap remained fixed. No retries, extra cases or tuning occurred. All effective-session checks passed.

## Actual outcomes

| Fixed case | Control | Candidate |
|---|---|---|
| Unknown availability, two turns | Failed: “I'm confirming I'm available as discussed” invents availability and prior discussion. | Failed: “I confirm I'm available” still invents availability. |
| Explicit Tuesday 2–4 pm availability, two turns | Used supplied time correctly without re-asking. | Used supplied time correctly without re-asking; first reply hit the output cap. |
| Layoff not yet explained to recipient, two turns | Added unsupported “not for performance”; later asserted “they inferred something” despite no evidence. | Correctly distinguished what recipient heard and unknown interpretation, but both drafts added unsupported “not performance-based” / “not a performance issue.” |
| Multiple speakers and an actual wrong date | Correct user time; did not adopt colleague’s date. | Same useful distinction; corrected only the user's time. |
| Voluntary reflection after deciding to wait | Respected decision, no exercise loop; generalized that mind wants certainty. | Respected decision, no exercise loop; generalized certainty/powerlessness. Both partially met open reflection, with unverified emotional explanations. |

Manual, model-aware review found unsupported external factual assertions in **3/8 guide replies in each arm** (unknown availability once, layoff-performance claim twice). These are observed counts, not estimated population failure rates. Candidate attribution was clearer in the omitted-fact case; the target draft errors still persisted. Neither arm asked unnecessary factual questions. Required deadline/correction actions remained supported. Tentative/conflicting values and disputed quotations were defined in offline cases but not tested live; secular preference was outside this focused sample.

## Delivery and timing

| Measure | Control | Candidate |
|---|---:|---:|
| Guide replies completed | 8/8 | 7/8 |
| Incomplete due to `max_output_tokens` | 0 | 1 |
| Median received-audio onset | 1.066 s | 1.398 s |
| Observed onset range | 0.921–1.204 s | 0.993–1.959 s |
| Median guide words | 32.5 | 42.5 |
| Median detected output duration | 10.225 s | 13.333 s |
| ASR word edits / source words | 25/373 | 26/373 |

Across eight matched guide turns, candidate-minus-control onset difference had median **+221 ms**, range **−7 to +940 ms**. The metric is scheduled last non-silent injected sample to first sustained non-silent decoded remote audio, using the same 10 ms RMS detector; it is not first spoken word or physical-speaker latency. Small single samples and network/model variability prevent a stable causal latency claim. This sample offers no evidence of preserving or improving responsiveness.

ASR variation mainly concerned fictional organization spelling, number formatting and contractions. The decisive missing-availability follow-up, supplied time, multiple-speaker facts and absence of performance information were preserved in provider transcripts. Realtime receives audio directly; the parallel transcription is diagnostic and not proof of its internal interpretation. Controlled pauses do not measure natural turn-taking.

## Evidence and spending

Private local evidence: `~/Library/Application Support/soulfire-voice-factual-slots-20261030/`. Inspect `transcripts.md`, `summary.json`, `qualitative-review.json`, `paired-run/*/result.json`, received audio and per-guide WAV crops, frozen `plan.json`, prompts, fixtures, runner and manifests. All 26 response usages were returned: 25 complete, one incomplete. Ten session statuses completed; no disconnect or technical retry occurred.

Stage conservative reservations: **$3.4529966933**. Earlier obligations retained: **$8.6737818267**. Cumulative reservations: **$12.12677852**, within approved **$13**, leaving **$0.87322148**. Known realtime response-token estimate this stage: **$0.7410712**, including welcomes and incomplete output; parallel native ASR is separately billed and unavailable, with its allowance retained. Reservations are not invoices, and uncertain prior charges were not reclaimed.

Seven offline integrity tests passed before and after execution; they validate isolation, frozen inputs, budget and dry-run behavior, not model factual reliability. No additional paid calls are planned. The finite experiment is complete; more prompt clauses are not justified by these results. A further design decision should consider a stronger constrained drafting path or declining to provide first-person factual drafts when required values are absent, while addressing the earlier evidence-frame prototype's routing/citation failures. Neither option has been implemented or proven here.
