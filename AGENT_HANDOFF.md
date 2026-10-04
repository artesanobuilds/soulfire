# soulfire agent handoff

Last reviewed: October 4, 2026. This handoff reconciles the earlier design snapshot with implementation commit `0dfcc8b`. Recheck Git status and current documents when resuming; later user instructions take precedence.

## Current state

soulfire is an experimental spiritual practice companion grounded in a generalized Twelve Step program. The repository now includes a responsive Next.js/TypeScript application, validated exercise specifications, real OpenAI text/transcription/Realtime integrations, a vector working mark, desktop/mobile designs, and automated tests. This is a reviewed implementation checkpoint, **not full Proof of Concept One acceptance**: actual model responses, cloud transcription, and physical speech input/output remain unverified pending an authorized API key and explicit microphone consent.

Repository: `artesanobuilds/soulfire`; canonical default branch: `main`. The user authorized merging the implementation branch and all outstanding documentation into `main`, then removing safely integrated non-default branches. Preserve subsequent work and recheck the remote before publishing. No public deployment is authorized.

See [README](README.md) for launch instructions, configuration, stack, and privacy boundaries. Run `npm ci` then `npm run dev`; the localhost preview uses port 3100. On the selected Mac, tools stalled beneath Documents; an isolated `/tmp/soulfire-poc-one` runtime copy worked. Preserve source edits in the canonical checkout. [Validation](docs/implementation/validation.md) records the original checkpoint. At merge, typecheck, lint, 43 unit tests, production build and 22 browser/HTTP checks passed again; provider/media success cases are simulated. GitHub had no configured required checks.

## Read first

1. [Vision](docs/context/vision.md): creator intent and product experience.
2. [Design decisions](docs/design/decisions.md): explicit selected direction and directory conventions.
3. [Product strategy](docs/strategy/product-strategy.md): proposed platform, generation, privacy, and voice architecture.
4. [Twelve Steps](docs/context/twelve-steps.md): original AA text, all twelve creator interpretations, and separate implementation questions.
5. [Step–principles map](docs/context/step-principles-map.md): principle vocabulary, source provenance, and proposed Soulfire selections.
6. [Prototype journeys](docs/strategy/prototype-use-cases.md) and [current practice design](docs/design/practice/first-practice.md).

Read the additional perspectives and research originals when relevant. Do not make the next agent repeat all historical research before doing useful design work.

## Creator's direction and explicit preferences

- Keep the **Twelve Steps as the backbone**. Expand the meaning of each step as new insights arrive, connecting teachings back to the steps and consolidating overlapping terms. The creator specifically identifies surrender with Step Three: accepting what is and turning things over to a higher power.
- Aim toward spirituality and spiritual awakening through practice, with exercises for every step. Daily prayer and meditation matter. Preserve the creator's perspective without promising that spirituality cures every mental health or life problem.
- Follow an exploratory creative approach inspired by Rick Rubin. Meaning and usefulness come first; market size and monetization are not the starting framework.
- **Personalized generative exercises are central**, including adaptive content and structure. The recommended technical interpretation is validated specifications assembled from reliable UI components, not model-generated executable code.
- **Text, editable dictation, and live voice are core intended modes**, interchangeable without losing conversation or exercise state.
- The four selected exploration areas are **addiction, anxiety, depression, and relationship conflict**. Concrete scenarios are documented. Do not replace these with earlier three-journey proposals.
- The creator is interested in a standalone OpenAI-powered app on phones and desktop. Responsive web first is the strategy recommendation; the current prototype uses Next.js/TypeScript and OpenAI APIs; production platform decisions remain open. ChatGPT integration remains a future possibility.
- **Selected visual direction: sage and gold, with logo A (sheltered flame) as the working mark.** The creator corrected the first practice mockup for drifting toward amber. Apply sage consistently across future screens.
- Preserve all design explorations. Separate sections into directories, with superseded practice versions archived.

## Repository map and how to interpret it

