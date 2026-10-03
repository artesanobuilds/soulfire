# Design decisions

Record explicit choices separately from exploratory proposals. Preserve earlier artifacts when a direction changes; add a superseding decision rather than erasing the history.

## D-001 · Sage and gold visual direction

**Date:** October 2, 2026 (America/Los_Angeles)

**Status:** Selected by the creator.

**Decision:** Proceed with the sage-and-gold landing and identity direction, using logo A, the sheltered flame, as the working mark. The palette direction is approved; final logo geometry, typography, layout, and color accessibility still require refinement.

**Reason:** Soulfire should feel steady, welcoming, and contemplative when someone arrives with something difficult. Sage carries calm and grounding; the gold flame preserves warmth and possibility. The amber-and-charcoal alternative felt more energetic and made fire more dominant.

| Role | Starting color | Intended use |
|---|---|---|
| Warm ivory | `#FDF8EF` | Main surfaces and generous breathing room |
| Deep sage | `#4C6456` | Working logo enclosure, key headings, primary actions |
| Antique gold | `#B88945` | Inner flame and restrained decorative accents |
| Charcoal | `#292C28` | Body text |

These are starting tokens from the exploration, not measured colors extracted from the generated image. Verify contrast in implementation, including interaction states. Gold is not the default body-text color.

**Reference:** Right-hand concept in [landing palette comparison](landing/landing-palette-comparison.png), and the middle column of [logo A color exploration](identity/logo-a-color-exploration.png).

**Carry forward:** spacious composition, crisp and readable typography, restrained decoration, and text/dictation/voice entry. Final font choices and copy are open. Generated step labels and illustrative exercise copy are not approved program content.

**Alternatives retained:** amber/charcoal, terracotta/plum, the S monogram, and the original symbol explorations. See the [artifact index](README.md).

**Next refinement:** turn the working mark into consistent vector geometry, design the mobile and desktop landing in a browser, and verify small-size legibility and contrast. No final brand availability or originality claim is established.

## D-002 · Consistent palette across screens and section directories

**Date:** October 2, 2026 (America/Los_Angeles)

**Status:** Requested by the creator.

Apply sage and gold across the practice screen as well as the landing. Replace the initial amber-tinted practice panels with a consistent sage treatment and restrained gold accents. See the [corrected concept](practice/first-practice-sage-gold.png); retain the [original](practice/archive/first-practice-concept-v1.png) as a superseded artifact.

Organize artifacts by section: identity, landing, and practice. Preserve the existing explorations and update document links when moving them. The root index and decisions log tie the sections together.

## D-003 · Proof of Concept One review refinements

**Date:** October 3, 2026 (UTC)

**Status:** Parent design reviewer approved the sage/ivory direction and requested these specific refinements; this does not settle the open theology or program decisions.

Browser-native screens preserve the sheltered flame, selected palette, serif hierarchy and secondary conversation panel. The first implementation follows the strategy's bounded Steps 1/3/10/11 recommendation, with all twelve steps visible and later exercises explicitly marked. Four journey examples remain distinct and labeled. No accounts or automatic saving are implied.

After reviewing mobile invitation, full acceptance practice, privacy and conflict screenshots, the reviewer requested: connection status beside the composer/voice controls; automatically expanding filled action/practice textareas; tested dialog focus trapping/restoration; short-height mobile checks. All are implemented. Native modal keyboard traversal needed an explicit first/last focus loop; Escape restores the invoking control. Practice fields remain editable and private until selected for sharing.

Actual browser screenshots and the section gallery live in [review](review/index.html). Loading/service-error/microphone-denial captures are clearly identified as simulations. No live model or audio round-trip claim follows from those images.
