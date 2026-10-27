# Custom soundscapes: preliminary product and design brief

Status: exploratory proposal, 2026-10-27. Review alongside the [original research and provenance](research/PROVENANCE.md). This is a design brief, not an implementation specification or a statement of clinical efficacy.

## Product intent and scope

Give someone a small, welcoming place to choose a listening goal, hear an understandable sound mix and adjust it to their own taste. The goal is useful, controllable listening rather than a claim that Soulfire can diagnose a state or prescribe an acoustic treatment.

The initial proposal is a separate **Soundscapes** item in the upper navigation. It would open a dedicated surface rather than silently adding sound to an existing practice. Where soundscapes might fit within the underlying twelve-step-informed model is explicitly undecided. No integration is proposed for implementation now.

## A possible first journey

1. **Choose a goal.** Ask **“What would you like support with?”** Offer **Focus**, **Unwinding**, **Settling a busy mind** and **Just exploring**. An optional short text field can add context without requiring a diagnosis, health history or account. The wording and choices remain candidates for review.
2. **Choose sound taste and exclusions.** Let the person prefer or avoid water, nature, soft instrumental textures, rhythmic movement and noise. Ask about intensity, desired duration and whether voices or abrupt changes should be avoided. Skip is a valid answer; no location, personality or clinical inference fills the gaps.
3. **Suggest an editable mix.** Show a descriptive name, a small visual identity and the actual ingredients. For example, **Quiet Current** could be a water layer plus a soft instrumental texture. Explain the connection to explicit choices: “A gentle water layer and slow changes, because those are the sounds you chose.” Do not imply the app measured a brain state.
4. **Preview deliberately.** Present a clear Play preview button and a quiet initial volume. Creating or selecting a mix must not start playback. Explain what will play and provide an accessible Stop control throughout.
5. **Adjust and compare.** Allow layer mute and level changes, overall volume, gentler/more-present texture, duration and fades. Keep changes gradual and let the person return to the previous recipe. Raw “brainwave” or frequency prescriptions are not part of this proposed first experience.
6. **Keep only by choice.** Ask whether to save the recipe/preferences separately from any journal or conversation history. A recipe can be named without retaining sensitive free text. An optional “helpful / distracting / unpleasant” check-in can inform the next choice without turning it into a clinical score.

These are proposed interaction steps only. No screens, player, backend or generation service have been built for them.

## Look and feel directions to compare

Keep Soulfire's warm ivory, deep green, quiet gold, generous spacing and readable controls. The soundscape identity should feel like part of the same place. The [delivered concept board](concept-reference.md) explores Soundscapes / Current / IsoTune. The parent review recommends a plain Soundscapes nav label with Current's immersive deep-teal river art direction; the user has not selected a final direction. The additional possibilities below are written explorations, not an independent description of the board's pixels.

| Direction | Visual idea | How it relates to listening | Watch-out |
| --- | --- | --- | --- |
| **Water and horizon** | A small landscape or layered contour mark, slow water-like forms | A clear scene identity with familiar Soulfire materials | Do not imply every goal is relaxation; focus mixes also need a place |
| **Quiet layers** | Translucent bands or a few rounded contour lines | Makes the constituent layers and editable recipe understandable | Avoid a technical mixing-desk appearance as the default |
| **Evening grove** | Soft botanical silhouettes and restrained grain | Warm, tactile identity for nature-led scenes | Keep contrast high; do not make dark visuals imply a sleep treatment |

Motion should remain optional and restrained. Use a static alternative for reduced motion. Do not use flashing, strobing, or visual flicker synchronized to experimental audio frequencies. During listening, an optional subtle level-responsive cue should describe actual playback, with text status available independently of animation.

**Naming is open.** “Soundscapes” is a useful descriptive navigation label. Experiential candidates such as “Quiet Current,” “Soft Horizon” or “Inner Weather” are brainstorming examples, not cleared names. The source proposes IsoTune, Sintonía, Heartscape, Cadence and Inner Tempo. None is adopted or independently cleared for trademark, store or domain availability. Names suggesting a neurological or physiological mechanism may overstate what a first version does.

## Player, accessibility and privacy requirements to resolve