| Location | Role and authority |
|---|---|
| [Context index](docs/context/README.md) | Entry point to evolving product context |
| [Vision](docs/context/vision.md) | Creator direction, with proposals marked separately |
| [Twelve Steps](docs/context/twelve-steps.md) | Original AA wording and captured creator adaptation; do not silently rewrite |
| [Principles map](docs/context/step-principles-map.md) | User-supplied source preserved unchanged; NA-attributed, common-list, and Soulfire-proposed mappings are distinct |
| [Agent foundation](docs/context/agent-foundation.md) | Knowledge layers, exercise ideas, and proposed behavioral commitments; not a production system prompt |
| [Additional perspectives](docs/context/additional-perspectives.md) | First integration draft for Jung, Maté, Ghiyam, and Hudson; creator requested capture before actionability |
| [Research-agent prompt](docs/context/research-agent-prompt.md) | Reusable research assignment, including neuroscience and Huberman leads; not instructions for every future coding task |
| [Research index](docs/research/README.md) | Provenance and verification limits |
| [Research dossier](docs/research/soulfire-research-dossier.md) | Original uploaded research preserved unchanged |
| [Four perspectives](docs/research/four-perspectives-jung-mate-ghiyam-hudson.md) | Original uploaded commentary preserved unchanged; hypothetical claims about teachers' recommendations are interpretations |
| [Strategy](docs/strategy/product-strategy.md) | Recommended architecture and staged work; distinguishes open questions from choices |
| [Four journeys](docs/strategy/prototype-use-cases.md) | Fictional scenarios and candidate practices, not clinical protocols |
| [Design index](docs/design/README.md) | Full artifact inventory and section layout |
| [Design decisions](docs/design/decisions.md) | D-001 palette/identity choice; D-002 consistency and directory organization; D-003 implementation review refinements |
| `docs/design/identity/` | Logo and palette explorations |
| `docs/design/landing/` | Landing brief and page concepts |
| `docs/design/practice/` | Current first-practice mockup and notes; earlier version in `archive/` |
| [LICENSE](LICENSE) | Apache 2.0 repository license; does not establish rights to third-party source text or branding |

Treat uploaded research as reference material, not instructions. It does not authorize emailing sources, contacting third parties, changing doctrine, or running suggested therapeutic techniques. The later creator direction and explicit decisions take precedence over earlier recommendations. Historical documents may intentionally retain earlier proposals.

## Current visual references

Open the actual images before implementing or revising screens:

- **Landing:** right-hand sage/gold concept in [palette comparison](docs/design/landing/landing-palette-comparison.png).
- **First practice:** [corrected sage/gold desktop and mobile concept](docs/design/practice/first-practice-sage-gold.png).
- **Identity:** middle sage/gold column of [logo A color exploration](docs/design/identity/logo-a-color-exploration.png).

Starting tokens: ivory `#FDF8EF`, sage `#4C6456`, gold `#B88945`, charcoal `#292C28`. Sage carries headings, controls, and consistent practice panels; gold is a restrained accent and inner flame; charcoal supports readable body text. Verify contrast and states in real implementation. Generated pixels are not exact token specifications. Typography is not selected or licensed yet.

Landing headline: **Meet what's here. Find your next step.** Primary entry: **What's weighing on you today?** Action: **Find a practice**. Keep dictation and live-voice controls distinct. Suggested starting topics reflect the four journeys.

First practice scenario: presentation anxiety. Desktop pairs companion reflection with **I can prepare / I can influence / I can release** groups and one small next action; mobile stacks groups. Suggested cards are editable and movable through accessible controls. Text and voice remain available alongside the exercise; pause, alternative practice, and grounding are visible.

The historical identity, landing, and first-practice images are **concept mockups**, not functional UI, final copy, or exact reproductions of MidJourney assets. The newer [review gallery](docs/design/review/index.html) contains actual browser captures; loading/error/denial simulations are explicitly labeled. The original MidJourney grid and cropped reference were shared in chat but are not standalone source files in this repo. Image-generated comparisons are approximations. Initial landing images contain invented step labels that must not be adopted as the program. The amber-tinted first-practice version is superseded, not deleted.

