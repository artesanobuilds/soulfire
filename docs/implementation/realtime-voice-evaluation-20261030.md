# Current native voice evaluation — 2026-10-30

> Historical experiment record. See [integrated status](integrated-discernment-20261030.md) for subsequent model selection, integration and current limitations.

The actual running Soulfire voice experience was tested through **real browser WebRTC with synthetic speech input and native returned audio**. All five controlled scenarios returned both guide replies. Median time from the last non-silent injected user sample to the first detected non-silent received audio was **1.235 seconds** (10 replies; range **1.033–1.514 seconds**). This is an audio-onset measure, not first spoken word, physical loudspeaker latency, full-answer completion or model compute alone.

Guidance quality was mixed: the model repeatedly offered exercises instead of answering concrete questions, invented layoff causes in two cases, and prolonged checking in the secular case. The deadline was recognized. **This does not isolate a model difference from text:** the preserved running app uses older compiled guidance, while the text comparison used the newer retained source. Voice also has different instructions, output contracts and turn-taking behavior. No running app, default model or instructions were changed.

## Actual path and captured configuration

Five fresh isolated Chrome contexts exercised the existing local app's Live voice controls and `/api/realtime` route. `RTCPeerConnection`, the network, the provider and returned audio were real. Only `getUserMedia`'s input signal was replaced with controlled locally generated speech. No physical microphone, personal recording, real browser profile or persistent permission was used. Native browser audio was recorded from the received WebRTC track, not generated with local TTS. Browser playback was muted physically; no direct listening or physical-speaker quality is claimed.

The configured and session-reported model was **`gpt-realtime`**. The session did not report a separately dated model version; do not present the documented snapshot as independently observed. Captured effective configuration:

- Output voice `marin`, speed 1; native audio and transcript output.
- Parallel input transcription `gpt-4o-mini-transcribe`.
- `server_vad`, threshold 0.5, prefix padding 300 ms, **silence duration 200 ms**, automatic response creation and interruption enabled.
- No tools; no text Responses JSON schema or `runCompanion` deterministic safety middleware. Model-level safety instructions remain present.
- Exactly captured 4,243-byte instructions, including the old unconditional principle/practice instruction and voice-specific additions. All five controlled-session instruction hashes match.
- Plain-language UI preference, with each fictional spoken prompt explicitly welcoming or rejecting the Twelve Step lens as appropriate.

Only the announced evaluation-only output ceiling changed: the server acknowledged **600 tokens per guide response** before input injection; the app's welcome request remained capped at 512. No instructions, model, voice, VAD or production configuration were changed. Three guide replies hit this test cap. That truncation is a bounded-test limitation, not evidence that the uncapped production default cuts off those replies.

Source references: `app/api/realtime/route.ts`, `src/components/VoiceControls.tsx`; compiled route hash and full sanitized effective session settings are preserved with the evidence. The initial generic `session.created` configuration was followed by the app's configured `session.updated` and the cap acknowledgement; review uses the effective configuration, not the initial generic defaults.

## Input conditions and recoverable harness issues

The same five anonymized scenario source utterances were synthesized offline with the existing Kokoro `am_michael` voice. Original WAVs and hashes remain intact. No paid TTS service or new provider was used.

1. A selector preflight failed before any voice session or paid generation. Its zero-reservation trace is preserved.
2. The first normal-pause native session triggered several premature responses between sentences. Two were cancelled by subsequent speech (`turn_detected`); the test stopped when an unexpected fourth response exceeded its count bound. It never assessed a complete scenario. This demonstrates turn-taking behavior under this fixture condition, not that the model cannot eventually understand a longer human turn.
3. A shorter-pause fixture then produced `speech_started` but no `speech_stopped` before timeout. Its ending contained less silence than the 200 ms VAD threshold and the synthetic source ended. This is treated as an input-harness failure, not an advice failure.
4. The final controlled condition retained every source word, shortened RMS-silent runs over 90 ms to 60 ms, supplied **800 ms of post-utterance silence**, and kept a zero-gain oscillator running as a continuous synthetic capture clock. VAD stayed unchanged. A premature response would immediately cancel/disconnect the trial. All five cases then completed their two input turns with exactly one guide response each.

There were **seven actual native sessions** total: two failed input-condition trials plus five controlled cases. Welcome and cancelled/uncertain generations remain in the budget. No failed trial was overwritten. The final controlled condition is closer to a continuous microphone stream at turn end, but deliberately compresses within-turn pauses; it is not a representative human speaking-style, accent, emotional speech or physical-device benchmark.

One long combined command failed automatic approval review before execution because that review hit its token limit; splitting offline preparation and the bounded launch resolved it. It created no model generation or charge evidence.

## Five-case outcomes

| Case | Actual guide behavior | Assessment and limitations |
| --- | --- | --- |
| Already disclosed layoff; uncertain perception | Both complete replies offer a reflection/exercise. The follow-up again asks to sort intentions rather than identifying concrete evidence for action. | Does not meet the direct-answer or bounded-checking goal in these two turns. No complete practical decision boundary was supplied. |
| Proven incorrect misconduct account | Mentions clarifying facts with care, then again proposes an exercise and a possible correction note. | Partial action recognition; does not provide the requested correction or clearly distinguish a proven false record from speculative concern. Both replies complete, so this gap is not caused by truncation. |
| Layoff fact omitted | Supports a brief note, but then adds “not voluntary, and not performance-related.” | Factual-grounding failure: the extra cause/characterization was not supplied. Permits appropriate clarification. Both replies complete. |
| Explicit secular preference | Stays secular, but drafts “I mentioned I was laid off due to restructuring.” Follow-up suggests one more recruiter conversation or deciding by end of day. | Respects language preference; fails grounding and bounded-checking goals. First reply is capped/incomplete, but the invented cause was actually generated before the cutoff; follow-up is complete. |
| Real availability deadline | Recognizes the separate time-sensitive request. Follow-up explicitly says to confirm availability by 4 pm and that confirmation can be sent now. | Preserves the duty in the observed portion. Both replies hit the cap, so complete-response quality remains unassessed. It does not justify abandoning the deadline in the name of surrender. |

