# Soulfire: proposed product and prototype strategy

## Direction

Build a standalone responsive web prototype for phones and desktop, using OpenAI APIs for the companion and exercise generation. Keep a future ChatGPT app possible through reusable backend tools and exercise definitions. This is a recommendation reflecting the creator's interest in a standalone app, not a finalized platform decision.

The defining experience is a twelve-step spiritual practice with personalized exercises for every step. Conversation discovers a person's struggle; interactive practice helps them apply spiritual principles; a small chosen action connects the practice to daily life.

The [step–principles map](../context/step-principles-map.md) adds a shared vocabulary for this loop. Use it to inform exercise selection, principle explanations, and suggested actions while keeping the proposed Soulfire core distinct from fellowship-attributed mappings. A future structured catalog should retain step IDs, principle IDs, source/proposal status, and exercise links. These relationships support personalization across steps rather than requiring one principle per step or a rigid linear progression. The supplied map is reference context, not a mandatory policy for every interaction.

A standalone app offers control over navigation, the twelve-step practice map, consent, saved progress, meditation interactions, and the relationship between chat and exercises. ChatGPT apps can support custom UI too; generative UI is not exclusive to standalone apps. Current platform limits and submission rules require verification rather than assumptions.

Begin with one responsive web codebase. Validate actual phone and desktop use before investing in native apps. An installable web app can follow if useful, but background timers, audio, notifications, and screen-lock behavior require device testing. Revisit native development if those become essential.

## How the dossier changes the design

Use the [supplied dossier](../research/soulfire-research-dossier.md) as a source of hypotheses and exercise concepts. Preserve the creator's context separately from research interpretations and product decisions.

| Finding or proposal in the dossier | Product implication | Qualification |
|---|---|---|
| Reflection paired with a specific action | End suitable exercises with one optional if-then action | Broad behavior-change research is a rationale, not validation of Soulfire |
| Community is important in recovery | Support preparing to connect with people | AI should not become the sole witness or substitute fellowship |
| Spiritual framing should fit the person | Ask about preferred language; permit doubt and revision | Never infer belief or require it |
| Brief meditation as an on-ramp | Offer short daily practice with stop and grounding controls | Avoid claiming one-minute practice has established therapeutic effects |
| Accountability can become shame or blame | Focus on specific actions; allow no fault and skip options | Do not require ownership of harm inflicted by others |
| Surrender can become avoidance | Pair acceptance with agency and practical action | The creator's theology remains distinct from a clinical or universal claim |
| Companion use can become reliance | Favor useful sessions and real-world connection | Correlations do not establish that app use causes dependence |

Do not turn the research into blanket rules that require the app to diagnose depression, trauma, or OCD before choosing an exercise. Use expressed needs, contextual concerns, and user choice; obtain qualified review of sensitive flows. Grounding is an optional support, not a guaranteed treatment.

## Generative exercises and UI

The exercise should be generated for the person, not merely a fixed worksheet with their name inserted. Generation can adapt the focus, prompts, number of sections, example situations, spiritual vocabulary, sequence, and next action. It may assemble a new exercise from approved building blocks while retaining a clear purpose and step connection.

Use a versioned, schema-validated exercise specification rendered by trusted UI components. The model supplies structured content; it does not supply executable JavaScript, arbitrary HTML, external URLs, or arbitrary tool names.

Initial component vocabulary:

- Reflection prompt and optional text response.
- Card sorting through accessible tap or keyboard controls.
- Choice chips and descriptive readiness scales.
- Pattern cards and inventory entries.
- If-then action planning.
- Prayer framing and reflection.
- Locally controlled meditation timer.
- End-of-practice reflection and optional save.

An exercise specification should record its ID, schema version, step and principles, purpose, content blocks, source references, generator/model version, and intended reflection or action. Supported blocks have bounded lengths and known interaction types. Unknown components or invalid output trigger a safe fallback or bounded regeneration, not partial execution.

The application enforces pause, skip, sharing controls, and grounding independently of generated content. A model cannot remove them. Submitted answers are user data, not instructions to change the agent's rules. Research retrieval is reference material, not executable authority.

Example: for work anxiety, the model might assemble an acceptance card sort, a prompt about the feared outcome, an optional prayer for steadiness, and an if-then plan for the next meeting. For compulsive checking, it could choose a short awareness practice and a practical environment change. Neither should assert a diagnosis or guarantee relief.

## Agent harness and data boundaries

Start with a single companion workflow, not a team of autonomous agents:

1. Understand the stated struggle and ask only useful clarification.
2. Offer a principle and suggested practice; let the person choose or revise it.
3. Retrieve reviewed source or exercise guidance as needed.
4. Generate and validate an exercise specification.
5. Render the exercise and run client interactions without extra model calls for every keystroke.
6. Share only the answers the person explicitly elects to send for reflection.
7. Offer a chosen action and optional saved practice summary.