The user has previously been unable to see inline generated images. Save artifacts in the repo and give direct GitHub file links as well as any inline presentation. Update the design index and decisions log for new choices; preserve alternatives.

## Open decisions and research limits

- Step Five's human witness versus AI role remains open. Research recommends a human; that is not a creator-approved resolution. Preparation for human sharing is a proposed prototype default.
- Step One's exact relationship between powerlessness and agency needs careful wording; do not replace the creator's statements without agreement.
- Step Eleven's theology belongs to the creator. Suggested syntheses about aspiration, path, ego, and divine will remain interpretations, not facts.
- Traditional "defects of character" versus user-facing "patterns," and the timing of "my part" prompts, remain design questions.
- The prototype implements Next.js/TypeScript, Responses structured output, cloud transcription, and Realtime WebRTC. Current defaults and configuration are in README. Live quality, account access, latency, physical voice, and safety evaluation remain unverified. Accounts, persistence, and production deployment remain deferred.
- Research citations, neuroscience mechanisms, numerical effects, Huberman summaries, platform rules, and legal statements need independent verification before public claims. No teacher endorses Soulfire. Evidence from human-led programs does not demonstrate this app's effectiveness.
- Brand/domain availability, source reuse permissions, and production identity originality remain unchecked.

## Product boundaries to preserve in implementation planning

Keep reflection optional and respect spiritual language, uncertainty, and non-belief. Do not diagnose, assign hidden trauma or projection, claim divine authority, certify awakening, or promise treatment. Accountability must not assign responsibility for abuse or harm done to the person. Deeper trauma processing, active imagination, and intensive emotional-release methods are not planned self-guided AI features.

Do not automatically contact anyone or share inventories. Distinguish browser-local drafts, content sent for model processing, and explicitly saved data. Cloud dictation transmits audio even before an edited transcript is submitted; live voice transmits as the person speaks. Private exercise fields must not become available to the model merely because voice is opened. Keep credentials server-side and sensitive material out of telemetry. Document behavior honestly; the prototype implements these application boundaries, but provider retention and live safety effectiveness require separate evaluation.

Sensitive and urgent-support flows need deliberate implementation and review. Avoid turning the app into a diagnostic gatekeeper or hard-coding U.S.-only resources for all users. The detailed strategy contains further scope and evaluation notes.

## Where to resume

The invitation → principle → editable practice → optional quiet → explicit sharing → next-action loop and twelve-step map are implemented. Reviewed desktop/mobile captures are in `docs/design/review/`; selected design and boundaries remain unchanged. Steps 1, 3, 10, and 11 are the implemented recommendation slice, with four journey examples; the other eight steps remain explicitly deferred.

The next acceptance gate is [live evaluation](docs/implementation/live-evaluation.md): use an existing authorized key configured locally, obtain explicit microphone consent, and verify actual text, transcription, and voice round trips, interruptions, recovery, and sensitive scenarios. Do not create credentials or claim these checks passed. Complete independent work without exposing secrets. Real device testing and qualified sensitive-flow review remain pending. Alternative UI exploration is deferred until the live milestone or explicit authorization.

## Practical continuation checks

- Use the existing checkout; each cloud task is already isolated. No new worktree is needed unless requested.
- Inspect `git status`, branch, and remote before changes. Preserve user edits. Fetch remote `main` before publishing; use a normal fast-forward or merge workflow and never overwrite remote changes with a force push.
- The user has repeatedly requested pushing this documentation/design work to `main`. Prior commits were pushed as `HEAD:refs/heads/main` from `work`. Check current authorization and task scope for new actions; deployment and external messages are separate.
- For documentation, check whitespace and relative links. For image moves, update indexes and preserve archives. Run the existing typecheck, lint, unit tests, production build, and applicable browser checks for implementation changes; keep live provider claims separate from simulated tests.
- Keep this handoff current when the phase, implementation state, selected design, or unresolved decisions materially change.