The transcript of the synthetic input preserved the important layoff disclosures, actual error/omission, secular refusal and 3 pm/4 pm distinction in all ten controlled utterances. There were **18 punctuation/case-insensitive word edits over 476 source words**, including fictional organization names, spelling, article and number formatting differences. No critical factual inversion was found in manual review. This is a parallel ASR diagnostic: native audio reasoning does not wait on this transcript as a serial STT→LLM step, so ASR text cannot prove exactly what the native model heard. Wrong layoff causes in the guide replies were absent from both fixture source and ASR transcript.

These are product observations, not clinical efficacy or human-benefit evidence. The synthetic user does not demonstrate that a person felt helped. No voice voluntary-reflection case or deliberate user rejection/correction mid-reply was added outside the bounded five-case set.

## Audio timing and delivery

| Measure | Observation |
| --- | --- |
| Controlled guide replies producing received audio | 10/10 |
| Complete guide generations | 7/10 |
| Incomplete due to imposed 600-token cap | 3/10: secular first reply; both deadline replies |
| Last non-silent fixture sample → first non-silent decoded remote audio | Median 1,235 ms; range 1,033–1,514 ms; n=10 |
| Receipt of VAD `speech_stopped` → first non-silent decoded remote audio | Median 832 ms |
| Receipt of `response.created` → first non-silent decoded remote audio | Median 823 ms |

The detector uses 10 ms polling, 1,024-sample RMS windows and a 0.005 RMS threshold with sustained detection. Timings use a client monotonic clock and the scheduled source-audio non-silent endpoint. Browser scheduling, resampling and window/poll resolution introduce uncertainty. They include transport/VAD/inference/decoding effects; they do not measure physical microphone capture or human perception. Received audio recordings and convenience clips are preserved; clips are not the source of the latency measurement.

The earlier Sol number (median 4.631 seconds) measured a **complete nonstreamed structured text response**. It must not be subtracted from this first-audio number or used to claim a model-only speed ratio. A future Sol→TTS pipeline would need its own end-to-end measurement; it was not implemented here.

## Budget

All previous conservative comparison reservations remained **$2.2282548**, including its uncertain request. Both failed voice-trial reservations remained intact: **$0.7955917067**. The five controlled cases reserved **$1.6718517733**. Thus:

- Voice total conservative reservations: **$2.46744348**, below the announced $2.50 additional ceiling.
- Combined conservative reservations: **$4.69569828**, below the original approved $5 total and the announced $4.7283 combined ceiling.
- Known realtime token-usage-derived estimate: **$0.5337976** across controlled and earlier trials with usage available. Native input transcription is separately billed and not included in that figure; a transcription allowance was reserved per session. One early cancelled/disconnected response has no final usage event. Missing usage is not assumed free, and none of these estimates is an invoice/billing-ledger observation.

Rates and context accounting were checked against the [official realtime model page](https://developers.openai.com/api/docs/models/gpt-realtime) and [audio cost guide](https://developers.openai.com/api/docs/guides/voice-latency-cost): text input/output $4/$16 per million, audio input/output $32/$64 per million, with the full retained conversation reused on later responses. Input durations, actual observed instruction byte bounds, maximum outputs, framing, transcription and cancellation contingencies are recorded in the reservation plans. No previous failed reservation was released to fund a retry.

## What the evidence supports next

Separate text and voice delivery instructions are sensible: structured text practices and short, interruptible spoken replies have different contracts. This experiment supports investigating that design, **but does not prove that mode-specific tuning alone solves the quality difference**. Current voice used an older base prompt, a different model, native audio, different turn detection and an imposed output ceiling.

The next controlled experiment should first align the shared factuality/agency/optional-spirituality principles in an isolated voice configuration while keeping its native model and transport fixed. Then test voice-specific direct answers, brief turns and a useful optional question rather than a mandatory exercise offer. Evaluate endpointing against natural pauses separately. Do not tune the spiritual principles to prefer not sending, suppress legitimate reflection, or silently change the running app. Any new paid experiment needs a new bounded plan: this voice reservation ceiling has only about $0.033 left.

## Local evidence and verification

`~/Library/Application Support/soulfire-realtime-voice-evaluation-20261030/`

- `plan.json`, reservation plans and fixture manifests: announced conditions, rates, source hashes and input provenance.
- `normal-pause-attempt/`, `short-pause-run/`, `preflight-selector-failure/`: intact unsuccessful conditions.
- `continuous-clock-run/<case>/result.json`: effective sessions, sanitized lifecycle events, native transcripts, response usage/status and client timing observations.
- `continuous-clock-run/<case>/received-audio.webm`: full received native audio; `guide-turn-1.wav` and `guide-turn-2.wav` are convenience crops.
- `summary.json`, `transcripts.md`, `manifest.json`, `analyze.py`: measurements, exact source/ASR/guide transcripts, hashes and reproducible offline aggregation.

All paid work and browser processes finished. No physical microphone, user browser, default model, production instructions, VAD, app build or running server was changed. No deployment, publication, push, PR, external message or new provider occurred. Production-source/compiled-route hashes were checked; this task changed no runtime code and did not rerun unrelated unit tests as if they measured voice quality. Evidence/output bounds, effective-session assertions and audio checks executed in the isolated test. No remaining authorization or access blocker exists; the remaining limits are the declared input conditions, prompt/model confounds, output cap, sample size and lack of physical listening.
