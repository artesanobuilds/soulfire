> Completed November 5 under the approved $10.15 ceiling. [Actual results and disclosed execution amendments](vault-independent-guidance-results-20261105.md) supersede the pending-approval language in this historical preparation record. No further paid run is planned.

# Bounded situated-support evaluation — November 4, 2026

The candidate is frozen at `6a08401`; comparison baseline is `a73e1b15`. No production-model quality result exists. The [machine-readable plan](../../evaluations/situated-support-comparison-plan-20261104.json) gives exact counts, settings, bounds, stop rules and costs. This plan does not authorize spending.

## What can run without paying

`./node_modules/.bin/vite-node scripts/prepare-situated-evaluation.ts` is offline-only. It imports the actual text provider with a replacement capture transport; it cannot invoke a cloud model. It prepares baseline/candidate text and voice configurations for all 12 fictional cases. The baseline provider source is identical to the candidate provider source; only the frozen instruction bundle changes. Voice payloads are proposed harness configurations, not proof of provider acceptance or actual route execution.

Executed: 48 request configurations captured, no network calls. Maximum serialized text request was 10,994 bytes; maximum voice instruction was 8,357 bytes. Each model input contains only the fictional case, not its rubric, expected answer, vault content, memory or retrieved source. The [offline audit](evidence/situated-evaluation-offline-audit-20261104.json) records hashes and dimensions. Existing 240 unit tests and 44 mocked browser checks verify software contracts; they do not establish behavioral improvement.

Local inventory verified Qwen3 30B Q4_K_M via Ollama (`qwen3:30b`, model digest `ad815644918f0eaab341c12b67837cc6dd4562342cdaf118f83d5d554cb37226`) and other local models. The exact production models Sol and native Realtime are not present in that inventory. `python3 scripts/evaluate-situated-local.py` is restricted to localhost, verifies the installed Qwen digest and makes no downloads or paid calls. Its content-only probes use baseline/candidate voice instructions and typed fictional inputs with no speech or ASR. This is a surrogate sensitivity probe, not production-model validation. Do not substitute it for the actual paired run or infer model rankings from it.

Executed under a predeclared stop-on-delivery-failure rule: the first baseline response reached the 512-token cap (`done_reason:length`) after 13.261 seconds and did not produce a completed user-facing answer despite `think:false`. The run stopped without retries or candidate calls. [Original local result](evidence/situated-local-surrogate-20261104.json) is retained. Candidate semantics and the planned remaining seven local probes are unassessed. This is negative evidence about this surrogate configuration, not about production Sol/Realtime or candidate quality.

## Held-out meaning and scope

The original eight cases are development regressions. Four more cases were authored after the candidate prompt was committed: property return under a deadline, confidential information and a one-sentence boundary, a corrected billing issue with repeated checking, and explicitly welcomed spiritual reflection. They were not used to implement the prompt. They are same-author held-out cases, not an independent author set. Freeze the prompt even if probes reveal failures; a revision requires a new unseen test set. No private story or vault excerpts appear in either corpus.

## Proposed production-model study

Seven selected cases keep the first paid stage bounded while preserving generalization and counterexamples:

- Existing shift handoff, no-contact counterexample and practice compatibility: one sample per arm.
- New property-return and confidentiality cases: two samples per arm.
- New corrected-bill and welcomed-spiritual-reflection cases: one sample per arm.

This yields **18 text requests** and **16 native voice sessions**. Voice excludes practice-control generation, which voice does not support; that is tested in text. Each voice session permits exactly one welcome and one guide response. Reverse arm order for the second sample; alternate first arm across cases. No retries or extra conversations. This tests a whole instruction bundle, including its changed spoken-length allowance; causal attribution to individual clauses needs a later ablation.

Text requests use exact ID `gpt-6.1-sol`, production structured-output validation, 2,200 output-token cap, `store:false`, no memory/retrieval/tools, and production default reasoning/temperature omissions. The inspected official documentation does not offer a separately pinned Sol snapshot; record reported model and usage and stop if arms resolve differently.

Voice requests pin `gpt-realtime-2025-08-28`, `marin`, transcriber `gpt-4o-mini-transcribe-2025-12-15`, 900 guide tokens and 512 welcome tokens. Both arms use acknowledged server VAD with 1,500ms silence, interruption and automatic response enabled. That is a matched harness condition using the separately verified VAD setting, not a source change on this branch. Empty history, same synthetic name, same user WAV bytes and maximum 30-second user fixture including pauses. Six fixture WAVs have now been generated with the existing offline Kokoro engine and validated before payment: 11.206–16.768 seconds, 24kHz mono PCM, no clipping or silent file, matching SHA-256 hashes. No time stretching or pause edits. See the [signal manifest](evidence/situated-audio-fixtures-20261104.json). These are signal checks, not listening or ASR verification. WAVs are retained locally under `test-results/situated-audio/`; reproduce with `scripts/prepare-situated-audio.ts` and verify with `scripts/check-situated-audio.py`. Never shorten pauses after seeing outputs. No microphone or cloud TTS. Natural turn-taking and spontaneous multi-turn use remain outside this first stage.

Current official pages mark the requested voice and transcription models deprecated. Before any paid call, check exact account availability without inference and verify effective session settings. Stop on unavailable IDs; do not silently change models or adopt a newer model under this comparison. A model replacement would need its own revised matched plan.

## Cost ceiling and gate

Authoritative recorded reservations: $18.2540549467 of $30; available $11.7459450533. **Proposed additional allocation: $10.15**, leaving $1.5959450533 of prior cap. No allocation has been added to the ledger and no paid evaluation has started.

