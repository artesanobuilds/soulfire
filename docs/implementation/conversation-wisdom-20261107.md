# Conversation-first shared wisdom, November 7, 2026

The runtime now includes the complete **curated** Soulfire shared guidance on every text and voice request, including the first turn. `src/lib/soulfire-wisdom.ts` provides an explicit source registry, all twelve conceptual steps, the generalized NA chapter-derived material, four distinct interpretive lenses, practical principle directions and research limits. This is not verbatim ingestion of every historical research file, and it does not load private Wisdom Vault material or personal reflections. No retrieval ranking can omit a step from this curated set.

The companion considers tentative step connections privately, answers the actual request first and need not name a step. Plain language suppresses theological language and step labels. Addiction-aware wording and spiritual preference remain independent. Only steps 1, 3, 10 and 11 have interactive exercise schema support; the broader knowledge does not claim eight additional worksheets exist.

## Source coverage and limits

- Creator's interpretations: `docs/context/twelve-steps.md`, all twelve entries, distinguished from AA source wording.
- Principle vocabulary: `docs/context/step-principles-map.md`, distinguishing proposed Soulfire core from secondary NA *Step Working Guides* attributions and the non-approved common list.
- PDF-derived generalizations: reviewed November 5 extension in the original checkout's pending `docs/context/step-principles-map.md`. The original was read, not changed or blindly copied. The source registry preserves the official NAWS [Introductory Guide](https://na.org/wp-content/uploads/2024/05/1200_Introductory-Guide-English.pdf), *How It Works*, printed 28–101 / PDF 36–109, and per-step page references. This chapter corresponds to sixth-edition *Basic Text* chapter 4, printed 17–53. The existing private provenance record identifies the official PDF SHA-256 as `6ca5526368adca3ad9da419dd2de7fb6f84d23f07d4453a450e2663375a0a902`. That record and generalized extension were inspected, not a new independent line-by-line PDF verification. Source PDFs are not copied, embedded or redistributed.
- Step 1's eleven consequences are preserved with the distinction that everyday pattern reflection is a Soulfire adaptation, not a validated warning checklist, ordered relapse stages or prediction. Step 2 preserves the revised invitation to a Higher Power of one's own understanding and a valid secular path. Step 3 preserves surrender plus agency. Step 11 preserves uncertainty around theology and immediate desires.
- Additional perspectives: the project synthesis and original supplied commentary for Jung, Maté, Ghiyam and Hudson. These are distinct interpretive lenses, not verified quotations, clinical protocols, impersonations or endorsement.
- Research dossier: included as a bounded research perspective, not raw numerical efficacy or neuroscience claims. Human-led program findings do not establish app benefit. Source citation verification and reuse review remain open.

No separate Tulsa tradition or corpus was found in the project context. This implementation treats the request as referring to Soulfire's existing wisdom; confirm if a different source was intended.

## Optional practice offer contract

Runtime `Reply` retains the existing message/kind/exercise fields and adds optional nullable `practiceOffer: {kind: "exercise" | "current" | "meditation", label: string}`. Labels are bounded to 100 characters; extra properties are rejected. Existing three-field fixtures remain valid. Strict provider schemas require a nullable offer, including `null` in reflection mode. Runtime rejects offers on support or practice replies. Conversation exercise remains `null`.

An offer is a choice, not creation or playback. The user must explicitly choose exercise generation, Current or meditation tools and separately authorize any required generation/playback there. No model-authored URLs, autoplay, provider/tool calls or hidden side effects are part of the offer. The text instructions suppress unsolicited offers when a person declines, repeats reassurance without a new need, or needs urgent support. Current/Ember availability is determined by their actual controls; the model cannot promise an available generated asset. Reflection intent does not invite a replacement exercise.

## Validation meaning

Deterministic tests cover complete prompt composition, source references, schema compatibility, bounded offers and preserved safety/language instructions. Prompt snapshot hashes are intentionally changed: older paid/model evaluations do **not** validate this new revision. No paid inference, clinical evaluation, deployment or publishing is performed for this change. Human review of conversational usefulness and real model behavior remains necessary.

Local validation at this integration point: all 346 unit tests in 32 files passed; `tsc --noEmit`, scoped ESLint for the wisdom/schema/instruction files and tests, and `git diff --check` passed. These runs used synthetic/mocked providers, not paid inference. UI and other workers may subsequently add tests.

## Subsequent Step Three creator clarification

Added the creator's November 7 clarification to the actual Step Three section in both source-map checkouts without replacing their divergent existing content. The runtime now includes replaying an interview, loosening the grip on unknown outcomes, turning things over in the person's chosen belief language or a secular equivalent, and optional meditation/Current before Step Eleven. Practical responsibilities, remaining uncertainty, declining and explicit media actions are preserved; repeated worry does not invite repeated reassurance or practice offers. A dedicated regression checks these boundaries. Step Two remains unchanged.

## Subsequent Step Four creator clarification

