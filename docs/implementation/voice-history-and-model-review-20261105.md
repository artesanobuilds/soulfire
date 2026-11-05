# Voice history and model review — 2026-11-05

## Decision

Stop this bounded parity pass. Use the existing strong text reasoner as the best-supported guidance baseline, with STT → text reasoning → exact TTS remaining an experimental alternative. Current native voice has unresolved grounding failures; neither broad parity nor an inherent ceiling on every voice model is established. Miguel's latest instruction permits deprioritizing parity: the parent may proceed to the separate vault-inspired comparison with this gap documented. No vault comparison, deployment, merge, or model upgrade was performed here.

## Implementation and controlled history check

The gated `/experiments/reasoned-voice` page now retains accepted user/assistant messages in page memory and sends the exact prior replies through the existing text provider. The route validates alternating history ending in a user turn, rejects empty or oversized history, disables durable memory, and uses the production text instructions, schema, model and 2200 output cap. Start new conversation clears history. A failed speech render retains the accepted reasoning reply; an ASR failure requires explicit draft restoration. No microphone starts automatically.

A fictional three-turn conversation tested tentative Friday availability, a correction to confirmed Monday/no Friday with a noon deadline, then a request for one reflection question without another message or exercise. Native used a continuing real WebRTC session through the current route; the alternative used real requests containing 1/3/5 messages. Exact preceding assistant strings were verified. Canonical typed input for the alternative isolates history from file-ASR errors, so this is not a complete fresh serial STT trial.

Native first reply invented “I'm available other times” and deferred confirmation despite the supplied deadline. It correctly handled the subsequent Monday correction and reflection boundary. The text alternative preserved tentative availability, then the correction and boundary. This single conversation is diagnostic, not a statistically meaningful parity estimate. Earlier blinded repeated controls and their grader disagreements remain documented in the reconciliation report.

All three native audio buffers reported stopped before capture completion. Native audible onset after scheduled input end was 2.38/2.32/2.80 seconds. Alternative full audio-ready server times were approximately 5.84/4.71/3.32 seconds; these endpoints differ and n=3 does not estimate p95. Physical microphone acoustics, interruption, the original VoiceControls welcome/UI and human listening remain outside this synthetic WebRTC check.

The first native initialization failed locally before input, response creation or ASR. Its zero-input trace was preserved before one initialization retry. The first successful text reply was restored locally without regeneration, then only previously unattempted turns ran. No duplicate paid first turn was made.

## Exact model identities and settings

| Path | Requested / observed | Snapshot and compute limits |
| --- | --- | --- |
| Native reasoning/speech | `gpt-realtime` / effective session `gpt-realtime` | Alias, not a verified dated backend snapshot. Metadata also recognizes `gpt-realtime-2025-08-28`; that does not attest alias resolution. Cap 900, Marin, speed 1, far_field, VAD threshold .65/silence 1500 ms/automatic response, no tools. No reasoning effort was requested or exposed. |
| Text reasoning | `gpt-6.1-sol` / Responses `gpt-6.1-sol` | No separately dated snapshot attested. Reasoning effort omitted, so default compute is not matched to native. Production/alternative cap 2200; prior matched raw controls cap 900. Structured output enabled. |
| Input transcription | `gpt-4o-mini-transcribe` / session acknowledges alias | File results provide text/usage, not an attested dated backend. Metadata recognizes alias and 2025-12-15/2025-03-20 IDs, but no silent substitution or snapshot claim. |
| Alternative speech | Local Kokoro-82M, `kokoro-v1.0.onnx`, `voices-v1.0.bin`, wrapper `kokoro-local-v1` | `af_heart`, speed .89; asset hashes in frozen experiment artifacts. Different voice/acoustics from Marin. No OpenAI TTS model was called. |

Read-only model metadata requests returned all six queried IDs successfully. These prove availability of IDs, not which weights served an earlier alias request. Frozen request/session artifacts remain outside Git.

## What official evidence supports