Use the OpenAI Responses API with structured outputs and a small set of application tools, subject to verification against current official documentation. Consider the Agents SDK for orchestration and evaluation if it simplifies the actual workflow; it is not a prerequisite for an agent. Choose a model through quality, latency, and cost evaluation rather than fixing a model name now.

Run API calls on the server. Keep keys out of the browser. Initially use a small reviewed reference set; add search or retrieval when the volume warrants it. Do not feed the whole unverified dossier into the system prompt as authoritative guidance.

Do not promise that unsaved responses are invisible to OpenAI. Distinguish:

- Draft answers that remain in browser memory and are not sent for reflection.
- Content deliberately sent to the model through the backend.
- Data the person explicitly saves in Soulfire.

Keep raw private answers out of analytics, traces, and error reports. Review actual provider retention settings before making privacy claims. Browser-local persistent storage is not equivalent to encryption or secure backup. Start with ephemeral drafts; add accounts and persistence once their purpose and deletion controls are clear.

## First prototype

Show all twelve steps as a practice map. Initially implement a complete, personalized loop using Steps 1, 3, 10, and 11:

**Name a struggle → choose a relevant principle → generate an interactive exercise → optional meditation → reflect → choose one small action.**

Why this slice: it demonstrates personalization, varied UI, daily practice, and agency before implementing sensitive disclosure or amends flows. The full product goal remains exercises for every step; deeper inventories, human witnessing, and amends follow deliberate review.

Suggested initial stack: TypeScript, React with Next.js, a server-side OpenAI client, and JSON Schema or Zod validation. This is an implementation proposal. No native app, vector database, multi-agent system, or complex backend is needed to demonstrate the first loop.

## Decisions still open

The dossier sometimes treats unresolved choices as rules. Do not silently adopt them:

- It declares that AI does not complete Step Five, while the creator has left that question open. Recommended prototype stance: preparation for human sharing; keep the philosophical decision open.
- It interprets Step One as powerlessness over what has already arisen. Confirm this before rewriting the creator's broader wording.
- It interprets Step Eleven as trusting the aspiration and surrendering the path. Confirm this theology rather than presenting it as agreement.
- Its default "my part" and harm toggle require further design. Do not make someone label their experience as abuse to avoid blame.
- "Once a day" inventories are a proposed product constraint, not an established treatment rule. Keep frequency flexible without encouraging compulsive checking.

These do not prevent building the first prototype with clearly labeled, reversible defaults.

## Evidence and launch work

Before public evidence claims, verify the primary sources, especially the brief-meditation claim, reported effect sizes, AI trial scope, observational findings, and Huberman references. A single 13-minute trial does not prove it is the shortest studied dose. The dossier's "practice comes before belief" and some mechanism claims may overstate what observational data establish.

Verify current OpenAI API requirements, ChatGPT app rules if relevant, and applicable jurisdiction-specific requirements. Treat the dossier's legal and platform summaries as leads rather than current authoritative guidance. Review source permissions before displaying AA material publicly; no third-party contact is authorized by the dossier itself.

Obtain qualified review of high-stakes coaching, crisis, withdrawal, trauma, and spiritual-distress flows before a public pilot. Avoid claiming therapy, clinical efficacy, or guaranteed awakening. Use appropriately scoped, location-aware support rather than assuming every person is in the U.S.

## Recommended next moves

1. Storyboard three contrasting journeys: work conflict, compulsive checking, and spiritual uncertainty. Specify generated exercise screens and the boundaries between private drafts, model sharing, and saving.
2. Define the exercise schema, trusted component library, companion instructions, and a small reviewed knowledge set.
3. Build the responsive prototype slice and test its actual functional loop on phone and desktop, including timer pause/resume and malformed-output fallbacks.
4. Evaluate approximately 30 meaningful scenarios: ordinary struggles, differing beliefs, user corrections, shame, blame, no-contact amends, withdrawal, crisis, destabilizing meditation, dependency, and prompt injection. Evaluate UI specifications as well as conversational responses.
5. Run a small consenting adult alpha after appropriate review. Ask whether the practice felt specific, useful, respectful, and doable, and whether it led to a real-world action. Investigate pressure, confusion, shame, and unwanted reliance. Completion and time spent are not measures of spiritual progress or clinical effectiveness.
6. Expand to reviewed exercises for every step; add optional persistence, reminders, native capabilities, or a ChatGPT integration only when observed needs justify them.

This phase establishes whether the experience helps people practice. It does not establish clinical efficacy.
