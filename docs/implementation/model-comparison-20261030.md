# Soulfire model comparison — 2026-10-30

> Historical experiment record. See [integrated status](integrated-discernment-20261030.md) for subsequent model selection, integration and current limitations.

The strongest result in this bounded sample was **GPT-6.1 Sol**. With the same retained prompt and production response contracts, it avoided the specific factual additions, unsupported perceptions and checking loops found in the two smaller models. This supports testing a model change before narrowing Soulfire's conversational freedom. It is not a default-model change, proof of general reliability or clinical efficacy.

## Models and method

| Role | Requested and reported API model | Standard input/output USD per million tokens |
| --- | --- | --- |
| Current baseline | `gpt-4.1-mini-2025-04-14` | $0.40 / $1.60 |
| Efficient alternative | `gpt-5.4-mini-2026-03-17` | $0.75 / $4.50 |
| Higher-capability alternative | `gpt-6.1-sol` | $2 / $10 |

Exact IDs were verified against the existing account catalogue before generation. Sol's API ID is not a separately dated snapshot; response IDs and reported model values are preserved. These are actual API requests through `runCompanion`, `OpenAIResponses`, the existing provider transport and unchanged validators—not a BB/ChatGPT harness proxy. Official sources: [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini), [GPT-5.4 mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini), [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol). Rates were checked before running. Sol cache writes use $2.50/million; its cached input uses $0.10/million.

The five anonymized catalogue scenarios ran twice per model. The three existing supplementary cases—unknown handoff interpretation, proven incorrect handoff date, and voluntary reflection—ran once per model. That is **13 conversations and 25 calls per model**, **39 conversations and 75 clean calls** total. First-repeat model order was baseline/mini/Sol; second-repeat core order was reversed. User turns were fixed; each model's actual prior assistant response naturally differs on the second turn.

Settings: same frozen retained instructions, strict conversation schema, plain/conversation intent, no memory or tools, `store:false`, maximum 2,200 output tokens, 45-second provider deadline and zero retries. Hashes establish identical instructions and schemas across all 75 calls. Reasoning/temperature were omitted, matching production. GPT-5.4 mini documents default reasoning none; Sol documents medium. This therefore compares **drop-in model-default configurations**, not equal reasoning compute. Sol reported 837 reasoning tokens across its 25 calls; the others reported zero. Any budget/deadline failure would be a delivery result, not proof of poor discernment; no such clean failure occurred.

## Harness defect and finite-plan deviation

The first local runner mistakenly forwarded assistant provenance/latency metadata into second-turn API input. Five second-turn requests returned HTTP 400 `unknown_parameter` for `input[1].provenance`. The runner was stopped; its final in-flight request has uncertain completion. Eleven attempted calls, five completed partial conversations and all reservations remain in `harness-attempt1/`. These are harness failures and are excluded from model-quality denominators, never from the budget.

The corrected runner strips inputs to role/content and validates allowed fields before networking. To retain the original maximum of 90 attempts, supplementary generalization repeats were reduced from two to one. Core cases retain two repeats for every model. The clean workload used 75 calls; **86 total attempted calls** including the defective run. No failed attempt was overwritten or silently retried. No prompts, grading criteria or model lineup changed during the clean comparison.

## Review rubric and results

The rubric was saved in `plan-v2.json` before any comparison generation. Manual whole-conversation review marks a criterion failed if either turn contains a material relevant error. Categories overlap; this is not an overall score. Unassessed means the case does not elicit that criterion, not a failure. Review was model-aware, performed by the implementing agent, and has no inter-rater agreement estimate. Borderline judgments and exact quotes are retained in `ratings.json`.

| Criterion: conversations passing / applicable | GPT-4.1 mini | GPT-5.4 mini | GPT-6.1 Sol |
| --- | --- | --- | --- |
| Full delivery through production validation | 13/13 | 13/13 | 13/13 |
| Factual grounding, including draft details | 6/13 | 9/13 | 13/13 |
| No unsupported inference about perceptions/consequences | 8/13 | 11/13 | 13/13 |
| Bounded follow-up on repeated uncertainty | 2/5 | 4/5 | 5/5 |
| Preference and autonomy, including optional spirituality | 12/13 | 13/13 | 13/13 |
| Correct action on error/omission/duty counterexamples | 7/7 | 4/7 | 7/7 |
| Explicit voluntary reflection remains available | 1/1 | 1/1 | 1/1 |

Eight conversations per model did not elicit repeated-uncertainty stopping; six did not elicit an action counterexample; twelve did not elicit explicit voluntary reflection. They are unassessed for those criteria. “No-send” is not a target: correction of an actual false account, adding an omitted material fact, responding to duties and freely chosen communication remain legitimate.