The original [gpt-realtime release](https://openai.com/index/introducing-gpt-realtime/) reports Big Bench Audio 82.8%, an audio-friendly MultiChallenge subset 30.5%, and ComplexFuncBench audio 66.5%, against an earlier realtime model. The [Sol release](https://openai.com/index/introducing-gpt-6-1-sol/) reports different coding/professional evaluations and a difficult user-flagged factuality set; its 7.7% error rate is not comparable to those audio scores. The [Sol system-card addendum](https://deploymentsafety.openai.com/gpt-6-1-sol) does not supply a matched head-to-head with this native model. These sources cannot yield a numerical quality ceiling or prove impossibility.

The [current realtime model card](https://developers.openai.com/api/docs/models/gpt-realtime) marks this configured model deprecated. [Newer voice models](https://openai.com/index/advancing-voice-intelligence-with-new-models-in-the-api/) show further capability improvements, so failure here does not establish a universal native voice limit. No newer model was substituted or tested.

[Realtime event documentation](https://developers.openai.com/api/reference/resources/realtime/server-events) explains that input transcription is a separate ASR process and may differ from native perception. A correct displayed transcript alone cannot rule out audio ingestion errors. Prior native text-in/text-out errors under matched written input make a model/configuration contribution plausible beyond ASR or audio rendering; weights, default compute, API behavior, alias resolution and output-cap semantics remain confounded. The [voice architecture guide](https://developers.openai.com/api/docs/guides/voice-agents) supports evaluating a chained architecture when reasoning control matters. This is an architecture candidate, not a deployment decision.

## Practical stop/go criteria

Proposed engineering acceptance criteria, not previously agreed product promises:

- No material invented user facts, wrong deadline/speaker attribution, incorrect next action, or ignored latest correction/boundary in a preregistered held-out set. A confirmed failure blocks promotion of that tested configuration.
- Evaluate multi-turn history, natural pauses, interruption, ASR recovery and physical microphone noise; retain the exact history and detect incomplete output. Use blind review of both returned words and actual audio.
- A future 20-scenario × 2-repeat pass can expose failures, but is not enough by itself to claim tight statistical noninferiority. Freeze instructions/settings and report uncertainty and repeated failures.
- Proposed latency targets: native audible onset median ≤3 s/p95 ≤5 s; chained full audio-ready median ≤5 s/p95 ≤8 s, subject to Miguel's acceptance and measured on the real UI. These are different user milestones and must stay labeled.
- Keep the approved $5 total protected; any later provider/configuration test needs a bounded allocation. Proposed ordinary-turn API target ≤$0.05 excludes hosting/local synthesis resources.

Current native is no-go for a claim of parity because grounding failures persist. The alternative is go for continued local user evaluation, not production promotion. Further unbounded tuning of this deprecated alias is lower value than the separate instruction comparison. Any later native upgrade should be explicit and separately frozen.

## Budget and verification

Final known usage estimate across the voice effort: **$0.6018081–$0.6124331**, not an observed invoice. Completed usage charged at deliberately inflated uncached bounds gives $4.181984; round up to $4.25 and retain the full unknown-request reservation $0.0256. Protected total **$4.2756**, safe headroom **$0.7244**. Original ledgers and failed-request evidence remain preserved; reservations are reconciled only with complete usage or proven zero inference. No further paid run is necessary for this conclusion.

Twelve targeted tests pass (history helper 3, route 5, spoken companion 4), TypeScript and changed-file ESLint pass. The native route source hash remains `a8d3b37abcfa71ed2773c6c225c41db9f3defd4c7309c7a7ba754b84fa64e85c`, incorporating the requested voice timing/noise fix; actual runtime session settings were checked, not merely ancestry.

## Local listening handoff

Open http://127.0.0.1:3150/ on Miguel's machine. It serves six shuffled A/B clips from this fictional three-turn check, optional returned words and downloadable local notes. Replay has no model cost. Identity key is outside the served folder. A muted browser check verified six clips, advancing playback, zero external requests and zero microphone calls. The optional local recorder requires Miguel's explicit click/browser permission and does not upload or test cloud VAD. Human listening and a physical-room microphone check genuinely require Miguel's participation; they do not block moving to the separate vault comparison under his revised sequence.

The paid Next test server was stopped. Only the static listening server remains. Private raw artifacts, audio, budget proofs and key are under `../voice-history-20261105/`; sanitized evidence is committed alongside this report.
