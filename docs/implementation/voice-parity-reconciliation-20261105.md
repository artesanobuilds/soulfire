# Voice parity: reconciled budget, independent review and further controls

**The previous “$5 exhausted” stop was an overly conservative reservation rule, not observed spending. Completed requests can safely be reconciled without deleting their history. The same authorized ceiling supported further tests. Known token-charge estimates now total $0.5369063–$0.5471438, with one unresolved transcription still protected at its full $0.0256 allocation. Conservative commitments are $3.7756, leaving $1.2244—not a budget blocker.** No invoice or global account billing statement was observed.

The new evidence strengthens a **configured-model/backend contribution**, while still not isolating model weights. It also supplies a more faithful experimental voice architecture: the actual text reasoner followed by exact local speech. Broad native or production-UX parity remains unsupported. The vault-guidance comparison has not started.

This supplements [the matched baseline](voice-parity-baseline-20261105.md) and [the first exact-speech follow-up](reasoned-voice-followup-20261105.md). Their original ledgers, findings and first-run failures are preserved; their permanent-reservation stopping rule is superseded by the explicit continuation/reconciliation request.

## Why the old reservation was not money spent

Initial guards reserved the full maximum before each request and never released unused capacity. That was appropriate for an uncertain or unfinished request, but unnecessarily froze the entire $5 after all generation usage had returned. The user authorized a $5 API charge ceiling, not permanent consumption of every pessimistic request maximum.

The revised ledger separates historical maximum reservations from current liability. It verifies completion, usage coverage and unique response IDs; unknown requests retain their full allocations. For completed requests it **ignores every cache discount** and prices every native input/output token at **$64/$128 per million**, double the documented most expensive audio rates. Sol tokens use **$10/$20**, double the highest cache-write/output rates; transcription tokens use **$32/$64**, far above that transcriber's $1.25/$5. The sum is rounded upward to the next $0.25. Every new request must fit protected completed liability + all pending reservations + its new allocation under $5. Reservations are written before transport; duplicate requests are rejected. Closing a recording early does not erase generation charges.

