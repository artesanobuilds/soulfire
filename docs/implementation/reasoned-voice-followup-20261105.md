# Text reasoning with exact speech — bounded follow-up, 2026-11-05

**A working experimental product path now generates an accepted text reply once and sends that exact message to local speech. One previously unused held-out recording completed through this path and the updated native WebRTC route. This is feasibility evidence, not established parity.** All $5 of conservative voice reservations are now retained, so paid work has stopped. The vault-guidance comparison remains paused.

## Implemented in the experiment branch

The page `/experiments/reasoned-voice` supports typing or uploading a recording. Uploads use the existing `/api/transcribe` route; the transcript is editable before asking. The new `/api/experimental/reasoned-voice` route uses the actual `runCompanion` boundary, `OpenAIResponses` builder, conversation schema and validators, then the existing local Kokoro infrastructure. It sends **the exact accepted `reply.message`** to synthesis, records its SHA-256 and returns both readable text and a playable WAV. There is no second native-model paraphrase, model-selected tool routing or model retry. A speech failure retains the accepted text. Invalid model output is never spoken; cancellation prevents subsequent generation/synthesis.

This is an optional one-turn upload/text prototype, **not a replacement for live voice**. It does not provide streaming speech, barge-in, live microphone recording, conversation history, practice controls or memory. The API is disabled unless `SOULFIRE_EXPERIMENT_REASONED_VOICE=1`. It uses an explicit **900-token experimental text cap**, rather than the normal 2200-token text default. It preserves the production text instruction bundle and schema, not the native spoken-delivery bundle. Therefore the follow-up compares two product architectures; it is not a prompt-matched causal model experiment. No main/original checkout or existing running app was changed.

To inspect locally, provide the normal authorized server configuration and start this isolated checkout with the experiment flag on a free localhost port. The experiment server used port 3147 and has now been stopped. Replaying saved speech or retrying local synthesis does not require a new model answer; do not rerun the paid test or reuse its consumed authorization ledger.

## Budget was bounded before transport

The earlier pilot's **$4.80 remains reserved**, regardless of its much lower usage estimate. The final $0.20 was allocated before execution:

| Additional request | Reserved | Calculated conservative bound |
|---|---:|---:|
| One native WebRTC session/response, including parallel ASR allowance | $0.138 | $0.136392 |
| One file transcription | $0.012 | $0.01027875 |
| One text response, 900-token cap | $0.050 | $0.049150 |
| **Total new reservation** | **$0.200** | |

A server-side fetch guard persisted each reservation before dispatch, allowed only the three specific provider endpoints, verified models/caps/source fields and refused duplicates or a total above $5. It never released failed or low-usage reservations. No retries or additional model calls occurred. The account's previously verified exact aliases were retained: Sol, realtime, and the deprecated mini-transcriber; no substitute was made.

The bound for file transcription includes the frozen 9.496-second recording plus framing and the model's documented 2000-output-token maximum. The native bound also reserves its separate parallel-transcription usage. Text input is conservatively bounded by serialized UTF-8 bytes plus framing, the highest documented cache-write price and the full 900-token output allowance. Current price sources are recorded in the [baseline report](voice-parity-baseline-20261105.md).

## Controlled held-out case and actual WebRTC evidence

The previously unused **speaker-correction** case says the user correctly gave Tuesday, a colleague gave Wednesday, and nobody said the user was wrong. It asks whether to admit misspeaking. One frozen Kokoro recording was used for both paths. No rubric or ideal answer was sent to either model. The native answer and serial answer were reviewed as a randomized two-answer packet before its key was opened; one implementing-agent reviewer, no independent human rater.

Before any paid native session, a real browser peer-to-peer WebRTC loopback produced non-silent received audio and a recording (peak RMS 0.1073; 26,507 bytes). This prevented spending on the earlier zero-capture harness problem. The live check then called the **actual current Next `/api/realtime` route**, with real SDP negotiation, remote audio and data-channel events. Its source hash still matches the merged pause/noise fix: `a8d3b37abcfa71ed2773c6c225c41db9f3defd4c7309c7a7ba754b84fa64e85c` (voice commit `37909e1`, merge `d6ea83f`, already in this branch).

The provider initially acknowledged **server VAD, threshold 0.65, silence 1500 ms, far-field filtering (default strength 1), interruption enabled and automatic response creation enabled**, plus the requested transcriber, native model, Marin and 900-token cap. Thus the live route/runtime actually carried the latest fix; this was not inferred solely from branch ancestry or a mocked route.

**One explicit evaluation override:** after that acknowledgement, `create_response` alone was disabled to enforce at most one paid response. Threshold, silence, filtering and interruption settings stayed unchanged. The harness waited for VAD endpointing of the complete recording and parallel ASR, then explicitly requested a single response. No welcome was generated. This exercises the real WebRTC transport and latest VAD endpointing/filter controls, but not automatic turn-response creation, original VoiceControls UI/history/greeting behavior, physical microphones, ambient-noise handling or natural interruption UX. It must not be called complete production voice validation.

