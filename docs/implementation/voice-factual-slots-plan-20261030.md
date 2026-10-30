# Isolated voice factual-slot candidate — 2026-10-30

> Historical experiment record. See [integrated status](integrated-discernment-20261030.md) for subsequent model selection, integration and current limitations.

Status: prepared offline; no paid generation and no production/runtime/build change. This follows the paired voice-instruction test. Its candidate improved direct help but produced an unsupported first-person availability claim and ambiguous attribution of a companion-only fact to a recipient.

The proposed revision changes only the prior isolated candidate's draft-generation policy. Before supplying first-person wording, preserve whether a value is endorsed, tentative, quoted or unknown. A request to confirm does not provide its answer. Give useful guidance with an explicitly unfinished slot, or ask one necessary question when a finished message requires that fact. Preserve each speaker and audience: telling the companion is not evidence of telling a third party. These are internal generation instructions, not a new evidence schema, routing classifier or output validator. Shared principles, direct-help delivery and voluntary reflection remain intact.

The private local bundle is at `~/Library/Application Support/soulfire-voice-factual-slots-20261030/`. It contains control/candidate prompts, 12 evaluation-only regression definitions, prior failure examples, frozen audio, session patches, runner, integrity tests and prospective plan. Original failing deadline and omitted-fact recordings are reused byte-for-byte. New synthetic audio is generated offline using the existing Kokoro voice; no user microphone recording or new provider is involved.

## Proposed finite live verification

Compare prior isolated candidate v1 with this candidate on five paired cases:

1. Original two-turn deadline case with unknown availability.
2. Same case with explicitly supplied Tuesday 2–4 pm availability.
3. Original two-turn omitted-fact case, preserving what the recipient actually heard.
4. Multiple speakers with different dates and an actual incorrect record.
5. Hypothetical concern followed by voluntary reflection.

Ten isolated WebRTC sessions, 16 guide responses, 10 welcomes, at most 26 responses. One sample per arm/case; alternate arm order. Hold model alias `gpt-realtime`, voice `marin`, transcription `gpt-4o-mini-transcribe`, VAD, audio recordings and 900-token guide cap constant. Welcome cap remains 512. Acknowledge exact instructions and effective configuration before input. Reserve each session before welcome; stop on the first technical failure, premature/excess response or configuration drift. No retries, extra probes or prompt tuning during generation.

Read actual transcripts for unsupported values, speaker/audience attribution, useful direct action, unnecessary questions and voluntary reflection. Score ASR misunderstandings separately. Report last non-silent injected sample to first sustained received audio with the existing detector; this is not first spoken word or physical-speaker latency. Keep incomplete outputs and all charges, including uncertain failures. This controlled-pause test does not assess natural turn-taking or establish clinical efficacy.

## Budget gate

Prior conservative reservations remain **$8.6737818267** against the approved cumulative **$9** cap, leaving **$0.3262181733**. The prepared session reservations sum to **$3.4529966933**; planned cumulative reservations would be **$12.12677852**. Proposed stage ceiling: **$4.25**, subject to cumulative ceiling **$13**. This requires **$4 additional authorization**. No paid generation has started. Reservations are conservative obligations, not reported billed cost; earlier uncertain charges have not been reclaimed.

## Offline verification and limits

Seven Node tests pass: regression-definition separation and availability minimal pair, isolated policy diff and prompt hashes, paired audio hashes/turn counts, production source/build hashes, session isolation/drift rejection, finite budget arithmetic, and dry mode with no browser/ledger creation. These verify preparation integrity only. The 12 case expectations are evaluator definitions, never model instructions or observed behavioral passes. Whether the prompt actually prevents the failures remains unassessed until authorized live testing.