Added the creator's November 7 emphasis to Step Four in both preserved source maps and runtime: guided conversational resentment inventory for a spouse, boss or another relationship, shifting from control of the other person to one's observable conduct and available choices. The companion must ask rather than assign fault; a boundary or no fault to own can be the answer. Abuse/no-contact safeguards and the distinction from an unimplemented dedicated Step Four worksheet remain explicit.

## Subsequent Step Five creator clarification

Both source maps and runtime now name contextual human-witness choices: sponsor, recovery friend, priest, spiritual guide, mentor, a friend further along similar spiritual work, or therapist/counselor. Family or significant others may be too involved, without a blanket exclusion. Trust, privacy, readiness and boundaries matter more than titles; AI prepares rather than replacing human sharing. Repeated per-step provenance boilerplate is consolidated globally while all source identities and exact page references remain available. Experiment budget limits are unchanged.

## Subsequent Step Six creator clarification

Both source maps and runtime now frame Step Six as honest introspection and a list of self-identified character defects, including Step Four discoveries such as reactivity or excessive justification. Readiness to let patterns go and use healthier tools retains the optional Higher Power dimension and secular language choice, without guaranteeing disappearance or labeling illness, disability or trauma symptoms as defects.

Step Six validation limit: the historical production-text comparison reservation is now $0.151965 against its unchanged strict $0.15 cap. The budget regression is intentionally still failing; no allocation or test threshold was raised and no paid call was made. Earlier all-green counts above describe prior revisions, not this latest prompt. Preserve the substantive creator guidance and safeguards before any further prompt compaction.

The subsequent explicit Step Six ordering approval is now recorded in both maps and runtime: revisit Step Four, list recurring patterns/costs, choose one, reflect on readiness (including Higher Power help if welcomed), then invite a small healthier-response experiment. The experiment follows rather than displaces introspection.

## Subsequent Step Seven continuity approval

Both maps and runtime now explicitly continue Step Six into Step Seven using the same user-identified pattern/character-defect wording and belief language. Readiness in Six leads to asking for help/removal and practicing a different response in Seven, without resetting the inventory, inventing missing context or promising disappearance. Step Six's approved order remains unchanged.

## Subsequent Step Eight everyday-harms clarification

Both maps and runtime now include major and subtle same-day harms, with coworker, spouse and children examples examined rather than presumed. Proportionate timely repair remains a choice: Eight lists/readies, Nine considers whether/how/when safely, and Ten supplies daily reflection. Discomfort, disagreement, healthy limits and being harmed do not establish wrongdoing; no automatic apology or contact follows.

## Subsequent Step Nine repair-and-surrender clarification

Both maps and runtime now connect responsible repair to Step Three: choose appropriate conduct and release control over the other person's response. Major and small daily harms include an optional real-time pause and sincere apology for recognized snappiness, without repeated reassurance apologies. Safety/no-contact safeguards, changed conduct, indirect repair options and the Eight/Nine/Ten distinctions remain intact. No automatic contact or required reconciliation is introduced.

## Step Ten mini-inventory refinement

The daily mini-inventory now belongs primarily to Step Ten, including routing from seemingly minor day-to-day problems. Steps Eight and Nine retain small/major harms, readiness and safe repair respectively without duplicating the daily review. Nine can accompany Ten as a reference to discern whether an amend is appropriate, without presumed harm or pressure; actual repair depends on conduct, impact, choice and safety. Negative feelings or disagreements alone do not establish harm. Both source maps and runtime preserve the approved real-time apology and safety boundaries.

Step Ten routing checks are deterministic prompt/source-contract tests, not evidence of live model routing quality. The inventory remains optional, including declining or stopping; plain-language repair references do not require step labels.

## Step Eleven early meditation expansion

Both maps and runtime now permit optional pause/meditation/prayer from day one, with careful prayer receptivity and a fully secular path. The creator's eventual 30-minute daily aspiration is optional, not a clinical dose or guaranteed outcome. Static inspection of `src/components/EmberPanel.tsx` and `src/domain/ember.ts` confirmed builder durations 2/5/10/15/20, stock local voice or captions, guidance density, intentions and sound. `src/components/Soulfire.tsx` confirms quiet timer 1/2/5. One-minute pause and 30-minute aspiration are not misrepresented as Ember settings. No media starts automatically and urgent support takes precedence.

## Step Twelve contextual-exposure gate

Both maps/runtime now ground voluntary service, sharing learned wisdom, welcomed Soulfire suggestions and discussing insights with one's therapist. Proactive Twelve requires explicit current-context exposure to each of 1–11 or explicit self-report of familiarity with all eleven. Unknown/incomplete context suppresses proactive Twelve; no durable tracker or completion/sponsorship certification exists. Direct questions, ordinary service requests, recovery/human referrals and urgent help remain available without this prerequisite. Capacity, consent and non-recruitment remain explicit. These are prompt/source-contract safeguards, not live-model gating validation.