The provider reported one full user turn and one completed guide response. Parallel ASR and the serial file transcript both match the complete source after ignoring punctuation, spaces and case. VAD `speech_stopped` arrived **1688.3 ms after the scheduled end of the injected recording**; the first above-threshold received-audio window was observed **1230.6 ms after the explicit response request**. These single client-clock observations include transport/browser effects and are not model-only or acoustic timing estimates. There was no early endpoint in this recording. No claim is made about all pauses/noise conditions.

## Findings and confidence

Both answers avoided falsely admitting the colleague's statement as the user's mistake. The native answer preserved speaker attribution but reframed the issue as whether anyone “felt misled,” then gave conditional waiting advice. The serial text answer directly said not to admit an error the user did not make and distinguished a colleague's discrepancy from an error on the user's part. The masked reviewer scored native grounding/actionability 2/2 and assumptions/usefulness 1/2; the serial answer met all four criteria. The native difference here is a mild framing/directness issue, not a material invented external event. **One paired held-out case cannot estimate an effect, failure rate or parity margin.** Three other held-out scenarios remain unused.

The serial request completed through the real experimental page and API. The accepted-message hash matches the exact text passed to synthesis. The WAV was decoded and played in a separate browser check using saved data with both APIs mocked—zero additional provider calls. The file duration is **25.450667 seconds**; playback advanced 0.851 seconds and produced peak RMS 0.2194. The page was visually inspected. Physical listening, intelligibility, pronunciation, prosody and human helpfulness remain unassessed. Exact synthesis input is a content-preservation control, not a guarantee that every word is pronounced correctly.

This experiment establishes a functioning alternative that removes a second free-form speech rewrite. It does not make the text model factually infallible or prove general end-to-end voice/text equality.

## What this says about the model

The earlier matched pilot is the stronger diagnostic comparison: native text-input replies still made factual errors with exact matched instructions and no ASR/VAD cutoff. Therefore **ASR or turn-taking alone is not a sufficient explanation for those observed errors**. That narrows the investigation toward the native generation/output path.

It does **not** isolate inherent model-weight limitations. Model family, default compute, API contract, output modality and token semantics still differ. The present product-path follow-up additionally uses different delivery/schema contracts and only one case, so it does not strengthen pure model attribution.

A future causal study should preregister a balanced native-model 2×2: text versus complete recorded input, and text-only versus audio output, keeping the same effective instructions/history/tools and supported configuration. Compare native text-only output with Sol text output under the same raw-text contract, then speak both exact results with the same TTS. Test VAD separately through the production route. Improvement from native text-only over native audio output would implicate output mode; a gap persisting in native text-only versus Sol would be stronger evidence for a model/configuration contribution, while unequal internal compute would remain a limit. That design needs fresh bounded funding and repeated held-out cases; it was **not run** after exhausting this budget.

## Spend, verification and stopping point

All new usage was returned: native 1273 input/414 output tokens, Sol 1240 input/103 output tokens (1204 cached, 33 cache-write), native parallel ASR 111 input/31 output and file transcription 94 input/31 output. New reported-token charge estimate: **$0.02965635–$0.02973885**. Combined with the pilot: **$0.33780965–$0.34453715**. The interval retains the cache-write lifetime uncertainty. These are usage-derived estimates, **not invoices or observed billing-ledger spend**. Total conservative reservations are **exactly $5.00**; no remaining reservation was reclaimed. No further paid test is authorized by this consumed plan.

The full local regression suite had **267/268 passing** checks; one existing Current cancellation test hit an asynchronous temporary-directory `ENOTEMPTY` cleanup race. Its entire six-test file passed on an isolated rerun; no unrelated Current code was changed. All seven new service/route tests passed. TypeScript initially encountered duplicate generated `.next/types/* 2.ts` files after the development runs; these generated duplicates were archived privately after stopping the server, and typecheck then passed. Targeted lint passed. The real Next runtime compiled and served the new page/API and current voice route. Runtime/test complications remain recorded rather than presented as a uniformly green first run.

Private raw evidence, request guard, ledgers, plan, provider responses/usages, session events, native recording, exact-speech WAV, transcript review, locked ratings, screenshots and browser checks remain at `../voice-followup-20261105/` outside Git. [Sanitized numerical evidence](evidence/reasoned-voice-followup-20261105.json) preserves the aggregate results and causal limits.

**Stop:** the budget and sample size do not support a reliable parity conclusion. The prototype is reviewable in the experiment branch; no deployment, merge, push or original-server restart occurred. The separate vault-inspired guidance comparison must remain paused until an adequately funded, preregistered parity evaluation supports proceeding.
