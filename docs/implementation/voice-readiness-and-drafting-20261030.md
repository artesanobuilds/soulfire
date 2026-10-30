# Voice readiness follow-up and factual-drafting options — 2026-10-30

## Completed reflection case and diagnosed race

The omitted final reflection case was retried once after preserving the known-terminated original attempt. The first attempt had no user input or model responses; the retry retained its full reservation and changed only the evaluator's readiness wait, not the app's session instructions or provider configuration.

The successful trace shows `session.created` with transcription `null`, followed by `session.updated` with the requested `gpt-4o-mini-transcribe`, without a client `session.update`. The earlier evaluator asserted the full configuration too early. This is evidence of asynchronous configuration settling, not evidence that the transcriber stayed disabled. The repeated case's actual input transcription preserved the request for one gentle reflection question without assumed motives. Guide: “Sure. What do you notice in your mind or body as you wait?” Both welcome and guide completed. Measured received-audio onset was **0.985 s** under the existing detector; one sample is not a latency estimate.

An initial local preparation attempt stopped before creating any session because a string replacement incorrectly changed the budget guard's cumulative bound. Its ledger has zero sessions and $0 reserved; it is preserved separately. The guard was corrected and its three boundary checks passed before the single paid retry. No hidden paid duplicates or discarded model failures occurred.

## Narrow application correction

Transport-open is insufficient readiness. The client now keeps the outgoing microphone track disabled and queues no welcome/history messages until the server reports effective transcription enabled, the intended native voice/VAD behavior and the 900-token output bound. It accepts a configured transcriber model rather than hard-coding the default, preserving operator overrides. A five-second readiness timeout stops capture with a recoverable message. Duplicate acknowledgements do not greet twice; stale acknowledgements after stop cannot revive capture. Observable configuration drift after startup stops voice. This changes startup gating, not normal per-turn model routing, VAD, instructions or audio delivery.

This is an observable audio-readiness check, not proof that every server field exactly matches an operator's desired model. It also does not validate the factual meaning of generated speech. The intended model remains configured by the server; stronger model-identity attestation would require passing expected server configuration to the client.

## Factual-drafting design options

The current native WebRTC path emits generated audio directly. There is no content validator before a phrase becomes audible. The existing text companion uses Sol plus strict output structure and application controls; its message string is still free text, so those validators cannot certify its factual content. The earlier evidence-frame experiment also failed source-reference validation and routing. A tool alone does not fix those mechanisms.

| Option | What it buys | Remaining failure / experience change |
| --- | --- | --- |
| Automatically let realtime call Sol to draft | Reuses the stronger text model and current provider credentials. | Realtime chooses whether to call; a skipped call recreates the old bypass. It can also paraphrase or add facts when speaking the result. Additional model/tool round-trip latency is unmeasured. No factual guarantee. |
| Explicit draft mode, with Sol generation and user review | Removes automatic routing: the user deliberately requests the text path. Normal voice stays fast. | Sol's draft can still add facts; user review is a safeguard, not deterministic validation. A structured schema alone is insufficient. |
| **Explicit draft mode with user-confirmed fields and deterministic wording** | Exact drafts contain only the user's supplied values and fixed neutral templates; missing required values stay visibly unfinished. No model decides source references or whether the guarded renderer runs. | A narrower writing experience. Native voice must stop/mute for this explicit mode, and the rendered text must not be handed back to realtime for unrestricted paraphrase. Ordinary voice advice remains probabilistic. |

**Recommended smallest safe next prototype:** the third option, limited to an optional user-invoked “Draft a message” action. Stop native voice using the existing resource cleanup. Let the person choose an availability confirmation, factual update or correction, and enter/confirm the actual fact in their own words. A deterministic renderer uses those exact fields; no background inference of missing availability, speaker or recipient knowledge. If a required field is blank, show a clearly unfinished template rather than a ready-to-use factual assertion. Nothing is sent or saved automatically. Optional Sol advice can discuss tone or discernment separately, but cannot silently replace the controlled factual text.

This avoids the rejected evidence-frame's model-selected routing and model-produced citation IDs. It also avoids an always-on classifier, serializing all voice through Sol, a new provider, or changing normal voice's first-audio path. It is not a global cure for native-voice factuality: a person who remains in ordinary conversation can still receive unsupported generated wording. Broad prevention would require a more restrictive voice output contract or buffering/validating all speech, with substantial experience and latency tradeoffs.

Before implementing that mode, a finite acceptance set should cover missing/supplied/tentative availability, multiple speakers, facts known only to the companion, actual correction versus hypothetical concern, input edits and mode cancellation. Prove that an absent value cannot appear in completed output, supplied values survive exactly, no inferred reason is introduced, and optional reflection remains accessible outside drafting. Live AI generation is unnecessary for the deterministic guarantee; any later optional Sol wording assistance needs separate adversarial validation.

Realtime supports function-call arguments, application-supplied results and a subsequent generated response, but that final response is model generation rather than an exact playback guarantee. See [official Realtime conversation/function-calling documentation](https://developers.openai.com/api/docs/guides/realtime-conversations). The recommendation above follows the actual Soulfire control boundary and observed failures, not a claim that function calling itself is unsafe.

The drafting mode is a design recommendation, **not implemented in this follow-up**. It materially changes how a person obtains reusable wording, so the plan is being returned before introducing that flow. The independently useful readiness correction and missing reflection test are completed separately.

## Final verification and retained limits

The follow-up passes **239 unit tests**, TypeScript, lint, an isolated production build and the complete desktop/mobile suite: **261 passed, one intentional skip**, no failed browser checks. Browser coverage explicitly verifies disabled microphone/no greeting while transcription is absent, delayed acknowledgement, duplicate acknowledgements, startup timeout, later configuration drift and stale callbacks after stop.

Two native sessions on the actual gated compiled build completed, producing three guide replies and two welcomes; all five responses completed. Both began with transcription-null and then received the requested configuration. Effective configuration acknowledgement occurred 172.9 ms and96.6 ms after data-channel open; welcome response creation followed acknowledgement by79.7 ms and67.2 ms. These are two startup observations, not a stable network-latency estimate. Guide received-audio onset median was **1.349 s**, range1.259–1.363 s, n3; no per-turn performance improvement or invariance is claimed.

The reflection response remained a single non-leading question. The deadline case still drafted “Confirming I’m available as discussed” despite no supplied availability or prior discussion. Therefore the readiness correction passes its narrow operational criteria while **factual drafting remains failed/open**. No prompt changes or factuality score chasing followed these outputs.

Cumulative conservative obligations are **$16.2540549467 of $30**, including all earlier failed/uncertain attempts and separately authorized private evaluation. These are reservations, not actual billing. No paid generation remains pending. Private raw evidence, recordings and protocol traces remain at `~/Library/Application Support/soulfire-voice-readiness-followup-20261030/`; only [sanitized metrics](evidence/voice-readiness-followup-20261030.json) are versioned. The active original app/build was not restarted. New startup behavior applies when current source is served.

Current unresolved work is maintained in the [canonical product roadmap](../strategy/product-strategy.md#current-prototype-roadmap--october-30-2026), including the explicit drafting design decision, natural turn-taking and broader cross-mode evaluation.