The initial 34 completed generations and ten transcription usages produced an inflated liability bound of $2.174316, protected at $2.25, allowing $2.75 of safe new headroom. Subsequent requests were checked sequentially against the same ceiling. Original ledger hashes still match; no failed attempt or uncertainty was deleted. API connections/bandwidth are not separately charged for this conversational Realtime API, unlike the newer, different GPT-Live duration product. See the official [Realtime cost section](https://developers.openai.com/api/docs/guides/voice-latency-cost#realtime-api-costs), [realtime model prices](https://developers.openai.com/api/docs/models/gpt-realtime), [Sol prices](https://developers.openai.com/api/docs/models/gpt-6.1-sol) and [transcriber prices](https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe).

A separate agent independently recomputed the arithmetic from saved JSON usage and IDs after locking its quality reviews: **57 unique generation IDs (30 native, 27 text), 23 completed transcription usage records, $3.742182 inflated completed liability, $3.75 rounded protection, and $0.0256 unresolved liability**. It verified both original ledger hashes and 30 new reservation snapshots. No discrepancies were found. This checks saved, instrumented requests; it does not attest unrelated account activity or invoice amounts.

| Final accounting | USD |
|---|---:|
| Known usage-derived estimate, including cache-write lifetime range | 0.5369063–0.5471438 |
| Unresolved file-transcription allocation, not assumed free | 0.0256 |
| Inflated completed liability | 3.742182 |
| Rounded completed protection | 3.7500 |
| Total protected + unresolved | 3.7756 |
| Safe headroom under the same $5 ceiling | 1.2244 |

The estimate is not invoiced spend. Its rates use reported modal/cache categories; Sol cache writes span $2.50–$5 because the write lifetime was not returned. The much larger protection above does not rely on cached pricing or that lifetime assumption. No guidance-evaluation allowance was borrowed.

## Six paired held-out tests with actual automatic VAD

Three previously unused cases—tentative availability, voluntary reflection, and a late concrete deadline—ran twice each. The frozen WAV for each case was identical across repeats and paths. The native path used the actual current Next `/api/realtime` route, real WebRTC, `gpt-realtime`/Marin, 900 output tokens, **far-field noise reduction, threshold 0.65, silence 1500 ms, interruption and automatic response creation enabled**. There was no manual turn commit or auto-response override this time. There was also no greeting or original VoiceControls UI/history: this is a production-style transport/route test, not complete original-UI validation.

All six native generations completed with one response each. Five parallel ASR strings were punctuation-normalized identical to source; one used “until” instead of “unless” in the waiting condition, with the full request and reopening meaning preserved. Parallel ASR remains diagnostic, not access to internal native interpretation.

Five serial file-ASR → text → local-speech workflows completed. The first file-ASR request failed at the local route with HTTP 502 and no retained provider usage/response. It was **not retried** and keeps its entire $0.0256. Its unattempted text request instead used the reviewed, complete native parallel transcript via the existing typed-input option. This was explicitly recorded as a recovery, not a successful independent serial transcription. All six text answers and local WAVs completed. The five genuine file transcripts preserved the source words after punctuation normalization.

An independent, fresh-context agent reviewed a randomized condition-masked 12-answer packet without keys or earlier ratings. An implementing-agent assessment was also locked before unblinding. Both found the same main issues:

- Native tentative-availability reply: **“I expect to know by tomorrow”** invents a future knowledge timeline and mishandles a duty to answer today. This is a material problem in this case.
- Text-reasoner reply: **“I can’t confirm today”** extends present uncertainty to the whole day without evidence. This was graded as partial, not a clean pass.
- The remaining reflection and concrete-deadline answers generally preserved the task, including the final noon/Monday-morning qualification.

The independent assessor gave each arm five of six full scores on grounding, assumptions, usefulness and actionability, with one material grounding failure for native and none for the text arm. These are three repeated scenarios, not six independent population samples; they do not establish equivalence. The typed recovery is included in semantic review but remains a primary-pipeline delivery failure.

## Important media-validity correction

Unpaid local transcription of the recordings exposed a harness defect I wrote. It could close after a 600 ms quiet interval once `response.done` arrived, even if audio playback had not finished. **Generation completion is not playback completion.** One voluntary-reflection recording stopped after “Sure”; its trace has no `output_audio_buffer.stopped`. That recording is invalid for complete audio delivery. The generated answer/usage is still complete and usable for transcript-only content review and billing reconciliation. Five of six other traces did receive the buffer-stop signal; local ASR differences in their audio are diagnostic, not human intelligibility judgments.

The corrected gate requires provider buffer stop, a receiver drain interval, and quiet after the last observed energy window. Tests reject a mid-reply pause despite generation completion. A **fresh media-only input**, not a rerun counted as new quality evidence, completed through real automatic-VAD WebRTC with buffer stop observed. Cached offline Whisper transcribed its whole native question, not just the opening. The exact-speech output likewise decoded as the full accepted question. This validates the corrected gate in one live case; it does not retroactively repair the invalid recording or prove every network/jitter condition.

The unpaid diagnostic used already-cached faster-whisper-base on CPU, with network disabled and no downloads. It transcribed 14 existing audio files; it can make its own recognition errors. Homophones such as “your”/“you’re” are not speech-content failures. No human listening, warmth, prosody or physical-microphone assessment occurred.

## Nine matched written-input controls narrow the cause

On missing availability, supplied availability and correct speaker attribution, each condition received the **same written source, exact instruction hash `17250b48cf279c58323e142a68e0d8412d1ee63b78d151c3010bd440a6061898`, empty history/memory/tools, no JSON-schema constraint and a 900 numeric output cap**:

1. Native model, audio output.
2. Same requested native model/configuration, text-only output.
3. Sol, text output, using the same instruction bytes and raw-text contract.

All nine generations completed and acknowledged the requested modalities. The independent reviewer received a separately randomized nine-answer packet. Native text-only improved the missing-value draft by using an explicit placeholder; audio output offered a holding promise instead. But **both native output modes treated which date was correct as unknown even though the user reported correctly saying Tuesday**. The Sol answer preserved that distinction and rejected an unsupported admission directly.

Independent full-grounding counts were native audio 1/3, native text-only 2/3, Sol 3/3. The implementing reviewer also flagged the same date-framing issue but graded its severity differently. More generally, the independent review of the original 42-item packet agreed on weaker native full-score coverage but did **not** endorse the original reviewer's two score-0 grounding labels. Borderline severity is not unanimous; exact quotes and both locked ratings are retained.

These controls show that audio ingestion, turn detection, or audio output **alone** cannot explain every observed issue: an issue persisted with written input and text-only native output. That is stronger evidence for a configured model/backend contribution. It still does not isolate intrinsic model weights from default compute, API/system behavior, alias/version routing or token semantics. These are three targeted cases with one generation per condition, selected after seeing failure patterns—not new held-out generalization evidence. No stable effect size or universal native-model limitation is established.

## Product improvements and unpaid checks

The experimental exact-speech route now uses the **actual 2200-token text default**, removing its earlier 900-token mismatch. A real fresh upstream request was structurally identical to the production text builder's request for the same input: model, instructions, schema, tools/history/memory settings and output cap. It sends the accepted `reply.message` to local synthesis without another model rewrite. A failed synthesis still preserves readable text.

The transcription outage also exposed a stale-draft risk. Uploading a new recording now clears the submit-ready text while preserving the previous draft for **explicit restoration**. A failure cannot quietly submit the old question. A browser check with both APIs mocked proved stale submission stayed disabled, restoration preserved the draft, and no model request occurred.

`Server-Timing` now separates provider transport/generation time, local synthesis and total route time. These are future observability headers, not retroactive timings for earlier data or pure model-compute measures. The UI does not expose implementation diagnostics. Playback-gate regression tests, native text-only adapter coverage and budget reconciliation tests were added. Targeted TypeScript, Python, lint and typecheck results are retained with the evidence. No unrelated Current code was modified; its earlier known cleanup-race test history remains in the preceding report.

## Interpretation and remaining work

The common-text-reasoner architecture eliminates a separate voice reasoning/paraphrase step. For the controlled, reviewed one-turn input its final request now matches text, and accepted words are reused for speech. This supports **conditional content preservation**, not a claim of general voice UX parity or infallible text reasoning. The prototype remains optional and disabled by default; it lacks streaming, barge-in, original chat history/memory integration and broader microphone testing. One real transcription failure and one invalid old recording must remain visible in delivery assessment.

The next useful evidence is human listening of saved samples and a preregistered multi-turn/noisy-microphone cohort with a stated acceptance margin. Safe headroom remains; this round stops at its fixed cohorts rather than spending the rest on adaptive repeats. No case was rerun to replace a poor answer. Vault-inspired guidance testing remains paused because native quality parity and full product parity are not yet supported.

Private root: `../voice-reconciled-20261105/`; independent packets, locked ratings and budget audit: `../independent-review-20261105/`. [Sanitized evidence](evidence/voice-parity-reconciliation-20261105.json) contains aggregate numbers and limitations. Original checkouts, active original servers and main were not changed; the isolated test server is stopped. No deploy, merge or push occurred.