Current [Sol pricing](https://developers.openai.com/api/docs/models/gpt-6.1-sol) is $2/M input, $2.50/M cache writes and $10/M output. Use the higher $2.50 input rate with no cache discount: 12,288 input tokens plus 2,200 output tokens gives $0.05272; reserve **$0.06/request**. The byte bound includes the full captured schema-bearing request and overhead allowance, not just user text.

Current [Realtime pricing](https://developers.openai.com/api/docs/models/gpt-realtime) is $4/$16 per million text input/output and $32/$64 per million audio input/output. Reserve **$0.55/session**. The plan conservatively accounts for two full 12,288-token text contexts, all 1,412 output tokens at both text and audio output rates, up to 30 seconds user audio at 100 tokens/second, 1,024 framing audio tokens, replayed prior greeting audio/text, $0.02 separate [ASR allowance](https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe) and $0.03 immediate-cancel allowance. Computed session estimate is $0.408464. Preflight must validate these assumptions before running.

18 × $0.06 + 16 × $0.55 + $0.25 global contingency = **$10.13**, rounded to **$10.15** proposed ceiling. This is a conservative operational reservation, not an invoice guarantee. No Fast/Ultrafast/regional premium, automatic retries or cache-saving assumption. Stop if price/account settings, fixture size, effective model, unexplained responses or token accounting invalidate the bound. Contingency cannot purchase more test cases. Re-read the ledger, obtain clear stage authorization and reserve before the first paid call; retain failed and uncertain obligations.

## Assessment and blockers

Evaluate blinded arm labels where possible, per case and criterion, with direct fictional-output evidence. Separate unsupported facts/commitments, practical specificity, boundaries, non-leading reflection, language preference and brevity. Keep refusals/incomplete output and schema errors as delivery results; do not silently exclude them. Preserve exact voice ASR and mark material transcription differences before evaluating content. Measure complete text latency, first sustained audio relative to input/VAD end, full spoken duration, word counts, cancellations and token usage separately.

Do not claim improvement from shared prompt source, mocked contracts or local surrogate results. The finite paired stage can reveal regressions and bounded improvement; it cannot establish general parity with the vault or clinical usefulness. Independent unseen authorship and human review remain needed.

Immediate paid blocker: explicit authorization for the proposed $10.15 stage is pending. All three exact IDs returned HTTP 200 through read-only model metadata requests; this is not inference compatibility evidence. The paired harness is now adapted and offline verified. It will recheck availability and the current budget before reserving the stage and starting generation. Effective native settings and actual inference remain live acceptance checks, with stop-on-failure and no retries. No paid model should be invoked while approval is pending.

## Harness readiness

[Readiness evidence](evidence/situated-harness-readiness-20261104.json) records 18 passing contract checks, four exact compiled-route request captures, and three expected browser outcomes: baseline welcome/guide completion, candidate completion after delayed transcription readiness, and model drift blocked before any welcome or response. Browser media and transport are synthetic, with no page errors. The final staged production build, TypeScript and lint pass. The original active checkout and its VAD edits remain untouched.

The isolated runtime at `/tmp/soulfire-situated-runtime-20261104` comes from frozen candidate commit `6a08401`. The only staged runtime substitutions are a server-only baseline instruction selector, the archived baseline instruction module and matched 1,500ms VAD. Both text and voice go through the compiled application routes. Capture-only transport verifies that their exact payloads match the plan for both arms; 73 compiled assets are hashed before live execution. [Build manifest](evidence/situated-runtime-build-20261104.json) records the substitutions and hashes. No credentials or private environment file were copied into staging. Temporary model/data stores are outside the project.

The Node entry point `scripts/run-situated-comparison.cjs` defaults to an unstarted report with no key lookup, model requests, server start or ledger mutation. Its explicit authorization flag must only be supplied after Miguel approves this allocation. The gated path checks the frozen schedule, fixture and build hashes, refuses a previous run or occupied evaluation ports, rechecks exact model metadata, reserves $10.15 against the cumulative ledger before generation, and starts isolated baseline/candidate servers on 3114/3115 with the existing key kept server-side. Each scheduled request gets a separate conservative obligation; failures/uncertain outcomes retain their reservation. Browser capture is always replaced by local synthetic audio. Any drift, unexpected context/config mutation, premature or extra reply, incomplete output, deadline or cap violation stops the stage without retry. Only its own servers/browser are closed afterward. Nothing deploys or restarts the user's preview.

Offline verification exposed and corrected a data-store path inside the project and a synthetic cleanup issue before any paid run. The duplicate staging tree was also moved out of the workspace so it cannot contaminate root TypeScript resolution. These were harness preparation failures, not model results. The complete paid-stage orchestration has deliberately not been invoked under the authorization flag; successful provider negotiation, invoices, model quality and real-audio behavior cannot be certified offline.

## Runtime privacy audit

The candidate runtime diff is limited to inline strings in `src/lib/agent.ts`. No file reads, path literals, tools, retrieval imports, embeddings, private facts or vault-derived data assets were added. Static inspection found no vault/Wisdom/private project paths in `app` or `src`; existing filesystem access belongs to unrelated local music/data features. The text provider remains identical to baseline and includes memory only when explicitly supplied through the existing opt-in path. Offline capture confirms empty-memory inputs consist solely of each fictional case. Native instructions likewise contain only the shared strings, language and empty practice title. This establishes no new runtime vault dependency; it does not claim unrelated user-supplied future context can never contain private information.
