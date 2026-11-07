# Integrated Soulfire studio · 7 November 2026

## Scope

This integration brings the existing voice/guidance experiment history, unified practice studio, conversation-first streaming interface, all-twelve-step project guidance and approved public wisdom retrieval into main. It preserves the previously uncommitted Step Three–Twelve refinements and the original checkout's additional source/practice-design extension.

The reviewed public wisdom subset is integrated directly without a feature flag: 22 newly authored conceptual summaries from eight public sources. Text and recorded/reasoned voice select at most three relevant references; native live voice receives the bounded collection at startup. The complete twelve-step core remains present. See [runtime scope and approval](../wisdom-vault/RUNTIME-REVIEW.md).

The public repository receives only the approved public projection, code, tests and general documentation. The full private master map, artifact inventory and linked authoring references remain local and Git-ignored. No private source notes, transcripts or PDFs are published or supplied to the provider.

## Verification

- 373 unit tests in 33 files passed, including actual mocked provider request composition and safety bypass.
- TypeScript, full ESLint, whitespace checks and production build passed.
- A clean public-only checkout, with no private map or inventory, separately passed all 373 unit tests, typecheck and production build.
- Full desktop/mobile browser suite: 267 passed, 33 gated/skipped. A separate isolated synthetic-memory/history run passed 36 cases, including 16 additional cases. **283 distinct browser cases passed.** Sixteen audio-fixture cases were not run in this environment; one desktop instance is intentionally mobile-only. No claim that all 300 cases ran.
- Fourteen local-only authoring checks passed, including provenance hashes, rejected stale reviews, private-file exclusion and exact reviewed export.
- Independent read-only review of the runtime/publication boundary found no actionable blocker.

All provider transports used in tests were mocked or the local server was credential-free. No paid model test, live conversational-quality evaluation, public app deployment or change to provider budgets was performed. Existing historical model-quality results do not validate this expanded prompt. Source availability does not establish a license to reproduce source wording; exported guidance is original conceptual paraphrase, not endorsement or clinical evidence.

## Repository consolidation

The remote originally exposed main and experiment/unified-practice-studio-20261105; the fetch configuration only tracked main, so all remote heads were explicitly inventoried. Local conversation-first and voice-pause branches and historical experiments/voice and experiments/guidance tracking references were also inspected. All are in the integration ancestry; there was no divergent unmerged feature branch to discard. Branch cleanup is limited to references whose tips are verifiably ancestors of the final main commit.

The original running port-3100 app is not restarted by this work. Git/source integration does not itself replace a running production build. Temporary credential-free validation servers are stopped after checks. Private authoring files remain available locally rather than being removed with branch references.
