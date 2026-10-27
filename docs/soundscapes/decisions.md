# Current: product and design decisions

## 2026-10-27 — D001: Current name and light river direction selected

**Decision owner:** user. **Status:** selected for continued design exploration; not an implementation approval.

The feature is named **Current**. Preserve its graphically rich, immersive river identity while lightening the UI to match Soulfire. The selected direction uses warm ivory/cream, pale sage, soft gold, a daylight river landscape, dark teal text and clear controls.

This supersedes the previous recommendation to use plain “Soundscapes” as the feature/navigation name and the predominantly dark deep-teal Current treatment. A descriptive subtitle such as “Soundscapes” or “Personalized listening” may help, but its exact wording is not yet selected.

The initial entry remains a standalone upper-navigation feature. Placement within the underlying twelve-step-informed model remains explicitly undecided. Final logo execution, precise layout, parameter controls, engine/content approach and trademark/name clearance remain open.

**Rationale:** the user preferred Current's rich graphic concept but found its dark appearance inconsistent with the rest of the app. The goal is a coherent lighter interpretation, not a new unrelated visual style or a loss of graphic richness.

**Delivered design reference:** [Current light concept](concept-reference.md), `soulfire-current-light-concept.png`, Library `libfile_8699801f8b188191b065e923b75f1758` (follow its latest version rather than pinning the first-delivery PNG). Delivered on 2026-10-27; referenced in Library, not locally archived. It illustrates the selected direction without approving every layout detail or implementation.

**Scope boundary:** documentation and design only. This decision does not authorize building navigation/UI, an audio backend, generated audio, wearable or clinical features, framework integration, paid services or a remote push. Existing app behavior and running voice sessions stay unchanged.

Related: [Product/design brief](product-design-brief.md), [concept references](concept-reference.md), [open questions](open-questions.md). The original research archive remains unedited.

## 2026-10-27 — D002: Soulfire masterbrand, Current feature identity

**Decision owner:** user. **Status:** selected design hierarchy; not an implementation approval.

Keep the existing **Soulfire logo/wordmark in the global app header**. Current is the feature name/title below it, supported by a smaller, distinct river/current emblem and its own rich scene imagery. The feature should stand out within the app while remaining visibly part of Soulfire, not become a separate app brand or replace the global header logo. The user's correction establishes the masterbrand spelling as **Soulfire**.

Preserve D001's lighter palette: warm ivory/cream, pale sage, soft gold, daylight river art, dark teal text and clear controls. Exact emblem drawing, typography spacing and detailed layout remain open.

**Rationale:** connect the feature with the overall app while letting its imagery have a distinct identity. This settles the hierarchy, not the implementation details or a final asset file.

**Design reference:** the [latest Current light concept](concept-reference.md) remains under Library `libfile_8699801f8b188191b065e923b75f1758`. The visual revision uses that same identity, so consumers should follow the latest Library version rather than an old backing-file ID. No local revised PNG bytes are assumed or archived by this decision.

**Scope boundary:** documentation/design only; no UI, audio/backend implementation, framework integration, remote push or app restart. The standalone Current entry and undecided later practice-model integration are unchanged.

## 2026-10-27 — D003: standalone local prototype authorized

The user subsequently asked to build Current fully into the prototype beside Simulations in the top navigation, and separately authorized publication of the Current documentation/research. This supersedes the earlier documentation-only execution boundary for the local prototype, not its privacy/evidence limits.

The prototype uses local procedural Web Audio textures and soft synthesized tones, deterministic versioned recipes, deliberate playback and opt-in browser-local recipe saving. It requires no new audio service, account, credentials or model calls. Sound choice is based on explicit goals/preferences/exclusions and simple local sound-word matches, not diagnosis or inferred neurological states.

Documentation publication is a separate commit directly on published main: `4d2ba91d6cbda67a0d1c03e827be0ab049965352`, branch `docs/current-experience`. That branch does not include the unpublished welcome/voice or Current implementation ancestors. The user explicitly approved publishing the original uploaded research and related docs to `artesanobuilds/soulfire` after the initial approval review rejection.

Current implementation remains local until separately requested for publication. Integration into the underlying practice model is still undecided and not implemented. See [implementation and validation](implementation.md).