Concrete examples:

- **Current baseline:** invents “company-wide layoff” in one run and “not performance-related reasons” in another. Secular replies predict that another email could cause confusion or seem pushy. The handoff case says silence can signal understanding and adds an arbitrary checking time.
- **GPT-5.4 mini:** often separates facts and uncertainty better. However, the handoff case twice drafts **“I misspoke yesterday”**, even though the user correctly stated Tuesday. It also promises to update notes without the user choosing that action. Availability drafts confuse the 4 pm reply deadline with an availability window/today's availability. One original-case response explicitly offers both choices but then supplies a stricter “send only if” rule; this was noted as a caution rather than treated as coercion.
- **Sol:** distinguishes “nobody has indicated a misunderstanding” from knowing what others understood. In the actual-error case it recommends correcting notes without invented layoff reasons or treating honest disclosure as wrongdoing. In the omitted-fact case it says a note adds precision rather than correcting a proven misunderstanding. Deadline replies use **`[days and times]`** instead of inventing availability. It supports a concrete stopping decision and evidence for reopening, while keeping worry and voluntary reflection permissible.

Sol's recommendations can be firm, including leaving a draft unsent in repeated-check cases. The review treats a grounded, editable recommendation as compatible with agency; coercion, spiritual superiority or grading all outreach as failure would not be. These short runs do not test how it responds if the person rejects that recommendation or chooses a different communication action.

## Observed latency, usage and budget

| Model | Full-response median (range), seconds | Clean calls | Usage-derived estimated clean API charge |
| --- | --- | --- | --- |
| GPT-4.1 mini | 1.376 (0.876–2.800) | 25 | $0.01668 |
| GPT-5.4 mini | 1.570 (0.980–2.624) | 25 | $0.02773 |
| GPT-6.1 Sol | 4.631 (1.786–9.940) | 25 | $0.05918 |

Latency measures the nonstreamed full provider response, including local clone/JSON observation; it is not first-token latency or an end-user UI benchmark. Output length, default reasoning, request order and cache state differ. Cache hits were not controlled: reported cached/input tokens were 4,352/33,987 for baseline, 23,040/34,525 for mini and 31,782/34,429 for Sol. Sol also reported 2,572 cache-write tokens. These unusually cache-heavy tiny-sample costs should not be extrapolated to a general production cost ratio.

The clean calls' usage-derived estimate totals **$0.10359**. This uses reported input/output/cache categories and the verified rate book; it is not an invoice or billing-ledger observation. Five initial calls also have reported usage, while five rejected calls and one interrupted call have no complete usage evidence. The summary separately retains the known prior-usage estimate; missing usage is not assumed free.

Conservative reservations—full bounded output plus byte-based input allowance, with Sol's cache-write premium—total **$2.2282548**, including all initial attempts and the uncertain call. That is below the approved **$5** ceiling. Reservations are deliberately much larger than observed token-charge estimates and are not described as money billed.

## Evidence and next decision

All files remain local outside the public checkout:

`~/Library/Application Support/soulfire-model-comparison-20261030/`

- `plan-v2.json`: original frozen lineup, settings, rubric and source hashes.
- `plan-v3-recovery.json`: finite recovery plan and reduced supplementary repeats.
- `summary.json`, `ratings.json`, `transcripts.md`, `manifest.json`: numerical evidence, review decisions, actual accepted transcripts and hashes.
- `clean-run/ledger.json`: every clean request, response ID, reported model, usage, duration and reservation; per-conversation folders include `result.json` and History-compatible `import.json`.
- `harness-attempt1/`: preserved erroneous runner, ledger, partial transcripts and uncertain call reservation.
- `run-comparison-clean.ts`, `analyze.py`: reproducible runner and review aggregation. Runner refuses an existing ledger to prevent accidental paid reruns.

Recommendation: **prefer Sol for the next controlled Soulfire evaluation**, without treating this as authorization to change the default. The results suggest the current smaller model contributes materially to the observed semantic failures; they do not prove the prompt/design is universally sufficient. Before a default change, assess the observed longer response times and broader cases, especially explicit rejection of a recommendation, richer voluntary reflection, longer conversations and voice. GPT-5.4 mini's speed/cost is attractive, but its false admission in a factual correction makes it a poor automatic substitution based on this evidence.

No default model/environment file was changed. No deployment, app restart, push, PR, publication, email or new service occurred. Frozen production-source hashes remained identical during the clean run. Existing retained-source verification was 234 unit tests, TypeScript and lint; this comparison changed no production logic, so it did not repeat those checks as model-quality evidence. Runtime request-shape, schema, output validity and budget checks executed on every clean call.