- No autoplay on navigation, suggestion, generation completion or returning to a saved recipe. Avoid unexpected resumption after interruption or reload.
- Keep volume, pause and Stop visible and keyboard/screen-reader accessible. Stop should respond immediately; a de-click ramp must not become a long forced fade. Provide layer mute, a duration timer and configurable end fade.
- Use gentle transitions and prevent clipping/sudden peaks. Include low-intensity choices and easy exclusion of noise, pulsing, voices or disliked textures. A person can find a sound unpleasant even if it helped another study population.
- A browser volume setting or digital peak limit cannot certify the sound pressure at a listener's ear. Do not label a slider as calibrated dBA or promise a safe exposure dose without an appropriate measurement/calibration path. Hearing exposure depends on level and duration; review the [WHO safe-listening guidance](https://www.who.int/news-room/questions-and-answers/item/deafness-and-hearing-loss-safe-listening) before setting listening guidance.
- Provide text names for layers, visible focus, sufficient contrast, touch targets and static motion alternatives. Do not rely on stereo positioning, color or animation alone to convey controls or state.
- Resolve coexistence with the existing ambient player, narrated welcome and live voice before implementation. Audio should not unexpectedly layer or fight another player; the person needs an understandable pause/duck/stop policy.
- Minimize optional free text. Save preferences/recipes only with a clear choice, and keep that consent separate from conversation history. Define deletion/export and retention before persistence. Do not send wellness text or inferred states to third parties by default; later model processing would need an explicit, understandable disclosure and choice.
- Do not introduce IP geolocation, wearable access, health-record connections, clinical questionnaires or hidden mood/personality inference as part of this proposal.

## Engine choices — proposed direction, not a decision

| Approach | What it would honestly create | Main engineering questions |
| --- | --- | --- |
| **Owned/licensed stems plus a controllable mixer** | A custom mix of identified ingredients | Rights and redistribution, seamless loops, headroom, fades, reproducibility, mobile audio lifecycle and offline/cache behavior |
| **Procedural synthesis and mixing** | A parameterized generated texture/mix | Sound quality, parameter bounds, CPU/battery use, accessibility and stable recipes across devices |
| **Generated stems, then mixing** | Newly generated ingredients assembled into a controllable mix | Cost, latency, moderation, licensing, provenance, repeatability and long-form continuity |
| **A fully generated track per request** | A new rendered recording | Whether edits can be precise, how previews/cancellation work, ongoing cost, availability and repeatability |

**Engineering recommendation for discussion:** compare a small owned/licensed stem library and deterministic recipe mixer first. It gives the team a controllable way to test the experience and ingredient preferences. This is a proposal about implementation control, not an evidence-based acoustic prescription. Generation versus procedural mixing remains unapproved and undecided.

An LLM could later help select an allowed recipe or title, but it is optional and should not be confused with composing music. If the system only mixes existing stems, call the result a **custom mix**, not newly composed music. Retain the layer asset IDs/versions, gains, approved parameters, duration/fades and any seed needed to reproduce the recipe. No model or paid audio service is called for this documentation task.

## Evidence boundaries and review notes

The [archived source report](research/audioscape-research-and-naming.md) includes condition mappings, evidence grades, effect sizes, parameter recommendations and naming suggestions. Preserve it as research input. Its grades and recommendations are the report's assertions, not Soulfire's validated product specification.

- Inconsistent binaural entrainment evidence does not support a promise to put someone's brain into a target state. See the [systematic review](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0286023).
- Music-modulation attention work is preliminary and includes disclosed commercial conflicts. The reviewed paper has order-dependent findings; its modulation-depth experiment did not show a significant main effect. Do not convert this into a “stronger modulation improves your focus” rule. See the [primary paper](https://www.nature.com/articles/s42003-024-07026-3).
- Evidence about subjective sleep quality from listening does not establish that this unbuilt app treats insomnia. Therapist-led music interventions and self-directed app listening are different settings. See [Cochrane's adult insomnia review](https://www.cochrane.org/evidence/CD010459_music-insomnia-adults).
- Group-level findings, including contrasting responses to noise, do not justify diagnosing a listener or mapping a diagnosis to a recipe. Defer phenotype/ADHD screening, clinical scales, HRV/EEG sensing and 40 Hz/binaural promises. Let people express preferences and stop or change what feels unhelpful.
- Keep any future benefit statements tentative and testable. Do not promise cognitive enhancement, treatment, cure or a specific mood outcome. Review intended use and claims against the [FDA general-wellness guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/general-wellness-policy-low-risk-devices); this brief is not a regulatory determination.

An initial evaluation should ask whether people understand the suggestion, can tell what is playing, can control it comfortably and prefer a particular recipe. Comparisons with a matched fixed mix or silence can help separate preference and novelty from a claimed adaptive benefit. Clinical efficacy studies, wearable adaptation and clinical outcome collection would require a separate reviewed plan.

## Before building

Choose a visual direction and working label, review the proposed journey, settle the first engine/content-rights approach, define audio interruption/privacy behavior, and approve a small usability/listening test plan. Track unresolved decisions in [Open questions](open-questions.md). No practice-model integration, UI implementation or remote publication is authorized by this documentation commit.
