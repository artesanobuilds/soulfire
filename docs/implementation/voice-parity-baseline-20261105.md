# Voice parity baseline — 2026-11-05

Subsequent work: [budget reconciliation, independent review and further controls](voice-parity-reconciliation-20261105.md). The historical no-release budget stop below has been superseded; original observations remain preserved.

**Instruction parity is verified in the matched experiment; guidance-quality parity is not established.** Native replies still introduced a present action and changed a deadline's recipient even with identical guidance bytes, full input submission and no VAD cutoff. Keep the vault-inspired comparison paused. The strongest next architecture to validate is the same text reasoning path followed by exact-text speech; do not claim that the native model alone caused the gap.

## Frozen source, actual runtime and latest voice fix

The isolated checkout started this run at `555d899`, containing merge `d6ea83f` and voice change `37909e1`. Production `app/api/realtime/route.ts` SHA-256 is `a8d3b37abcfa71ed2773c6c225c41db9f3defd4c7309c7a7ba754b84fa64e85c`. No original checkout, existing server, model default or vault candidate was altered.

This was checked beyond Git ancestry. A fresh isolated Next 15.5.27 development runtime executed the actual `POST /api/realtime` at localhost port 3146. Provider fetch was intercepted and a dummy key used; the real route constructed FormData with `gpt-realtime`, 900 output tokens, `marin`, `gpt-4o-mini-transcribe`, far-field noise reduction and `server_vad` with threshold **0.65**, silence **1500 ms**, automatic response creation and interruption enabled. The route returned HTTP 200/application-sdp. Runtime PID, working directory, timestamp, effective source hash and request session are retained privately. The probe made zero provider requests and was stopped afterward. It verifies the compiled route's payload, not acceptance of that SDP by a provider or the user's pre-existing running server.

**Important transport limit:** paid generations used the isolated WebSocket/PCM adapter, not this Next route or production WebRTC/Opus. All 16 live native sessions acknowledged far-field filtering (provider-reported default strength 1). They deliberately acknowledged **turn_detection:null**, then the recorded-input arm submitted the complete frozen WAV, committed once and requested one response. This controlled semantic comparison bypasses pause/noise-triggered interruption. It does not test the 1500 ms VAD wait, threshold behavior, physical microphone or ambient noise. The latest far-field choice was exercised live; the latest VAD fields were verified in the actual route runtime but not exercised by the paid baseline. Do not describe this as full production voice-fix verification or production parity.

## Design and delivery

Four fictional development scenarios, two repeats each: missing availability, supplied Tuesday 2–4 pm availability, an actual Tuesday→Wednesday correction, and repeated uncertainty without new facts. Four reasoning arms produced **32 completed generations**; eight local TTS outputs reused matched-text answers with no second reasoning call. There were no retries, capped outputs, transport failures, missing usage or pending sessions. Four held-out cases remain unused. No private friend story or vault material was included.

The production-text arm exercised the actual `OpenAIResponses` request builder, application validator and frozen conversation schema (Sol, 2200 output cap). The matched-text arm used Sol with the native spoken-delivery bundle and 900-token cap. Native-text supplied the same scenario as text to realtime, while native-audio used the same recorded input for both repeats. Language plain, practice title empty, no memory, tools, greetings or prior history. Model aliases and reported identities remained exactly `gpt-6.1-sol` / `gpt-realtime`; no separately versioned snapshot was inferred. All models were present in the authorized account catalogue. The deprecated transcriber alias was also accepted in all eight recorded-input sessions; no substitute was made.

The matched-text request and every native effective session share exact instruction SHA-256:

`17250b48cf279c58323e142a68e0d8412d1ee63b78d151c3010bd440a6061898`

The actual Next route/runtime payload also matches that instruction hash. The two previous capture strings differed by a newline; that was corrected **before** this run, using the actual route's instruction composition for both. Source, request, code, schema, fixture and local synthesis asset hashes were frozen in the plan. Native audio submission and commit completed in all eight runs; every parallel ASR transcript is identical to its full source after ignoring punctuation, case and spaces. That is diagnostic evidence of complete transcription, not access to the native model's internal interpretation.

## Masked quality review

The reviewer received a randomized packet containing only source, rubric checks and exact answer, with condition/run IDs withheld. Ratings and their hash were saved before the key was opened. One implementing-agent reviewer performed the assessment; there were **no independent human raters or physical listening tests**. Style may reveal conditions. This review method was recorded before answers were inspected; it is a weaker substitute for the originally preferred independent human review, not an inter-rater reliability result.

Scores: 0 material failure, 1 partial/minor issue, 2 fully meets criterion. Counts below are descriptive **2/2 scores out of eight responses**, not population pass rates. Mild tense changes, unreported emotional framing and redundant commitments count as partial even when the overall answer remains usable.

| Criterion fully met | Production text | Matched spoken-delivery text | Native model, text input | Native model, recorded input |
|---|---:|---:|---:|---:|
| Factual grounding | 8/8 | 8/8 | 6/8 | 4/8 |
| No unsupported assumptions | 8/8 | 7/8 | 4/8 | 4/8 |
| Decision usefulness | 8/8 | 8/8 | 6/8 | 4/8 |
| Actionability | 8/8 | 8/8 | 6/8 | 4/8 |
| Material grounding failures (score 0) | 0/8 | 0/8 | 1/8 | 1/8 |

Concrete material errors:

