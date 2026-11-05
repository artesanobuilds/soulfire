> November 5 follow-up: the approved paid comparison is now complete. See [results, costs and remaining limits](vault-independent-guidance-results-20261105.md). The initial preparation record below is preserved as historical evidence.

# Vault-independent situated support candidate — November 4, 2026

Implemented on an isolated review branch from `a73e1b15ced1958fc6d33277fddd8731027ca376`. This is an unvalidated behavioral candidate, not demonstrated parity with vault-backed answers. No deployment, merge, active-preview restart, private retrieval integration or paid generation occurred.

## Evidence and interpretation

Inspected the actual local November 2 four-way artifact set: README, metadata, current text response, ordinary ChatGPT response, exact vault-backed response, and the complete native source-fix-verification response. Private inputs, outputs, names, filenames inside the vault and third-party story are deliberately excluded here. The parent review reports one assessed case, assistant ratings, and blank user ratings; this does not establish superiority across scenarios.

The vault-backed answer connected emotional acknowledgment, near-term responsibilities, room for a later conversation, and boundaries through one's own conduct. Current Sol text already supplied several practical distinctions and a factual clarifying question. Complete native voice mainly summarized facts and offered a generic choice, missing material practical responsibilities. The ordinary ChatGPT answer was much longer and included speculative interpretations; length alone is not quality. The vault-backed answer also proposed unendorsed commitments and a leading motive question; those are not behaviors to reproduce.

This comparison is confounded: text used Sol; native voice used gpt-realtime with a short delivery target; the vault arm used Astra/medium with filesystem retrieval and about 53 seconds of visible work; ordinary ChatGPT's model was undisclosed and memory enabled. All arms were not matched for context, model, reasoning budget, response length or orchestration. Native failures also included premature VAD turns before the later full-input runs. Do not attribute every difference to the voice model, retrieval, ASR, or private knowledge. Shared instructions already addressed facts, agency, optional spirituality and urgent support before this change. Earlier factual-slot and evidence-frame prompt revisions failed; adding clauses is not evidence that factuality improves.

## Candidate change

`src/lib/agent.ts` adds the same general situated-support guidance to text and voice. It connects supplied circumstances to feasible action; separates immediate duties from a later difficult conversation; permits feelings without forcing calm; preserves safety/no-contact boundaries; holds accountability alongside legitimate needs; and avoids inventing commitments or leading hidden-motive questions. It is general editorial synthesis, not copied source material or teacher attribution. No vault files, embeddings, paths or personal history are needed at runtime.

Simple spoken replies retain the 30–60-word target. Complex situations may use about 100 words to retain material duties, actions and boundaries. The existing 900-token cap and native transport remain unchanged. This trades possible extra spoken duration and input tokens for room to address material constraints; latency, cost and quality effects are unmeasured. Two changes are bundled, so a later evaluation should ablate shared guidance versus voice length allowance before attributing gains.

The existing active checkout's uncommitted 1500ms VAD change and test remain untouched on `fix/voice-turn-pause-20261102`. This branch deliberately does not include that separate change. For any future native comparison, hold the effective VAD setting constant in both arms and state whether testing baseline timing or the separately fixed timing. Never treat the candidate branch as including the VAD fix.

## Evaluation and acceptance

The baseline passed 239 unit tests before edits. Candidate contract coverage verifies both real request builders receive the shared guidance and retains model, output schema, storage and native settings checks. Prompt hashes now identify the candidate; the historical evaluated hashes remain in Git history. Hash tests establish composition, not semantic behavior.

`evaluations/situated-support-20261104.json` preregisters eight invented cases before collecting candidate model outputs: duty handoff, uncertain obligation, no-contact safety, unendorsed apology/availability, repeated reassurance after repair, a one-sentence request, voluntary non-leading reflection, and practice compatibility. These are prospective regression cases, not an independent held-out quality result. No model responses have been collected or scored. Keep the rubric out of model input.

A future authorized bounded evaluation should compare baseline and candidate using the same model/settings, intent, language, empty memory and no retrieval. Preserve every attempt and incomplete/refused result; report each criterion per case rather than an opaque composite. Include repeated samples and an independently authored unseen set. For voice, preserve exact ASR and effective session settings, annotate material transcription errors and premature turns, and score content separately from audio onset, completion, interruptions and total spoken duration. A text-fed Realtime probe does not establish ASR or turn-taking performance. No person microphone is needed for synthetic trials.

Acceptance requires no new invented facts/commitments, no safety/no-contact regression, valid practice controls, and better context-specific action without compulsory reflection or longer answers to simple requests. Any gain remains bounded to assessed cases. Voice drafting remains unresolved and this candidate must not be labeled parity achieved.

## Budget and remaining gate

Read the authoritative local `soulfire-evaluation-budget-20261030.json`: cumulative reservations **$18.2540549467** of **$30**, leaving **$11.7459450533**. These are obligations/reservations, not invoiced spending. No new reservation or paid call was made because authorization for a new paid stage was not clear. A later paid stage needs an explicitly authorized finite allocation and conservative reservation including failures/ASR before starting.

A subsequent [bounded comparison plan and no-cost probes](situated-evaluation-plan-20261104.md) prepare exact model/settings/cost bounds. Offline capture passes; a local Qwen surrogate stops on an incomplete baseline answer, leaving candidate semantics unassessed. No paid stage has started.

Remaining: real matched model evaluation, independent unseen cases, voice delivery/latency assessment and user review. Prompt changes alone cannot establish parity. More invasive retrieval, hybrid model routing or deterministic drafting changes should follow evidence and a concrete product decision rather than being silently added here.

## Software verification

- Baseline: 239 tests passed across 22 files.
- Candidate: 240 tests passed across 22 files; TypeScript, lint and isolated production build passed.
- Browser subset: 44 distinct checks passed across desktop/mobile API, voice protocol and live-voice files. Initial run passed 42 and skipped 2 history checks because SOULFIRE_TEST_ISOLATED was unset; both passed in a targeted rerun with that flag against the same isolated key-free server/data directory. Synthetic transport only; no paid provider or physical microphone.
- Original sandbox browser attempt could not launch/access localhost (EPERM); retained locally separately from the authorized outside-sandbox run. It is an environment failure, not a model result.
