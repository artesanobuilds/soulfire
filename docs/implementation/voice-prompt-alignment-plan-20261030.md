# Isolated voice prompt alignment — prepared, not run

> Historical experiment record. See [integrated status](integrated-discernment-20261030.md) for subsequent model selection, integration and current limitations.

The next experiment is prepared locally. No paid generation has started, and no running app, default model, production source, VAD, voice or provider configuration was changed.

## Concrete treatment

The candidate reuses the retained source's factual grounding, agency, optional spiritual lens, bounded-checking and safety paragraphs verbatim. It retains contextual care and urgent-support safeguards while omitting text practice/control-generation instructions. A separate voice delivery layer directs the guide to:

- Answer the latest practical question with useful direct help before offering reflection.
- Use two to four short sentences, usually 30–60 spoken words, with safety needs allowed more room.
- Give a concise, editable phrase when wording is requested, using only supplied facts.
- Ask at most one useful, non-leading question when a material fact is missing or exploration is invited. Voluntary reflection is a legitimate new purpose; it is not automatically another checking loop.
- Avoid assuming insecurity, trauma, a hidden wound, a spiritual deficiency or another unreported motive.
- Finish a complete answer without a ritual offer; preserve concrete stopping/reopening conditions instead of repeated exercise or adviser rounds.

Spiritual principles accompany either chosen action; they do not determine sending versus waiting. Explicit secular refusal is respected. No scenario-specific response, named professional/organization, desired no-email verdict or outcome guarantee was inserted. The candidate is 6,322 UTF-8 bytes versus the captured 4,243-byte baseline. The draft is an instruction experiment, not a verified semantic fix.

The structure follows the [official Realtime prompting guidance](https://developers.openai.com/cookbook/examples/realtime_prompting_guide) on clear scope, brevity and removing competing instructions. No different Realtime model or newer API-specific feature was substituted.

## Paired finite experiment

Use the same `gpt-realtime` alias, `marin` voice, `gpt-4o-mini-transcribe`, server VAD and actual browser WebRTC path as the previous test. The exact existing WAVs, continuous synthetic clock, short internal pauses and 800 ms trailing silence remain fixed. No physical microphone or user browser profile is used. Natural-pause turn-taking is a separate later experiment; this stage does not change endpointing.

For each of the five unchanged core scenarios, run one fresh baseline session and one candidate session, alternating arm order by case. Totals: **10 sessions, 20 spoken user turns, 20 guide responses and 10 welcome responses**. No automatic retries, probes or extra cases. A failed/uncertain session retains its reservation.

Both arms get a **900-token guide ceiling**; the welcome remains 512. The historical 600-token baseline had three truncated replies, so it is contextual evidence only. Compare the candidate primarily with the fresh 900-token baseline: holding that ceiling constant makes this an instruction-bundle comparison. A 900-token cap is intended to reduce censoring, not guarantee completion. Preserve any cap failure and do not silently enlarge or rerun it.

Only the isolated session's instructions and token ceiling change via `session.update`. The browser must receive an acknowledgement with the exact expected prompt and ceiling before injecting speech. The effective model, voice, speed, transcription, VAD, tools and modality configuration must match the captured baseline. Every source/build and fixture hash is checked before paid execution.

Review direct answers, supplied-fact accuracy, unsupported inference, action on proven error/omission/deadline, secular preference and autonomy, bounded checking and optional curiosity. Keep ASR, delivery/cap failures and guidance quality separate. No prompt edits or tuning after results begin. Small samples and combined instruction changes cannot identify which individual sentence caused an effect; they do not prove clinical benefit.

Measure native audio onset again with the same detector, plus VAD-stop/response-created timing, duration, usage and status. The prior 1.235-second median is an observation to investigate, not a responsiveness guarantee or full-answer metric.

## Budget gate

Previous conservative reservations, including all failed/uncertain attempts, remain **$4.69569828**. The original $5 authorization therefore has only **$0.30430172** conservative headroom. No prior uncertain usage was erased or assumed free.

The new ten-session reservation book totals **$3.9780835467**; proposed stage ceiling **$4.25**. Planned combined reservations would be **$8.6737818267**. A **$4 increase** in authorization, raising the cumulative cap from **$5 to $9**, would cover the proposed stage ceiling while retaining prior obligations. The whole stage cannot run under the existing authorization. These are deliberately conservative reservations, not expected billed charges or invoice evidence.

The book uses the already verified text/audio rates, all retained context uncached, maximum audio output costs, source-byte instruction bounds, framing allowances, transcription and immediate-cancellation contingencies. Stop before each session if the stage or cumulative ceiling would be exceeded. No paid generation starts until the parent conveys the plan and obtains the budget increase; the runner defaults to a dry plan and requires an explicit post-approval launch flag.

## Prepared artifacts and local verification

Local root:

`~/Library/Application Support/soulfire-voice-prompt-alignment-20261030/`

- `candidate-instructions.txt`, `shared-principles.txt`, `voice-delivery.txt`: reviewable candidate and its source/delivery components.
- `baseline-instructions.txt`, `expected-baseline-session.json`: captured current-product control.
- `plan.json`, `tasks.json`, `session-patches.json`, `source-hashes.json`: frozen finite design, exact matching inputs and permitted updates.
- `run-paired.cjs`: prepared isolated browser runner; no live generation ledger exists.
- `contracts.cjs`, `contracts.test.cjs`: offline boundary checks.

**Nine offline tests passed.** They check that only prompt/ceiling fields change; stale acknowledgements and accidental model/voice/VAD/tool changes are rejected; both arms use identical five-case WAV bytes; prior reservations remain; the runner defaults to offline/no ledger; and source plus preserved compiled-route hashes are unchanged. Syntax and diff checks pass. These tests verify experiment isolation and spending gates, not model behavior or latency.

Turn-taking tuning, production integration, app restart, default-model changes and publication remain outside this stage. No new API access, account commitment, service or outreach was introduced.