- Native-text, missing availability: **“I'm reviewing my schedule”** invents an ongoing action. Another repeat acknowledged a future update without asking for actual availability or supplying a placeholder. The text arms used explicit missing-time placeholders.
- Native-audio, supplied availability: **“Let me know if that works before 4 p.m.”** transfers the user's deadline for replying to the recipient. Another repeat added “today” and a redundant future confirmation. The supplied Tuesday 2–4 pm itself was preserved.

Both native paths supported the actual weekday correction, and repeated-check answers generally gave a usable stopping point. Some native replies inferred worry or offered broad reassurance. One matched-text reply also asserted that uncertainty was uncomfortable; this was a mild unsupported-feeling issue, not an external factual invention. Excluding every minor/borderline judgment still leaves the two material native errors above and none in either text arm.

The eight TTS outputs received **exactly the matched-text answer bytes**. Their semantic ratings mirror that source and add no independent model-quality evidence. Local synthesis completed for all eight, but intelligibility, prosody, warmth, acoustic artifacts and physical playback remain unassessed.

## Usage and latency

All 32 generation usages and eight separate transcription usages were returned. Reported tokens: Sol 19,524 input / 802 output (16,818 cached input, 2,658 cache-write tokens); realtime 19,684 input / 3,893 output; transcription 842 input / 290 output. Estimated native response charges are $0.289208 and ASR $0.0025025. Sol estimate is $0.0164428–$0.0230878, spanning the documented 30-minute versus 12-hour cache-write prices rather than assuming an unreported write lifetime.

**Total reported-token charge estimate: $0.3081533–$0.3147983.** This is not an invoice or observed billing-ledger spend. All conservative allocations remain **$4.80 against the dedicated approved $5 ceiling**; low observed usage does not release those reservations for more experiments. No guidance-comparison funds were used.

Rates were checked on the official [Sol model page](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [realtime model page](https://developers.openai.com/api/docs/models/gpt-realtime), [transcriber page](https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe) and [audio-token accounting guide](https://developers.openai.com/api/docs/guides/voice-latency-cost). The transcriber is marked deprecated in current documentation even though this account and endpoint accepted the alias during the run.

| Observed timing | Median | Range | n |
|---|---:|---:|---:|
| Production text: request→complete structured response | 2.872 s | 1.781–3.281 s | 8 |
| Matched text: request→complete text | 1.988 s | 1.472–2.416 s | 8 |
| Native-text: input submission→first non-silent received PCM chunk | 0.378 s | 0.343–0.634 s | 8 |
| Native-audio: paced final input sample/manual commit→first non-silent received PCM chunk | 0.521 s | 0.412–0.830 s | 8 |
| Matched text→TTS: full text response + complete local synthesis | 4.299 s | 3.092–5.794 s | 8 |

These metrics have different endpoints. Do not subtract them to claim model-compute speed or equate PCM arrival with browser playback, first spoken word or historical WebRTC audio onset. Native median output PCM duration was 7.225 s with text input and 9.250 s with recorded input. Median answer words were 19.5 production text, 22.5 matched text, 20.5 native-text and 28 native-audio. The TTS implementation waits for complete local synthesis; it is not a measured streaming architecture. Case order, model caching, reasoning defaults and transport variability remain uncontrolled.

## Interpretation and next step

We can rule out **mismatched instruction bytes or premature input cutoff as sufficient explanations for these observed errors**. Errors occurred even when the native model received text directly; parallel ASR was complete in recorded-input cases. That supports investigating the native generation/output path rather than only continuing VAD or ASR tuning.

We cannot attribute the remaining difference purely to model weights. The comparison still changes model family, output modality, API behavior, default reasoning and token semantics. Equal 900-token caps do not equal compute or spoken length. Eight short development examples per arm and a single imperfectly masked reviewer cannot establish general parity, a stable failure rate or superiority across all tasks.

The practical path toward content parity is to prototype an explicit voice workflow through the same text reasoner, then speak its exact accepted answer without a second native rewrite. This study supplies a working isolated adapter and eight local outputs for that alternative, not a shipped product mode. The cost is additional wait and different turn-taking/prosody. Preserve native voice as an experimental option until the product path is tested; do not silently switch models or claim factual guarantees from a JSON schema.

Before the vault comparison: validate that alternative end-to-end through the real product, then use held-out scenarios, user corrections and longer turns. Independently verify the production WebRTC/VAD path with synthetic and real-microphone pauses/noise; do not spend the unallocated $0.20 on an improvised retry. A new bounded plan is needed for further paid evaluation, without reclaiming the $4.80 reservation. Instruction parity is achieved in this controlled baseline; **quality and production parity remain open**, so the separate guidance comparison has not started.

## Evidence and verification

Private root: `../voice-live-20261105/` outside Git. `pilot/` contains the plan, explicit approval record reference, all 32 reservations, exact requests/effective sessions, raw usage, returned PCM, eight TTS WAVs and immutable results. The enclosing folder retains account preflight, source/ASR review, masked packet, locked ratings, unblinding key, quality summary, usage aggregation and actual Next route/runtime probe. No personal scenario or credential is versioned.

[Sanitized numerical evidence](evidence/voice-parity-baseline-20261105.json) contains the aggregate results, configuration hashes and limits. Updated adapters pass **22 targeted TypeScript tests**, including a real localhost PCM WebSocket loopback, plus **nine Python tests**, TypeScript and targeted lint. The actual Next route compiled and ran in the isolated zero-provider probe. These implementation checks validate the harness and latest-control payload; they are not model-quality tests or production WebRTC parity evidence. No deployment, merge, push or original-server restart occurred during this evaluation.
