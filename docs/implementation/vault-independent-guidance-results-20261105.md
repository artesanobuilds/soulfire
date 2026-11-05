# Vault-independent guidance comparison — November 5, 2026

The candidate showed a small positive signal in this bounded comparison, while native voice still made unsupported drafting claims. Retain the general guidance as an experimental prototype improvement and keep **Sol text as the strong baseline**. Proceed with the next product work rather than waiting for full voice parity. This does not establish parity with the private vault, voice/text equivalence, clinical benefit or a general reliability rate. Nothing was deployed, merged or pushed by this task.

## What actually ran

The candidate prompt stayed frozen at `6a08401`; both arms used the merged runtime `00bc156`, including far-field input noise reduction, VAD threshold 0.65 and 1,500ms silence. Old instructions came from `a73e1b15`. Text used `gpt-6.1-sol`, production strict schemas and a 2,200-token cap. Native voice used `gpt-realtime-2025-08-28`, `marin`, `gpt-4o-mini-transcribe-2025-12-15`, 900 guide tokens and 512 welcome tokens. Exact effective instructions, settings, input WAV hashes, empty memory/history and no retrieval were checked. Test-only server instrumentation retained token usage without copying credentials or private environment files into the build.

All **18 text requests completed**, including both editable practice requests. **16 native connections were attempted; 14 completed welcome and guide responses**, with 28 native response-usage records. The two others stopped before user input, welcome or any model response. The completed voices had the full requested effective settings; there were no incomplete guide responses in that set.

The first native stop rejected an initial acknowledgement with null transcription and default VAD; the second exposed a broader default acknowledgement including a default prompt, unlimited cap and a different voice. These were **harness readiness mistakes**, not evidence that the provider ignored the final configuration or that the model gave bad advice. The guard was corrected and tested offline to keep the acknowledgement pending until the complete effective contract matched. It still blocks any welcome/input before matching and rejects drift after readiness.

The run stopped each time as specified. Two manual, documented amendments then continued **only previously unattempted original entries**. Failed orders 19 and 21 were neither retried nor replaced. Requested prompts, models, audio and effective settings did not change. All 34 originally planned tasks were attempted, with no added generation calls and no larger allocation. This is a disclosed deviation from a pristine preregistered uninterrupted run.

## Arm-masked review

The implementing agent reviewed shuffled random identifiers with arm labels removed and saved criterion ratings before inspecting their mappings. Four rating-file hashes and timestamps are retained in the [sanitized evidence](evidence/vault-independent-guidance-results-20261105.json). This is **not independent blinded human review**: the reviewer implemented the change, authored the cases, knew the design and could infer the arm of orphan cases. The four held-out situations were authored after prompt freeze, but by the same author.

Each response was checked against its case's predeclared required and prohibited behaviors. The table counts replies meeting **all** those criteria, not an opaque quality score. Borderline interpretations and cautions remain in the evidence. Ratings distinguish factual errors, missing specificity and delivery failures.

| Mode / arm | Completed / attempted | All case criteria met | Semantic criterion failures | Unassessed |
| --- | ---: | ---: | ---: | ---: |
| Text old | 9 / 9 | 8 / 9 | 1 | 0 |
| Text candidate | 9 / 9 | 9 / 9 | 0 | 0 |
| Native old | 7 / 8 | 3 / 7 | 4 | 1 |
| Native candidate | 7 / 8 | 5 / 7 | 2 | 1 |

The native aggregate rows include different orphan core cases and should not be treated as a matched head-to-head rate. The more defensible paired result is:

- **Text, nine complete pairs:** eight both passed; one candidate-only pass; no old-only pass.
- **Native, six complete held-out pairs:** three both passed; two both failed; one candidate-only pass; no old-only pass. Two core pairs were incomplete because their old/candidate counterparts stopped before input.

These are tiny samples with a strict subjective rubric. Binary ties do not mean identical helpfulness; a difference of one pair is not strong evidence of broad superiority. No user ratings or statistical-significance claim are supplied.

## Concrete findings

Both text arms already handled practical responsibilities, privacy and boundaries well. The small text difference concerned optional spiritual reflection: the old reply presumed a “need for a verdict,” which the user had not stated; the candidate avoided that specific presupposition, though its unresolved-experience framing also earned a caution. Both practice replies returned accepted, editable secular controls.

In the first property-return pair, old native voice recognized that transport was unavailable but still advised waiting out the hour and returning at noon. The candidate kept the return conditional on arranging transport or an agreed handoff. That was the native candidate-only pass. Both replies in the repeated property-return pair met the rubric; the result is not perfectly repeatable superiority.

Factual drafting remains unresolved. In the second confidentiality pair, old native voice added **“she's okay,”** although no health status was supplied. The candidate instead said **“She had something personal to handle,”** inventing an explanation for missing dinner that the input did not establish. Both failed. The first confidentiality pair preserved privacy without an invented explanation in both arms. Added instructions therefore did not eliminate this behavior.

Both native replies to the corrected-bill case allowed stopping without another call, but gave only vague reopening conditions (“a new issue” / “something truly new”). Both text replies supplied concrete conditions such as a fee returning, conflicting notice or a direct company request. The old native no-contact reply affirmed the boundary but omitted appropriate outside help or an immediate-safety check; the candidate counterpart was unassessed because of its pre-input stop, so that case cannot establish a candidate safety gain.

The parallel ASR transcripts from all 14 completed native sessions preserved the relevant supplied facts; observed “want to”/“wanna” and punctuation differences were immaterial. This does not prove the audio model heard everything correctly: native generation consumes audio, and the parallel transcript is not the text fed to a text reasoner. It provides no affirmative evidence that ASR caused the observed unsupported drafting details.

## Timing and cost

Complete text-response medians were **5.57s old** and **5.99s candidate** (nine each). Native first sustained decoded-audio onset medians were **2.50s old** and **2.39s candidate** (seven each), measured from the scheduled last non-silent synthetic input sample. These different metrics must not be compared as equivalent response latency, nor interpreted as a first spoken word or physical speaker measurement. The candidate did not show an onset penalty in this sample; this does not establish latency invariance.

Native guide transcript word-count medians were 46 old and 40 candidate. Measured remote-audio spans were 8.39s and 12.70s respectively; the distributions differ and are too small for a stable delivery claim. The candidate bundled shared guidance with a more flexible spoken-length target, so any observed gain cannot be attributed separately to content principles versus delivery allowance.

Recorded token usage estimates **$0.05053 text + $0.51696 native = $0.56749**, approximately **$0.57**. The native estimate conservatively gives no cached-input discount. Using the higher Sol cache-write rate for all uncached input produces a known-token upper estimate of **$0.57159**. These are rate-book calculations, not invoices. Separate ASR charges were not returned; their **$0.32 allowance** remains retained, as do failed/uncertain-session obligations. No exact total billed-cost claim is made.

The **full approved $10.15 stage reservation remains retained**; request-level obligations total $9.88 plus the declared contingency. No additional allocation, retry or unplanned generation occurred. The recorded guidance ledger is $28.4040549467 reserved against its $30 cap; the independently managed voice-baseline experiment is outside this stage's accounting. No further paid work is planned here.

Software checks on the final review branch: **240 unit/contract tests**, TypeScript and lint pass; the isolated merged-runtime production build and four compiled-route captures pass. The corrected full-default acknowledgement condition passes **19 evaluation-contract checks** and a synthetic browser welcome/guide check. Earlier broader synthetic browser results remain historical; they are not model-quality evidence.

## Recommendation and limits

Retain the candidate on its review branch as a modest prototype improvement: one extra all-criteria pass in each matched modality and no observed old-only pass on that measure. The text baseline was already strong. Do not describe this as achieving vault-level performance: **there was no vault arm in this new experiment**, and an earlier private single-case result is not a universal target or an independent benchmark.

Keep the strong text reasoner as the factual-support baseline. Treat native voice as experimental, particularly when supplying reusable messages or factual commitments. The separately assessed STT → strong text reasoner → exact TTS path remains an experimental alternative worth preserving; it was **not evaluated or promoted by this guidance study**. Do not replace it with an untested automatic routing claim or assert that more prompt clauses cure native factuality.

Move on with product work under these stated limits rather than holding everything for voice parity. Broader unfamiliar cases, independent review and real conversational/physical-audio testing remain useful future gates, but no further spend or deployment is necessary to close this bounded task. This task did not alter the original checkout, user preview or private vault. Strict effective-session attestation is part of this evaluator; it is not a new guarantee added to the product readiness gate.

The [prepared plan](situated-evaluation-plan-20261104.md), archived prompt hashes, failure snapshots, recorded synthetic audio, masked ratings and raw provider diagnostics remain available locally. Only fictional inputs/outputs and sanitized metrics are committed; private vault files, personal stories, credentials, provider/session IDs and raw audio are excluded from Git.
